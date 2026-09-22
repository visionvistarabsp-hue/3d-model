import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabase(authHeader?: string) {
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    return createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

function mapShopRow(row: Record<string, unknown>) {
  return {
    id: row.id,
    shopNumber: row.shop_number,
    unitId: row.unit_id,
    floorId: row.floor_id,
    name: row.name,
    status: row.status,
    category: row.category,
    areaSqM: Number(row.area_sqm),
    frontageM: Number(row.frontage_m),
    depthM: Number(row.depth_m),
    price: row.price_currency ? {
      currency: row.price_currency,
      sale: row.price_sale ? Number(row.price_sale) : undefined,
      leaseRateSqm: row.price_lease_rate_sqm ? Number(row.price_lease_rate_sqm) : undefined,
    } : null,
    modelObjectName: row.model_object_name,
    images: row.images || [],
    brochure: row.brochure,
    description: row.description,
    media: row.media || [],
    coordinates: row.coordinates,
    isDemo: row.is_demo,
    demoNotice: row.demo_notice,
    updatedAt: row.updated_at,
  };
}

export async function GET(request: NextRequest) {
  const supabase = getSupabase(request.headers.get("authorization") ?? undefined);
  const searchParams = request.nextUrl.searchParams;

  const floorId = searchParams.get("floorId") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const limit = parseInt(searchParams.get("limit") || "100");
  const offset = parseInt(searchParams.get("offset") || "0");

  let query = supabase
    .from("shops")
    .select("*")
    .range(offset, offset + limit - 1);

  if (floorId) query = query.eq("floor_id", floorId);
  if (status) query = query.eq("status", status);
  if (category) query = query.eq("category", category);
  if (search) {
    query = query.or(`id.ilike.%${search}%,shop_number.ilike.%${search}%,name.ilike.%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    shops: (data || []).map(mapShopRow),
    total: count,
    limit,
    offset,
  });
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase(request.headers.get("authorization") ?? undefined);

  try {
    const body = await request.json();

    const { data, error } = await supabase
      .from("shops")
      .insert({
        id: body.id,
        shop_number: body.shopNumber,
        unit_id: body.unitId,
        floor_id: body.floorId,
        name: body.name,
        status: body.status,
        category: body.category,
        area_sqm: body.areaSqM,
        frontage_m: body.frontageM,
        depth_m: body.depthM,
        price_currency: body.price?.currency,
        price_sale: body.price?.sale,
        price_lease_rate_sqm: body.price?.leaseRateSqm,
        model_object_name: body.modelObjectName,
        images: body.images || [],
        brochure: body.brochure,
        description: body.description,
        media: body.media || [],
        coordinates: body.coordinates,
        is_demo: body.isDemo ?? true,
        demo_notice: body.demoNotice,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(mapShopRow(data), { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}