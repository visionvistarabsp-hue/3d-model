/**
 * Demo GLB manifest. Describes the exported demo mall (created in PHASE 2 by
 * blender/scripts/build_demo_mall.py — do NOT edit entries here until the
 * export exists; the loader validates against this).
 */
import type { ModelMetadata } from "@/types";

export const DEMO_MODEL_MANIFEST: ModelMetadata = {
  source: "demo",
  isDemo: true,
  modelId: "mall-demo-001",
  label: "Demo Mall (procedural prototype)",
  version: "0.3.0",
  units: "meters",
  layout: "single",
  glbKey: "models/demo-mall.glb",
  floors: [
    { floorId: "G", glbKey: "models/demo-mall.glb" },
    { floorId: "F1", glbKey: "models/demo-mall.glb" },
    { floorId: "F2", glbKey: "models/demo-mall.glb" }
  ],
  objectNaming: "SHOP_<FLOOR>_<SEQ> | MALL_/COMMON_/SITE_* structure",
  objectCount: 25, // 20 shops + 3 slabs + roof + site ground (matches export)
  exportedAt: "2026-09-21T07:50:22.204Z",
  toolchain: {
    blenderVersion: "5.2.1",
    scriptVersion: "0.3.0"
  }
};