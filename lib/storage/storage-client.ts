/**
 * StorageClient — asset resolution abstraction.
 *
 * The application NEVER hardcodes absolute/local file paths for GLB, textures,
 * images or brochures. Components ask the StorageClient to resolve a storage
 * *key* (e.g. `models/demo-mall.glb`) to an absolute URL. The implementation
 * is selected by environment variables:
 *
 *   - `LocalStorageClient` (default dev): serves from `/assets/...` in
 *     `public/`. No network, works offline.
 *   - `RemoteStorageClient` (future): resolves against an object store
 *     (Cloudflare R2 via a worker API route, or signed URLs).
 *
 * Swapping storage does NOT change any component — only this file + env.
 */

export interface StorageClient {
  /** Resolve a storage key to an absolute URL usable in <img>/loaders/fetch. */
  resolve(key: string, opts?: { width?: number }): string;
  /** Whether media should be lazily proxied (R2 rewrites) vs direct public. */
  readonly kind: "local" | "remote";
}

const ASSET_PREFIX = "/assets";

class LocalStorageClient implements StorageClient {
  readonly kind = "local" as const;

  resolve(key: string): string {
    const normalized = key.startsWith("/") ? key : `/${key}`;
    // Never break out of the public asset root with malicious keys.
    if (normalized.includes("..")) {
      throw new Error(`Invalid asset key: ${key}`);
    }
    return `${ASSET_PREFIX}${normalized}`;
  }
}

class RemoteStorageClient implements StorageClient {
  readonly kind = "remote" as const;

  constructor(private baseUrl: string) {}

  resolve(key: string): string {
    const normalized = key.startsWith("/") ? key.slice(1) : key;
    return `${this.baseUrl.replace(/\/$/, "")}/${encodeURIComponent(normalized)}`;
  }
}

function buildStorageClient(): StorageClient {
  const base = process.env.NEXT_PUBLIC_ASSET_BASE_URL?.trim();
  if (base) {
    return new RemoteStorageClient(base);
  }
  return new LocalStorageClient();
}

/** Singleton used across the 3D viewer and UI. */
export const storage = buildStorageClient();

/** Resolve the model key for the current source (demo/authoritative). */
export function resolveModelKey(key: string): string {
  return storage.resolve(key);
}