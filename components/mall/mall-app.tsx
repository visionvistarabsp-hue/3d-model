"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import type { Floor, Shop } from "@/types";
import { useMallStore } from "@/store/use-mall-store";
import { StatusBar } from "@/components/ui/status-bar";
import { FloorSelector } from "@/components/ui/floor-selector";
import { ShopSearchFilters } from "@/components/ui/shop-search-filters";
import { ShopInfoPanel } from "@/components/ui/shop-info-panel";

/**
 * The 3D viewport is lazy-loaded (three.js + drei are the biggest chunks in the
 * bundle) so the UI shell and shop data paint instantly; the viewer streams in
 * behind the branded veil. ssr:false keeps WebGL work client-only.
 */
const MallViewer = dynamic(
  () => import("@/components/viewer/mall-viewer").then((m) => m.MallViewer),
  {
    ssr: false,
    loading: () => <ViewerVeil />
  }
);

/**
 * Client mount point for the 3D explorer. Receives data already resolved by
 * the server page; hydrates the zustand store once (no refetch → no flash).
 */
export function MallApp({
  title,
  floors,
  shops,
  error
}: {
  title?: string;
  floors: Floor[];
  shops: Shop[];
  error: string | null;
}) {
  const setFloors = useMallStore((s) => s.setFloors);
  const setShops = useMallStore((s) => s.setShops);
  const setLoading = useMallStore((s) => s.setLoading);

  useEffect(() => {
    if (error) {
      setLoading(true, error);
      return;
    }
    setFloors(floors);
    setShops(shops);
    setLoading(true);
  }, [error, floors, shops, setFloors, setShops, setLoading]);

  return (
    <div className="relative h-full w-full">
      <StatusBar title={title} />
      <MallViewer />
      <FloorSelector floors={floors} />
      <ShopSearchFilters floors={floors} />
      <ShopInfoPanel />
    </div>
  );
}

function ViewerVeil() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
      <div
        className="h-12 w-12 rounded-2xl"
        style={{
          background: "linear-gradient(135deg, #6366f1, #22d3ee)",
          boxShadow: "0 10px 40px -8px rgba(99, 102, 241, 0.7)"
        }}
      />
      <div className="text-sm font-medium tracking-wide text-white/70">
        Initializing experience…
      </div>
      <div className="shimmer-bar h-1 w-44 overflow-hidden rounded-full bg-white/10" />
    </div>
  );
}