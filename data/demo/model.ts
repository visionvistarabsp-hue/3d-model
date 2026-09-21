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
  version: "0.2.0",
  units: "meters",
  layout: "single",
  glbKey: "models/demo-mall.glb",
  floors: [
    { floorId: "G", glbKey: "models/demo-mall.glb" },
    { floorId: "F1", glbKey: "models/demo-mall.glb" },
    { floorId: "F2", glbKey: "models/demo-mall.glb" }
  ],
  objectNaming: "SHOP_<FLOOR>_<SEQ> | MALL_/COMMON_/SITE_* structure",
  objectCount: 0, // filled at export time
  exportedAt: "1970-01-01T00:00:00.000Z", // placeholder until PHASE 2 export
  toolchain: {
    blenderVersion: "5.2.1",
    scriptVersion: "0.2.0"
  }
};