"use client";

import { useEffect } from "react";
import type { Floor, Shop } from "@/types";
import { useMallStore } from "@/store/use-mall-store";
import { MallViewer } from "@/components/viewer/mall-viewer";
import { StatusBar } from "@/components/ui/status-bar";

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
    </div>
  );
}