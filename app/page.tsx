import { Suspense } from "react";
import { getRepository } from "@/lib/data/get-repository";
import { MallApp } from "@/components/mall/mall-app";

/**
 * Server component: fetches building + shops from the repository, then renders
 * the client 3D app. If data is unavailable we show a clear failure instead of
 * a silently broken scene.
 */
export default async function HomePage() {
  let title = "Mall 3D Explorer";
  let floors;
  let shops;
  let error: string | null = null;

  try {
    const repo = await getRepository();
    const building = await repo.getBuilding();
    title = building.name;
    floors = building.floors;
    shops = await repo.getShops();
  } catch (e) {
    error = e instanceof Error ? e.message : "Unknown data error";
  }

  return (
    <main style={{ height: "100vh" }}>
      <Suspense fallback={<PageShell loading error={null} />}>
        <MallApp title={title} floors={floors ?? []} shops={shops ?? []} error={error} />
      </Suspense>
    </main>
  );
}

function PageShell({
  loading,
  error
}: {
  loading: boolean;
  error: string | null;
}) {
  return (
    <div className="flex h-full items-center justify-center bg-[#0a0c11]">
      <div className="text-center">
        {loading ? (
          <div className="space-y-5">
            <div
              className="mx-auto h-10 w-10 rounded-xl"
              style={{
                background: "linear-gradient(135deg, #6366f1, #22d3ee)",
                boxShadow: "0 10px 40px -8px rgba(99, 102, 241, 0.7)"
              }}
            />
            <p className="text-sm font-medium text-white/70">Preparing the experience…</p>
            <div className="shimmer-bar mx-auto h-1 w-44 overflow-hidden rounded-full bg-white/10" />
          </div>
        ) : (
          <p className="text-sm text-red-400">{error ?? "Unable to load mall data"}</p>
        )}
      </div>
    </div>
  );
}