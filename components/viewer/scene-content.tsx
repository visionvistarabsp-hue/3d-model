"use client";

/**
 * Owns the decision of WHAT to render inside the viewport.
 *
 *   - PHASE 1 (current): the GLB does not exist yet, so we render the
 *     procedural PlaceholderMall built from the SAME shop ids + floor data.
 *     Selection/hover wiring therefore already works end-to-end today.
 *   - PHASE 2: enable the GLB path below once `public/assets/models/demo-mall.glb`
 *     is exported by the Blender pipeline.
 */
import { PlaceholderMall } from "./placeholder-mall";

export function SceneContent() {
  // PHASE 2 — swap the return below for <MallModel> when the GLB exists:
  //   const { source } = await import("@/lib/model/model-loader");
  //   return <MallModel manifest={manifest} />;
  return <PlaceholderMall />;
}