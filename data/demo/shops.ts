/**
 * DEMO shop catalog — generated, deterministic, clearly labelled.
 *
 * IMPORTANT: These shop numbers, areas, frontages, prices and statuses are
 * INVENTED DEMO DATA for the prototype. The architecture rule is:
 *   - the 3D mesh only maps shopId -> click target
 *   - the DATA layer (this repo) is the only source of business facts
 *   - accurate commercial data + authoritative drawings replace this later
 *     without touching raycasting/selection.
 *
 * This catalog mirrors the parametric Blender build (blender/scripts/
 * generate_shops.py): 9 shops per floor (G | F1 | F2), ids SHOP_<F>_001..009,
 * same category map, same status cycle STATUSES[(floor_index + seq) % 3], and
 * the same area (shop_width 5.0 x shop_depth 5.0 m = 25.0 sqm).
 */
import type { Shop, ShopCategory, ShopStatus } from "@/types";
import { shopObjectName } from "@/lib/select/shop-id";

const DEMO_NOTICE =
  "DEMO DATA — invented values for prototype only, not real commercial facts.";

type CategoryMap = Record<string, Record<number, ShopCategory>>;

// Mirrors CATEGORIES in blender/scripts/generate_shops.py (seq 1..9 per floor).
const CATEGORIES: CategoryMap = {
  G: {
    1: "anchor",
    2: "retail",
    3: "retail",
    4: "retail",
    5: "anchor",
    6: "retail",
    7: "retail",
    8: "retail",
    9: "retail"
  },
  F1: {
    1: "food_and_beverage",
    2: "food_and_beverage",
    3: "food_and_beverage",
    4: "food_and_beverage",
    5: "food_and_beverage",
    6: "food_and_beverage",
    7: "services",
    8: "services",
    9: "services"
  },
  F2: {
    1: "entertainment",
    2: "entertainment",
    3: "office",
    4: "office",
    5: "office",
    6: "office",
    7: "office",
    8: "wellness",
    9: "retail"
  }
};

const PIPELINE: Record<ShopCategory, { name: (n: number) => string }> = {
  retail: { name: (n) => `Demo Retail ${n}` },
  food_and_beverage: { name: (n) => `Demo Café ${n}` },
  entertainment: { name: (n) => `Demo Arcade ${n}` },
  services: { name: (n) => `Demo Services ${n}` },
  wellness: { name: (n) => `Demo Studio ${n}` },
  anchor: { name: (n) => `Demo Anchor ${n}` },
  office: { name: (n) => `Demo Office ${n}` },
  common: { name: (n) => `Demo Common ${n}` }
};

// Mirrors STATUSES + (floor_index + seq) % 3 in generate_shops.py (lowercased).
const STATUSES: ShopStatus[] = ["available", "reserved", "leased"];
const FLOOR_INDEX: Record<string, number> = { G: 0, F1: 1, F2: 2 };
const AREA_SQM = 25.0; // 5.0 x 5.0 m shop footprint (mesh shop_width x shop_depth)
const FRONTAGE_M = 5.0;
const DEPTH_M = 5.0;
const PRICE_PSM = { INR: 180000 }; // demo only

function build(): Shop[] {
  const shops: Shop[] = [];
  for (const floorId of Object.keys(CATEGORIES)) {
    const idx = FLOOR_INDEX[floorId];
    for (let seq = 1; seq <= 9; seq++) {
      const shopId = shopObjectName(floorId, seq);
      const category = CATEGORIES[floorId][seq];
      const status = STATUSES[(idx + seq) % 3];
      const basePrice = Math.round((AREA_SQM * PRICE_PSM.INR) / 100000) * 100000;
      shops.push({
        id: shopId,
        shopNumber: `${floorId}-${String(seq).padStart(3, "0")}`,
        unitId: `UNIT-${shopId}`,
        floorId,
        name: PIPELINE[category].name(seq),
        status,
        category,
        areaSqM: AREA_SQM,
        frontageM: FRONTAGE_M,
        depthM: DEPTH_M,
        price: {
          currency: "INR",
          sale: status === "available" ? basePrice : undefined,
          leaseRateSqm: status !== "leased" ? 80_000 : undefined
        },
        modelObjectName: shopId,
        images: [],
        media: [],
        isDemo: true,
        demoNotice: DEMO_NOTICE,
        updatedAt: new Date().toISOString().slice(0, 19) + "Z"
      });
    }
  }
  return shops;
}

export const DEMO_SHOPS: Shop[] = build();