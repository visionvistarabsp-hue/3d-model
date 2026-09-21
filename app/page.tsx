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
    <div className="flex h-full items-center justify-center bg-[#0b0d12]">
      <div className="text-center">
        {loading ? (
          <div className="skeleton mx-auto h-3 w-40 rounded" />
        ) : (
          <p className="text-sm text-red-400">{error ?? "Unable to load mall data"}</p>
        )}
      </div>
    </div>
  );
}