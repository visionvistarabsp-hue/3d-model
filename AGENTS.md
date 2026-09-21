# AGENTS.md — Mall 3D Explorer

Guidance for AI agents working in this repo.

## Commands (Windows / PowerShell 5.1)
- `npm.cmd install` — install deps (use `npm.cmd`, not `npm`; .ps1 shims are blocked).
- `npm.cmd run dev` — start dev server (http://localhost:3000).
- `npm.cmd run build` — production build (run before committing).
- `npm.cmd run typecheck` — `tsc --noEmit` (run after every change).
- `npm.cmd run lint` — ESLint.
- `npm.cmd run test` — vitest unit tests.
- Blender MCP: only with Blender running + addon at `localhost:9876`.

## Non-negotiable rules
1. **Never invent real-world facts.** Observed in this repo: {facts}. Anything not
   derived from authoritative source data MUST be marked demo (`isDemo: true`,
   `demoNotice`, the on-screen banner), and demo data lives only in `data/demo/`.
2. The **3D mesh is never the source of truth** for business data. Mesh = shopId
   mapping + geometry. Data = ShopRepository. Swap data without touching raycasting.
3. Shop ids are contractual: `SHOP_<FLOOR>_<SEQ>`. Never rename exported objects.
4. Data crossing boundaries (storage/API → app) is zod-validated
   (`lib/validation/schemas.ts`). Malformed data must throw, not silently degrade.
5. Asset paths: only storage KEYS; resolve via StorageClient. No hardcoded
   /abs/paths or magic directory traversal in components.
6. Keep R3F scene components free of business logic; state lives in
   `store/use-mall-store.ts`.
7. Mirror `types/*` ↔ `lib/validation/schemas.ts`; keep both in lockstep.

## Workflow rhythm
- Commit at stable milestones (after typecheck + build are green) with a concise
  message. Do not commit secrets (`.env.local`, tokens).
- PHASE 2+ requires the Blender MCP; verify exports with a viewport screenshot.

## MCP availability
- Blender (uvx mcp-for-blender), Chrome DevTools, Filesystem, Three.js, 21st,
  shadcn, magicui, motion, pdf, supabase, playwright, github, cloudflare, opencv.
- Full opencode MCP config: `C:\Users\User\.config\opencode\opencode.jsonc`.