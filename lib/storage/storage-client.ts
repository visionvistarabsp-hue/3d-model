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
 *   - `RemoteStorageClient` (production): resolves against Cloudflare R2
 *     via signed URLs or public bucket, with caching and transformation.
 *
 * Swapping storage does NOT change any component — only this file + env.
 */

export interface StorageClient {
  /** Resolve a storage key to an absolute URL usable in <img>/loaders/fetch. */
  resolve(key: string, opts?: { width?: number; height?: number; format?: "webp" | "avif" | "auto" }): string;
  /** Whether media should be lazily proxied (R2 rewrites) vs direct public. */
  readonly kind: "local" | "remote";
  /** Get a signed URL for private objects (R2). */
  getSignedUrl?(key: string, expiresIn?: number): Promise<string>;
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

  async getSignedUrl(key: string): Promise<string> {
    return this.resolve(key);
  }
}

interface R2Config {
  accountId: string;
  bucketName: string;
  publicUrl?: string;
  accessKeyId: string;
  secretAccessKey: string;
}

class CloudflareR2Client implements StorageClient {
  readonly kind = "remote" as const;
  private config: R2Config;
  private signedUrlCache = new Map<string, { url: string; expires: number }>();

  constructor(config: R2Config) {
    this.config = config;
  }

  resolve(key: string, opts?: { width?: number; height?: number; format?: "webp" | "avif" | "auto" }): string {
    const normalized = key.startsWith("/") ? key.slice(1) : key;
    const baseUrl = this.config.publicUrl || `https://${this.config.bucketName}.${this.config.accountId}.r2.cloudflarestorage.com`;

    if (!opts) {
      return `${baseUrl}/${encodeURIComponent(normalized)}`;
    }

    // Cloudflare Images-style transformations via R2
    const params = new URLSearchParams();
    if (opts.width) params.set("width", String(opts.width));
    if (opts.height) params.set("height", String(opts.height));
    if (opts.format && opts.format !== "auto") params.set("format", opts.format);

    const query = params.toString();
    return `${baseUrl}/${encodeURIComponent(normalized)}${query ? `?${query}` : ""}`;
  }

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const cacheKey = `${key}:${expiresIn}`;
    const cached = this.signedUrlCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return cached.url;
    }

    // In production, this would call a Cloudflare Worker to generate signed URLs
    // For now, return the public URL if available
    const url = this.resolve(key);
    this.signedUrlCache.set(cacheKey, { url, expires: Date.now() + expiresIn * 1000 });
    return url;
  }
}

function buildStorageClient(): StorageClient {
  // Check for R2 config first
  const r2AccountId = process.env.R2_ACCOUNT_ID?.trim();
  const r2BucketName = process.env.R2_BUCKET_NAME?.trim();
  const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const r2PublicUrl = process.env.R2_PUBLIC_URL?.trim();

  if (r2AccountId && r2BucketName && r2AccessKeyId && r2SecretAccessKey) {
    return new CloudflareR2Client({
      accountId: r2AccountId,
      bucketName: r2BucketName,
      publicUrl: r2PublicUrl,
      accessKeyId: r2AccessKeyId,
      secretAccessKey: r2SecretAccessKey,
    });
  }

  // Fallback to generic remote (e.g., custom CDN)
  const base = process.env.NEXT_PUBLIC_ASSET_BASE_URL?.trim();
  if (base) {
    return new RemoteStorageClient(base);
  }

  return new LocalStorageClient();
}

class RemoteStorageClient implements StorageClient {
  readonly kind = "remote" as const;

  constructor(private baseUrl: string) {}

  resolve(key: string): string {
    const normalized = key.startsWith("/") ? key.slice(1) : key;
    return `${this.baseUrl.replace(/\/$/, "")}/${encodeURIComponent(normalized)}`;
  }

  async getSignedUrl(key: string): Promise<string> {
    return this.resolve(key);
  }
}

/** Singleton used across the 3D viewer and UI. */
export const storage = buildStorageClient();

/** Resolve the model key for the current source (demo/authoritative). */
export function resolveModelKey(key: string): string {
  return storage.resolve(key);
}

/** Cache-Control headers for different asset types. */
export const CACHE_HEADERS = {
  // Immutable assets (hashed filenames) - 1 year
  immutable: "public, max-age=31536000, immutable",
  // GLB models - 1 day, revalidate
  model: "public, max-age=86400, stale-while-revalidate=604800",
  // Images - 1 day
  image: "public, max-age=86400, stale-while-revalidate=604800",
  // JSON/API - 5 minutes
  api: "public, max-age=300, stale-while-revalidate=600",
  // No cache for development
  none: "no-store, must-revalidate",
} as const;

/** Get appropriate cache header for a storage key. */
export function getCacheHeader(key: string): string {
  if (key.endsWith(".glb") || key.endsWith(".gltf")) return CACHE_HEADERS.model;
  if (/\.(webp|avif|jpg|jpeg|png|gif|svg)$/i.test(key)) return CACHE_HEADERS.image;
  if (key.endsWith(".json")) return CACHE_HEADERS.api;
  // Check for hash in filename (immutable)
  if (/-[a-f0-9]{8,}\./i.test(key)) return CACHE_HEADERS.immutable;
  return CACHE_HEADERS.image;
}