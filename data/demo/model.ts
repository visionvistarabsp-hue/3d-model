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
  version: "0.5.0",
  units: "meters",
  layout: "per_floor",
  glbKey: "models/acropolis-mall.glb",
  floors: [
    { floorId: "G", glbKey: "models/acropolis-mall-G.glb" },
    { floorId: "F1", glbKey: "models/acropolis-mall-F1.glb" },
    { floorId: "F2", glbKey: "models/acropolis-mall-F2.glb" }
  ],
  objectNaming: "SHOP_<FLOOR>_<SEQ> | PLATE_<FLOOR>_* structure per floor plate",
  objectCount: 316, // 27 shop shells + 81 shop parts + plate structure (G 110 + F1 112 + F2 94)
  exportedAt: "2026-09-25T12:07:49.000Z",
  toolchain: {
    blenderVersion: "5.2.1",
    scriptVersion: "0.5.0"
  }
};