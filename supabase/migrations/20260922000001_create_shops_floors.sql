-- Supabase migration: create shops and floors tables
-- Run this via: supabase migration up

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Floors table
create table if not exists public.floors (
    id text primary key,           -- G, F1, F2, B1, etc.
    index integer not null,        -- 0-based sort order
    label text not null,           -- "Ground Floor", "First Floor"
    kind text not null check (kind in ('basement', 'ground', 'upper')),
    base_elevation_m numeric not null,
    height_m numeric not null check (height_m > 0),
    description text,
    is_demo boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Shops table
create table if not exists public.shops (
    id text primary key,                           -- SHOP_G_001 format
    shop_number text not null,                     -- G-001 display number
    unit_id text,                                  -- internal pipeline id
    floor_id text not null references public.floors(id),
    name text not null,
    status text not null check (status in ('available', 'reserved', 'leased', 'under_construction')),
    category text not null check (category in ('retail', 'food_and_beverage', 'entertainment', 'services', 'wellness', 'anchor', 'office', 'common')),
    area_sqm numeric not null check (area_sqm >= 0),
    frontage_m numeric not null check (frontage_m >= 0),
    depth_m numeric not null check (depth_m >= 0),
    price_currency char(3),                        -- ISO 4217
    price_sale numeric check (price_sale >= 0),
    price_lease_rate_sqm numeric check (price_lease_rate_sqm >= 0),
    model_object_name text not null,               -- must equal id
    images text[] not null default '{}',           -- storage keys
    brochure text,                                 -- storage key
    description text,
    media jsonb not null default '[]',             -- [{kind, key, label}]
    coordinates jsonb,                             -- {x, y, z, polygon: [[x,z],...]}
    is_demo boolean not null default true,
    demo_notice text,
    updated_at timestamptz not null default now(),
    created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_shops_floor_id on public.shops(floor_id);
create index if not exists idx_shops_status on public.shops(status);
create index if not exists idx_shops_category on public.shops(category);
create index if not exists idx_shops_is_demo on public.shops(is_demo);

-- RLS Policies
alter table public.floors enable row level security;
alter table public.shops enable row level security;

-- Public read access for demo data
create policy "Public read demo floors" on public.floors
    for select using (is_demo = true);

create policy "Public read demo shops" on public.shops
    for select using (is_demo = true);

-- Authenticated users can read all (for admin)
create policy "Authenticated read all floors" on public.floors
    for select using (auth.role() = 'authenticated');

create policy "Authenticated read all shops" on public.shops
    for select using (auth.role() = 'authenticated');

-- Admin write policies (using service role or specific admin check)
create policy "Admin write floors" on public.floors
    for all using (auth.jwt() ->> 'role' = 'admin');

create policy "Admin write shops" on public.shops
    for all using (auth.jwt() ->> 'role' = 'admin');

-- Updated at trigger
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end $$;

create trigger set_floors_updated_at
    before update on public.floors
    for each row execute procedure public.handle_updated_at();

create trigger set_shops_updated_at
    before update on public.shops
    for each row execute procedure public.handle_updated_at();

-- Building view (for convenience)
create or replace view public.building_summary as
select
    'MALL_DEMO_001'::text as id,
    'Demo Mall (procedural)'::text as name,
    jsonb_agg(
        jsonb_build_object(
            'id', f.id,
            'index', f.index,
            'label', f.label,
            'kind', f.kind,
            'baseElevationM', f.base_elevation_m,
            'heightM', f.height_m,
            'description', f.description,
            'isDemo', f.is_demo
        ) order by f.index
    ) as floors,
    count(s.id) as shop_count
from public.floors f
left join public.shops s on s.floor_id = f.id
where f.is_demo = true;