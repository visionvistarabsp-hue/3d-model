# Data Contract (zod-validated)

Docs authority over data shapes is `lib/validation/schemas.ts`. This file is
the human-readable summary; the schemas are the executable truth.

## Shop

```ts
interface Shop {
  id: string;              // SHOP_<FLOOR>_<SEQ>
  shopNumber: string;      // display number, tenant-facing, e.g. "G-001"
  unitId?: string;         // internal pipeline id (optional)
  floorId: string;         // G / F1 / F2 / B1...
  name: string;
  status: "available" | "reserved" | "leased" | "under_construction";
  category: "retail" | "food_and_beverage" | "entertainment" |
            "services" | "wellness" | "anchor" | "office" | "common";
  areaSqM: number;         // built-up area
  frontageM: number;       // aisle-front width
  depthM: number;          // aisle-back depth
  price: { currency: string /* ISO 4217 */; sale?: number; leaseRateSqm?: number } | null;
  modelObjectName: string; // must equal id
  images: string[];        // storage KEYS, not absolute urls
  brochure?: string;
  description?: string;
  media: Array<{ kind: "image"|"brochure"|"video"; key: string; label?: string }>;
  coordinates?: { x: number; y: number; z: number; polygon?: [number,number][] };
  isDemo: boolean;         // API/non-demo sources must set false
  demoNotice?: string;
  updatedAt: string;       // ISO 8601 UTC
}
```

## Floor

```ts
interface Floor {
  id: "G"|"F1"|"F2"|"B1"|...;
  index: number;             // 0-based sort order
  label: string;
  kind: "basement" | "ground" | "upper";
  baseElevationM: number;    // slab center vs ground
  heightM: number;           // floor-to-floor
  description?: string;
  isDemo: boolean;
}
```

## Model metadata

See `types/model.ts`. Contract with the Blender export pipeline; the web app
validates it (`ModelMetadataSchema`) before loading any GLB.

## Validation guarantees
- Shops: `id` must match `SHOP_<FLOOR>_<SEQ>` (or be ≥3 chars for non-shop
  records), numeric fields `>= 0`, `currency` length 3, ISO datetime.
- Media keys must never resolve outside the storage root (StorageClient guards).
- Malformed records **throw** at the boundary rather than silently rendering
  wrong info — a broken record must be visibly broken.