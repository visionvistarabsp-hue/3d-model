"use client";

/**
 * Owns the decision of WHAT to render inside the viewport.
 *
 *          DEMO GEOMETRY IS NEVER THE SOURCE OF TRUTH FOR BUSINESS DATA.
 * The GLB only maps mesh -> shopId. All commercial facts come from the
 * ShopRepository (see AGENTS rules 2/3). Swap data without touching selection.
 *
 * Renders the exported demo mall GLB (manifest via loadModelManifest). The
 * ModelErrorBoundary falls back to the procedural PlaceholderMall if the GLB
 * fails to load, so the scaffold never breaks.
 */
import { useEffect, useState } from "react";
import { loadModelManifest } from "@/lib/model/model-loader";
import type { LoadableModel } from "@/lib/model/model-loader";
import { MallModel, useMallScene } from "./mall-model";
import { ViewModeEffects } from "@/components/effects/view-mode-effects";
import { PostProcessing } from "@/components/effects/postprocessing";
import { TenantBrandingLayer } from "@/components/tenant/tenant-branding-layer";
import { useMallStore } from "@/store/use-mall-store";

function SceneContentInner() {
  const { scene } = useMallScene();
  const selectedShopId = useMallStore((s) => s.selectedShopId);

  return (
    <>
      <ViewModeEffects scene={scene} selectedShopId={selectedShopId} />
      <PostProcessing />
      <TenantBrandingLayer scene={scene} />
    </>
  );
}

export function SceneContent() {
  const [model, setModel] = useState<LoadableModel | null>(null);

  useEffect(() => {
    let alive = true;
    loadModelManifest("demo").then((m) => {
      if (alive) setModel(m);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!model) return null;
  return <MallModel manifest={model}><SceneContentInner /></MallModel>;
}