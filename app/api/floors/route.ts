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

function mapFloorRow(row: Record<string, unknown>) {
  return {
    id: row.id,
    index: row.index,
    label: row.label,
    kind: row.kind,
    baseElevationM: Number(row.base_elevation_m),
    heightM: Number(row.height_m),
    description: row.description,
    isDemo: row.is_demo,
  };
}

export async function GET(request: NextRequest) {
  const supabase = getSupabase(request.headers.get("authorization") ?? undefined);

  const { data, error } = await supabase
    .from("floors")
    .select("*")
    .order("index", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    floors: (data || []).map(mapFloorRow),
  });
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase(request.headers.get("authorization") ?? undefined);

  try {
    const body = await request.json();

    const { data, error } = await supabase
      .from("floors")
      .insert({
        id: body.id,
        index: body.index,
        label: body.label,
        kind: body.kind,
        base_elevation_m: body.baseElevationM,
        height_m: body.heightM,
        description: body.description,
        is_demo: body.isDemo ?? true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(mapFloorRow(data), { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}