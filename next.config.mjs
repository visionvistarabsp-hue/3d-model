/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true
  // GLB/glTF assets are served from /assets/... (public). In production the same
  // paths resolve via the StorageClient to an object store (e.g. Cloudflare R2).
};

export default nextConfig;