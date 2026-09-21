# ROADMAP — Mall 3D Explorer

> Status legend: ✅ done · 🔄 in progress · ⏳ planned

## Phase 0 — Environment & architecture  ✅
- Toolchain audit (Node 24 / npm.cmd, Blender 5.2.1 + MCP addon v1.7).
- Fixed Cloudflare, GitHub and OpenCV MCP connectivity.
- Architecture assessment + template docs.

## Phase 1 — Scaffold  🔄
- [x] Git baseline, package config (Next 15, React 19, R3F 9, drei, zustand, zod, Tailwind 4).
- [x] Canonical types + zod schemas (shop / floor / model / view-mode).
- [x] StorageClient + ShopRepository (mock) + demo data (marked DEMO).
- [x] Base viewer (Canvas, lights, camera, error boundary, loading, placeholder mall).
- [x] Docs skeleton, ROADMAP, AGENTS.
- [ ] `npm run typecheck` + `npm run build` green, first commit.
- [ ] Dev-server smoke test in a browser.

## Phase 2 — Blender demo mall + GLB  ⏳
- `blender/scripts/build_demo_mall.py` (rule-based slab/shop/structure geometry).
- GLB export → `public/assets/models/demo-mall.glb`, manifest update.
- Enable GLB path; verify shop id mapping on load.

## Phase 3 — Interaction core  ⏳
- Orbit camera polish, floor selector (G/F1/F2).
- Raycast hover + click → selection store → info panel.
- Search + filters (status / category / floor).

## Phase 4 — Effects  ⏳
- Hologram / X-Ray view modes (emissive, wireframe edges, scanlines, bloom poi).
- Device-tiered quality (high/medium/low).

## Phase 5 — Tenant layer  ⏳
- Floor-plan / tenant branding per shop, brochure & media via StorageClient.

## Phase 6 — Backend  ⏳
- Supabase (Postgres) `shops` / `floors` tables, RLS.
- ApiShopRepository (fetch), admin CRUD, tenant invites.

## Phase 7 — Production  ⏳
- Cloudflare R2/CDN for models + media, API caching, analytics, error tracking.

## Phase 8 — Authoritative data  ⏳
- Ingest CAD/DXF/PDF drawings; re-export GLBs; swap demo → real data.
- **No component changes** — pure data + geometry replacement by design.