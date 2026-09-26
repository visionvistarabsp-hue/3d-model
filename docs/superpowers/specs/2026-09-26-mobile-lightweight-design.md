# Mobile-Lightweight Mall Explorer — Design (v1)

Date: 2026-09-26
Status: Approved (approach 2) — pending spec review
Scope: Runtime-only. No Blender MCP / DRACO re-export. Target: modern phones (2020+), coarse-pointer touch, mobile Safari + Android Chrome.

## Problem

The 3D mall explorer works on desktop but its mobile experience falls short of the goal "people must love using this project inside the mobile phone". Profiling established the following facts (measured, not guessed):

- JS is already lean: `/` route = 21.3 kB, First Load JS = 124 kB. `three` is lazily loaded. `@supabase/supabase-js` only appears in API routes, never on the client.
- GLBs are small and already loaded on demand: G floor = 0.21 MB, F1 = 0.18 MB, F2 = 0.15 MB, whole building = 0.62 MB.
- Mobile is already partly lean: `dpr={[1, 1]}`, shadow map 1024, no post-processing on low.

Remaining real problems, in priority order:

1. **Battery / CPU on low tier**: shadow mapping still ON, `frameloop="always"` renders every frame even when idle.
2. **Touch handling**: hover-raycast fires on touch drag (fighting pan/rotate); no `touch-action` guidance; 100dvh not used so browser chrome collapse causes layout jump.
3. **Switch cost**: toggling view mode re-clones every material and runs an O(n²) cleanup on unmount.
4. **First-data-open**: always loads the whole-building GLB (0.62 MB) before floor G even though most mobile users start on G.
5. **Native feel**: no safe-area insets (notch/home bar overlap), no haptics, flat press feedback, small touch targets in panels/sheets.
6. **Dependency weight**: `@react-three/drei` pulled in for just `useGLTF`, `OrbitControls`, `PerspectiveCamera` — a whole extra tree + abstractions for three tiny usages.

## Goals / Non-goals

Goals:
- Sub-150 kB first-load JS (three already lazy; drei removal and small route savings must not push past today's 124 kB).
- Stable 60fps on modern phones during interaction; near-zero CPU when idle on low tier.
- First shop data visible from the smallest payload (G floor), not 0.62 MB.
- Containers respect safe areas; no clip/overlap of notch/home bar; correct `100dvh`.
- Touch = tap selects shop, drag orbits/pans — never a stray hover raycast firing mid-drag.
- View-mode toggle is O(1) on revert, no re-clone storm.
- Premium-precision feel: haptic tick on shop select, emissive highlight of selected shop in realistic mode, tactile press feedback on primary controls.

Non-goals:
- No asset/DRACO re-export (runtime-only, approved).
- No WebGPU renderer migration.
- No desktop visual regression work; desktop must simply not regress.

## Design

### Section 1 — Rendering performance & battery

Decisions:

1. **Shadows gated to high tier only**: `<Canvas shadows={runtimeQuality === "high"}>`. `runtimeQuality === "low"` (coarse pointer, or width<900 && (deviceMemory≤4 || cores≤4)) disables shadow mapping entirely. Low visuals change slightly (no ground contact shadow) — acceptable, verified in Section 6.
2. **Idle render halt on low**: after 4 s without pointer/scroll/keyboard input and no pending store change, set `frameloop="demand"` and skip the animation loop body. Wake to `"always"` on any `pointerdown`/`pointermove`/`wheel`/keydown or on store mutations. Implemented as a small hook (`useIdleFrameloop`) wiring into the existing `runtimeQuality` util so desktop behavior is unchanged.
3. **Coarse-pointer hover guard**: the per-mesh hover raycast is disabled while `pointerType === "touch"` unless the pointer is actually down. Prevents a hover raycast from firing mid-scroll/orbit-drag and stops hidden hover cost on touch.
4. **`touch-action: none`** on the WebGL canvas element so the browser never tries to intercept pan/rotate gestures.

Files: `components/viewer/mall-viewer.tsx`, `components/viewer/mall-model.tsx`, `app/globals.css`, new hook under `lib/performance/`.

### Section 2 — Bundle-lean (drop drei)

Decisions:

1. Replace the drei imports with browser-native / R3F-native equivalents:
   - `useGLTF(url)` → `useLoader(GLTFLoader, url)` from `three/examples/jsm/loaders/GLTFLoader.js` (already bundled; only `useGLTF` leaves the bundle, the loader stays).
   - `<OrbitControls>` → `three-stdlib`'s `OrbitControls` (R3F-examples use three-stdlib; add it as an explicit dependency; it is a strict subset of what drei re-exported, so the symbol surface is unchanged).
   - `<PerspectiveCamera …>` → R3F built-in `<perspectiveCamera>`.
2. Remove `@react-three/drei` from `package.json` after the swap.
3. Verify bundle regression: First Load JS stays ≤ 124 kB (Section 6).

Files: `components/viewer/mall-model.tsx`, `components/viewer/mall-viewer.tsx`, `package.json` / `package-lock.json`.

### Section 3 — Fast open / low data

Decisions:

1. Mobile default floor = G (0.21 MB) instead of whole-building (0.62 MB). The floor manifest already resolves the smallest relevant asset; store init picks `activeFloorId: "G"` for coarse-pointer/phone devices while mobile. The 0.62 MB whole-building GLB stays for the desktop "whole building" view — not removed.
2. No image assets to lazy-load today; confirm map/panel images (if any are introduced later) must be storage-keyed per AGENTS rule 5.

Files: `store/use-mall-store.ts` (default floor init), `data/demo/model.ts` (manifest — unchanged, resolution logic already exists).

### Section 4 — Native-feel UI, containers & safe areas

Decisions:

1. `viewportFit: "cover"` in exported viewport metadata (`app/layout.tsx`) so the app can extend under the notch/home bar, then:
2. Safe-area padding via `env(safe-area-inset-top/bottom)` consumed as CSS custom properties used by: top app bar, bottom navigation/sheet, and the modal sheet bottom padding. Canvases/backgrounds draw under the inset; chrome does not.
3. Shell uses `h-[100dvh]` (fallback `100vh`) so browser-chrome collapse doesn't stretch/jump the layout.
4. Touch targets ≥ 44px on all interactive controls in the floor selector, shop search/filter, and sheet footer.

Files: `app/layout.tsx`, `app/globals.css`, `components/mall/mall-app.tsx`, `components/ui/floor-selector.tsx`, `components/ui/shop-info-panel.tsx`, `components/ui/shop-search-filters.tsx`.

### Section 5 — Premium polish detail

Decisions:

1. `navigator.vibrate?.(10)` on shop select (guarded — no-op where unsupported). Weight ~10ms; Android-feel tick.
2. Realistic-mode selected-shop emissive glow: a single `emissive` boost on the selected shop's materials (1 material swap, no drei, no post-processing). Reuses the Section 2 material infrastructure.
3. Primary pill buttons get `active:scale[0.97]` press feedback (motion-free, CSS transition, respects reduced-motion).
4. View-mode toggle becomes O(1): keep a store-keyed cache of `{meshUuid × viewMode}` → cloned material so toggling back reuses the clone instead of re-cloning; cleanup on unmount is a single pass.

Files: `components/effects/view-mode-effects.tsx`, `store/use-mall-store.ts`, `app/globals.css`, `components/ui/floor-selector.tsx`.

### Section 6 — Verification

1. `npm.cmd run typecheck` — clean.
2. `npm.cmd run lint` — zero new errors (pre-existing lib/ingestion warnings are untouched).
3. `npm.cmd run build` — production build OK; record First Load JS in the commit message / PR notes.
4. `npm.cmd run test` — 39/39 stay green (tests covering material switching and runtimeQuality must be updated in lockstep, not removed).
5. Manual (desktop + Android Chrome + iOS Safari, device emulation as available):
   - Phone: default opens on floor G with G GLB load, no whole-building fetch.
   - Low tier (emulated `deviceMemory=4` + coarse pointer): no shadows, idle CPU ≈ 0 after 4 s.
   - Touch: drag orbits/pans without hover raycast firing; tap selects a shop; haptic tick present on Android.
   - Safe areas: no content under notch/home bar; no layout jump when browser chrome collapses (100dvh).
   - View-mode toggle: instant on repeated toggles (clone cache); no material leak after unmount.
   - Bundle: devtools reports ≤ 124 kB First Load JS.

Risk register:
- drei removal could surface a subtle OrbitControls difference → fallback documented: re-add drei if a fatal regression appears, but keep the glow + cache work (they are drei-independent).
- `env(safe-area*)` unsupported on old browsers → CSS fallback `0px` default via custom props.
- `navigator.vibrate` privacy/unsupported on iOS → guarded optional call, no UI dependence.
- Shadow-off low tier changes visuals → acceptable; low tier already takes the dpr=1 sharpness cut.