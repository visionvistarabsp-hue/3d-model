/**
 * DEMO shop catalog — generated, deterministic, clearly labelled.
 *
 * IMPORTANT: These shop numbers, areas, frontages, prices and statuses are
 * INVENTED DEMO DATA for the prototype. The architecture rule is:
 *   - the 3D mesh only maps shopId -> click target
 *   - the DATA layer (this repo) is the only source of business facts
 *   - accurate commercial data + authoritative drawings replace this later
 *     without touching raycasting/selection.
 */
import type { Shop, ShopCategory, ShopStatus } from "@/types";
import { shopObjectName } from "@/lib/select/shop-id";

const DEMO_NOTICE =
  "DEMO DATA — invented values for prototype only, not real commercial facts.";

interface Dim {
  length: number; // along axis (m)
  width: number; // aisle frontage (m)
}

const PIPELINE: Record<ShopCategory, { name: (n: number) => string; dim: Dim }> = {
  retail: { name: (n) => `Demo Retail ${n}`, dim: { length: 8, width: 6 } },
  food_and_beverage: { name: (n) => `Demo Café ${n}`, dim: { length: 7, width: 6 } },
  entertainment: { name: (n) => `Demo Arcade ${n}`, dim: { length: 12, width: 8 } },
  services: { name: (n) => `Demo Services ${n}`, dim: { length: 6, width: 5 } },
  wellness: { name: (n) => `Demo Studio ${n}`, dim: { length: 7, width: 5 } },
  anchor: { name: (n) => `Demo Anchor ${n}`, dim: { length: 20, width: 12 } },
  office: { name: (n) => `Demo Office ${n}`, dim: { length: 8, width: 6 } },
  common: { name: (n) => `Demo Common ${n}`, dim: { length: 10, width: 6 } }
};

const PLAN: Record<string, Array<{ cat: ShopCategory; count: number }>> = {
  G: [
    { cat: "retail", count: 6 },
    { cat: "anchor", count: 1 }
  ],
  F1: [
    { cat: "food_and_beverage", count: 5 },
    { cat: "services", count: 2 }
  ],
  F2: [
    { cat: "entertainment", count: 2 },
    { cat: "office", count: 4 }
  ]
};

const STATUSES: ShopStatus[] = ["available", "available", "reserved", "leased", "leased"];
const PRICE_PSM = { INR: 180000 }; // demo only

let seqCounter = 0;

function build(): Shop[] {
  const shops: Shop[] = [];
  for (const [floorId, rows] of Object.entries(PLAN)) {
    for (const { cat, count } of rows) {
      for (let i = 0; i < count; i++) {
        seqCounter += 1;
        const shopId = shopObjectName(floorId, seqCounter);
        const dim = PIPELINE[cat].dim;
        const area = Math.round(dim.length * dim.width * 10) / 10;
        const status = STATUSES[seqCounter % STATUSES.length];
        const basePrice = Math.round(area * PRICE_PSM.INR / 100000) * 100000;
        shops.push({
          id: shopId,
          shopNumber: `${floorId}-${String(seqCounter).padStart(3, "0")}`,
          unitId: `UNIT-${shopId}`,
          floorId,
          name: PIPELINE[cat].name(seqCounter),
          status,
          category: cat,
          areaSqM: area,
          frontageM: dim.width,
          depthM: dim.length,
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
  }
  return shops;
}

export const DEMO_SHOPS: Shop[] = build();