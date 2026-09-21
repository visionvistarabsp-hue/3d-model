# Architecture — Mall 3D Explorer

## Layering rule (non-negotiable)
The 3D mesh is **never** the source of truth for business data.

```
┌──────────────────────────────────────────────────────────────┐
│ UI / Interaction        (components/, store/)                 │
│   - R3F canvas, info panels, search, floor selector          │
│   - reads ShopRepository + StorageClient only                 │
├──────────────────────────────────────────────────────────────┤
│ Data layer               (lib/data/, types/, lib/validation/)│
│   - ShopRepository interface: shop + floor records           │
│   - zod validation at every boundary                         │
│   - MockShopRepository (demo) → ApiShopRepository later      │
├──────────────────────────────────────────────────────────────┤
│ Storage layer            (lib/storage/, public/assets/)      │
│   - StorageClient resolves keys → URLs (local / R2 later)    │
│   - GLB models, images, brochures                            │
├──────────────────────────────────────────────────────────────┤
│ Geometry                 (Blender, blender/scripts/)         │
│   - exports GLB(s) + model manifest                          │
│   - shop meshes carry ONLY stable shopId + naming            │
└──────────────────────────────────────────────────────────────┘
```

## Shop identification
- Canonical id: `SHOP_<FLOOR>_<NNN>` (e.g. `SHOP_G_001`) — see `docs/shop-id-convention.md`.
- Mesh object name == shop id (lossless). `userData.shopId` mirrors it.
- `parseShopObjectName()` in `lib/select/shop-id.ts` never throws.

## Selection flow
1. Raycast / click → closest mesh → read `userData.shopId`.
2. `useMallStore.selectShop(shopId)` — the scene does not know areas/prices.
3. UI panel → `shopRepository.getShopById(shopId)` → display record.
   Swap data source (env `NEXT_PUBLIC_DATA_SOURCE`) without touching raycasting.

## Data flow
- `app/page.tsx` (server) → `getRepository()` → building + shops → client `MallApp`.
- Client hydrates zustand store in one shot (no refetch/flicker).
- Invalid records are rejected by zod schemas (`lib/validation/schemas.ts`).

## Model pipeline
- Blender script generates the demo mall (PHASE 2) and exports GLB via
  `blender_export_scene` → `public/assets/models/`.
- `data/demo/model.ts` manifest documents naming + floors; every export bumps
  `objectCount`/`exportedAt`. Web app reads the manifest, not hardcoded paths.
- Viewer loads manifest → `useGLTF(url)` → verifies `userData.shopId`.
- On GLB failure an error boundary falls back to `PlaceholderMall` (same ids).

## Demo vs authoritative
- `isDemo: true` on every demo record/floor; a persistent banner is rendered.
- Moving to real data = swap `data/demo/*` for validated sources (CAD/DXF/PDF),
  re-export GLBs, update the manifest. No component changes required.

## File map (core)
| Path | Responsibility |
|---|---|
| `types/` | Canonical TS types (shop, floor, view-mode, model) |
| `lib/validation/schemas.ts` | zod schemas + runtime validators |
| `lib/data/shop-repository.ts` | Repository interface + mock impl |
| `lib/data/get-repository.ts` | Env-driven repo factory |
| `lib/storage/storage-client.ts` | Key→URL resolution (local/R2) |
| `lib/model/model-loader.ts` | GLB manifest load + validation |
| `lib/select/shop-id.ts` | Object name ↔ shop id parsing |
| `store/use-mall-store.ts` | zustand store (selection, mode, data) |
| `components/viewer/` | Canvas, model load, placeholder, loading, errors |
| `data/demo/` | DEMO shops/floors/manifest |
| `blender/scripts/` | Blender generator + export (PHASE 2) |