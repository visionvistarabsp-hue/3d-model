/**
 * Authoritative Data Ingestion Pipeline (Phase 8)
 *
 * Converts architectural drawings (DXF, DWG, PDF) into the mall data structure:
 * - Floor plans → Floor records + shop boundaries
 * - Layer naming conventions → Shop IDs (SHOP_<FLOOR>_<SEQ>)
 * - Text annotations → Shop metadata (name, category, area)
 *
 * This is a SEPARATE pipeline from the web app. It outputs:
 *   - data/authoritative/shops.json
 *   - data/authoritative/floors.json
 *   - data/authoritative/model.json (manifest)
 *   - Blender script to generate GLB
 *
 * The web app consumes these via the same StorageClient + ShopRepository interface.
 */

import type { Shop, Floor, Building, ShopCoordinates, ShopMediaAsset } from "@/types";
import { shopObjectName } from "@/lib/select/shop-id";
import { parseShops, parseFloors } from "@/lib/validation/schemas";

export interface RawFloorPlan {
  floorId: string;
  name: string;
  elevation: number;
  height: number;
  polygons: RawShopPolygon[];
}

export interface RawShopPolygon {
  shopId: string;
  floorId: string;
  name: string;
  category: string;
  polygon: [number, number][]; // [x, z] coordinates in meters
  area: number;
  frontage: number;
  depth: number;
  metadata?: Record<string, string>;
}

export interface IngestionResult {
  building: Building;
  floors: Floor[];
  shops: Shop[];
  blenderScript: string;
  warnings: string[];
}

/**
 * Main ingestion function - converts raw floor plan data to authoritative mall data.
 * In production, this would parse DXF/DWG/PDF files.
 */
export function ingestFloorPlans(rawPlans: RawFloorPlan[]): IngestionResult {
  const warnings: string[] = [];
  const floors: Floor[] = [];
  const shops: Shop[] = [];

  for (let i = 0; i < rawPlans.length; i++) {
    const raw = rawPlans[i];

    // Validate floor
    if (!/^[A-Z0-9]+$/.test(raw.floorId)) {
      warnings.push(`Floor ${raw.floorId}: invalid ID format`);
      continue;
    }

    const floor: Floor = {
      id: raw.floorId,
      index: i,
      label: raw.name,
      kind: i === 0 ? "ground" : "upper",
      baseElevationM: raw.elevation,
      heightM: raw.height,
      description: `Authoritative floor from ${raw.floorId}`,
      isDemo: false,
    };
    floors.push(floor);

    // Process shop polygons
    for (const poly of raw.polygons) {
      const shopId = poly.shopId || shopObjectName(raw.floorId, shops.filter(s => s.floorId === raw.floorId).length + 1);

      // Validate shop ID
      if (!/^SHOP_[A-Z0-9]+_\d{3,}$/.test(shopId)) {
        warnings.push(`Shop ${shopId}: invalid ID format`);
        continue;
      }

      // Calculate centroid for coordinates
      const centroid = calculateCentroid(poly.polygon);

      const shop: Shop = {
        id: shopId,
        shopNumber: `${raw.floorId}-${shopId.split("_")[2]}`,
        unitId: `UNIT-${shopId}`,
        floorId: raw.floorId,
        name: poly.name || `Shop ${shopId}`,
        status: "available",
        category: normalizeCategory(poly.category),
        areaSqM: Math.round(poly.area * 10) / 10,
        frontageM: Math.round(poly.frontage * 10) / 10,
        depthM: Math.round(poly.depth * 10) / 10,
        price: {
          currency: "INR",
          sale: undefined,
          leaseRateSqm: undefined,
        },
        modelObjectName: shopId,
        images: [],
        brochure: undefined,
        description: `Authoritative shop from ${raw.floorId} plan`,
        media: [],
        coordinates: {
          x: centroid[0],
          y: floor.baseElevationM + floor.heightM / 2,
          z: centroid[1],
          polygon: poly.polygon,
        },
        isDemo: false,
        updatedAt: new Date().toISOString(),
      };
      shops.push(shop);
    }
  }

  // Validate all data
  const validatedFloors = parseFloors(floors);
  const validatedShops = parseShops(shops);

  const building: Building = {
    id: "MALL_AUTH_001",
    name: "Authoritative Mall",
    floors: validatedFloors,
    shopCount: validatedShops.length,
  };

  // Generate Blender script
  const blenderScript = generateBlenderScript(validatedFloors, validatedShops);

  return {
    building,
    floors: validatedFloors,
    shops: validatedShops,
    blenderScript,
    warnings,
  };
}

function calculateCentroid(polygon: [number, number][]): [number, number] {
  if (polygon.length === 0) return [0, 0];
  let x = 0, z = 0;
  for (const [px, pz] of polygon) {
    x += px;
    z += pz;
  }
  return [x / polygon.length, z / polygon.length];
}

function normalizeCategory(cat: string): Shop["category"] {
  const normalized = cat.toLowerCase().replace(/[^a-z0-9]/g, "_");
  const categories: Shop["category"][] = [
    "retail", "food_and_beverage", "entertainment",
    "services", "wellness", "anchor", "office", "common"
  ];
  return categories.find(c => c === normalized) || "retail";
}

function generateBlenderScript(floors: Floor[], shops: Shop[]): string {
  // This generates a Blender Python script similar to build_demo_mall.py
  // but using authoritative coordinates from the floor plans
  let script = `"""
AUTHORITATIVE MALL BUILD SCRIPT
Generated from CAD/DXF/PDF ingestion pipeline
DO NOT EDIT MANUALLY - re-run ingestion pipeline to update
"""

import bpy

# Clear scene
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
for block in bpy.data.meshes:
    bpy.data.meshes.remove(block, do_unlink=True)
for block in bpy.data.materials:
    bpy.data.materials.remove(block, do_unlink=True)
bpy.ops.outliner.orphans_purge(do_recursive=True)

# Floors
`;

  for (const floor of floors) {
    script += `make_slab("MALL_${floor.id}_STRUCT", (100, ${floor.heightM}, 100), (0, ${floor.baseElevationM + floor.heightM / 2}, 0), "${floor.id}")\n`;
  }

  script += `
# Shops
`;

  for (const shop of shops) {
    if (!shop.coordinates) continue;
    const { x, y, z, polygon } = shop.coordinates;
    const width = shop.frontageM;
    const depth = shop.depthM;
    script += `make_shop("${shop.id}", (${width}, ${shop.depthM}, ${shop.depthM}), (${x}, ${y}, ${z}), "${shop.category}")\n`;
  }

  script += `
print(f"Built {len([o for o in bpy.data.objects if o.name.startswith('SHOP_')])} shops")
`;

  return script;
}

/**
 * Example: Parse DXF file (would use a DXF parser like dxf-parser or three-dxf)
 * This is a placeholder showing the interface.
 */
export async function parseDXFFile(buffer: ArrayBuffer | Buffer): Promise<RawFloorPlan[]> {
  // In production, use a DXF parser:
  // import { DxfParser } from "dxf-parser";
  // const parser = new DxfParser();
  // const dxf = parser.parseSync(new TextDecoder().decode(buffer));
  // ... extract layers, polylines, text entities

  // For now, return empty - implement with actual DXF parser
  return [];
}

/**
 * Example: Parse PDF floor plan (would use pdf-lib + custom extraction)
 */
export async function parsePDFFloorPlan(buffer: ArrayBuffer | Buffer): Promise<RawFloorPlan[]> {
  // In production, use pdf-lib to extract vector paths
  // This is complex and typically requires specialized tools
  return [];
}

/**
 * Validation helpers for ingestion output
 */
export function validateIngestionResult(result: IngestionResult): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (result.floors.length === 0) {
    errors.push("No floors generated");
  }

  if (result.shops.length === 0) {
    errors.push("No shops generated");
  }

  // Check for duplicate shop IDs
  const shopIds = new Set<string>();
  for (const shop of result.shops) {
    if (shopIds.has(shop.id)) {
      errors.push(`Duplicate shop ID: ${shop.id}`);
    }
    shopIds.add(shop.id);
  }

  // Check all shops reference valid floors
  const floorIds = new Set(result.floors.map(f => f.id));
  for (const shop of result.shops) {
    if (!floorIds.has(shop.floorId)) {
      errors.push(`Shop ${shop.id} references unknown floor ${shop.floorId}`);
    }
  }

  return { valid: errors.length === 0, errors };
}