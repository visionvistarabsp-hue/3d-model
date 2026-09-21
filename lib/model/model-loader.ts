/**
 * ModelLoader — resolves and validates the GLB manifest for the current
 * model source (demo | authoritative). Uses the StorageClient so the same
 * code serves local dev assets and a future R2/CDN.
 */
import type { ModelMetadata } from "@/types";
import { parseModelMetadata } from "@/lib/validation/schemas";
import { storage } from "@/lib/storage/storage-client";

export interface LoadableModel {
  metadata: ModelMetadata;
  /** Absolute URL of the GLB to load. */
  url: string;
  /** Per-floor overrides when the model is split per floor. */
  floorUrls: Map<string, string>;
}

/**
 * Load the model manifest. In demo mode this reads the manifest bundled with
 * the repo (data/demo/model.ts). In a future API mode it fetches
 * `{API}/model/latest`. The caller renders a loading/error boundary.
 */
export async function loadModelManifest(
  source: "demo" | "authoritative" = detectModelSource()
): Promise<LoadableModel> {
  const raw =
    source === "demo"
      ? (await import("@/data/demo/model")).DEMO_MODEL_MANIFEST
      : (await import("@/data/demo/model")).DEMO_MODEL_MANIFEST;

  const metadata = parseModelMetadata(raw);
  const url = storage.resolve(metadata.glbKey);
  const floorUrls = new Map<string, string>();
  for (const f of metadata.floors) {
    if (f.glbKey) floorUrls.set(f.floorId, storage.resolve(f.glbKey));
  }
  return { metadata, url, floorUrls };
}

export function detectModelSource(): "demo" | "authoritative" {
  const v = process.env.NEXT_PUBLIC_MODEL_SOURCE?.trim().toLowerCase();
  return v === "authoritative" ? "authoritative" : "demo";
}