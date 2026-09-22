/**
 * Demo GLB manifest. Describes the exported demo mall (created in PHASE 2 by
 * blender/scripts/generate_mall.py + export_mall.py — do NOT edit entries here
 * until the export exists; the loader validates against this).
 */
import type { ModelMetadata } from "@/types";

export const DEMO_MODEL_MANIFEST: ModelMetadata = {
  source: "demo",
  isDemo: true,
  modelId: "mall-acropolis-demo-001",
  label: "Acropolis Mall (procedural demo)",
  version: "0.4.0",
  units: "meters",
  layout: "single",
  glbKey: "models/acropolis-mall.glb",
  floors: [
    { floorId: "G", glbKey: "models/acropolis-mall.glb" },
    { floorId: "F1", glbKey: "models/acropolis-mall.glb" },
    { floorId: "F2", glbKey: "models/acropolis-mall.glb" }
  ],
  objectNaming: "SHOP_<FLOOR>_<SEQ> | MALL_/COMMON_/SITE_* structure",
  objectCount: 367, // 27 shop shells + 81 shop parts + structure/common (matches export)
  exportedAt: "2026-09-22T15:22:08.000Z",
  toolchain: {
    blenderVersion: "5.2.1",
    scriptVersion: "0.4.0"
  }
};