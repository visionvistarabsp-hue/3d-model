import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabase(authHeader: string | undefined) {
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = getSupabase(request.headers.get("authorization") ?? undefined);
  const { id } = await params;

  const { data, error } = await supabase
    .from("shops")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(mapShopRow(data));
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = getSupabase(request.headers.get("authorization") ?? undefined);
  const { id } = await params;

  try {
    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    if (body.shopNumber !== undefined) updateData.shop_number = body.shopNumber;
    if (body.unitId !== undefined) updateData.unit_id = body.unitId;
    if (body.floorId !== undefined) updateData.floor_id = body.floorId;
    if (body.name !== undefined) updateData.name = body.name;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.areaSqM !== undefined) updateData.area_sqm = body.areaSqM;
    if (body.frontageM !== undefined) updateData.frontage_m = body.frontageM;
    if (body.depthM !== undefined) updateData.depth_m = body.depthM;
    if (body.price !== undefined) {
      updateData.price_currency = body.price.currency;
      updateData.price_sale = body.price.sale;
      updateData.price_lease_rate_sqm = body.price.leaseRateSqm;
    }
    if (body.modelObjectName !== undefined) updateData.model_object_name = body.modelObjectName;
    if (body.images !== undefined) updateData.images = body.images;
    if (body.brochure !== undefined) updateData.brochure = body.brochure;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.media !== undefined) updateData.media = body.media;
    if (body.coordinates !== undefined) updateData.coordinates = body.coordinates;
    if (body.isDemo !== undefined) updateData.is_demo = body.isDemo;
    if (body.demoNotice !== undefined) updateData.demo_notice = body.demoNotice;

    const { data, error } = await supabase
      .from("shops")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(mapShopRow(data));
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = getSupabase(request.headers.get("authorization") ?? undefined);
  const { id } = await params;

  const { error } = await supabase
    .from("shops")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}