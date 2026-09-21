# GLB Export Pipeline (PHASE 2)

Goal: one deterministic Blender run that turns the demo shop catalog into a
single `public/assets/models/demo-mall.glb`, fully covered by the manifest in
`data/demo/model.ts`.

## Sources of truth
- Shop record list       → `data/demo/shops.ts`
- Floor/elevation values → `data/demo/floors.ts`
- Object naming rules    → `docs/shop-id-convention.md`

## Steps (to be built in PHASE 2)
1. `blender/scripts/build_demo_mall.py`:
   - create slabs per floor at `baseElevationM`, shop blocks per record,
     structure objects; name every object EXACTLY as `SHOP_<FLOOR>_<SEQ>`.
   - set `userData["shopId"]` on every shop mesh.
   - converge object count with the manifest.
2. Export via Blender MCP `blender_export_scene`
   (GLB, application modifiers, consistent up-axis) → `public/assets/models/`.
3. Update `data/demo/model.ts` (`objectCount`, `exportedAt`, version bump).
4. `npm run typecheck` — the loader now verifies ids on load
   (`MallModel.verifyShopObjectNames`).
5. Re-enable the GLB path in `components/viewer/scene-content.tsx`.

## Why GLB
- Self-contained (meshes + materials), small, web-native, draco-optional.
- Keeps `userData`, material slots and transform hierarchy.
- Blender is the authoring source; GLB is a lossless-enough rendering for the
  web; FBX/glTF re-exports for tools are generated from the same `.blend`.

## Selection handshake (do not break)
`mesh.userData.shopId` must equal the object name and the data `id`.
`components/viewer/mall-model.tsx` logs a warning on any mismatch. The web app
does NOT guess geometry from the GLB — the manifest is authoritative for what
gets loaded.