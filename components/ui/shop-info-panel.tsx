"use client";

import { useEffect, useState } from "react";
import { useMallStore } from "@/store/use-mall-store";
import { getRepository } from "@/lib/data/get-repository";
import { STATUS_COLORS, CATEGORY_COLORS } from "@/lib/theme/shop-colors";
import type { Shop, ShopStatus, ShopCategory } from "@/types";

export function ShopInfoPanel() {
  const selectedShopId = useMallStore((s) => s.selectedShopId);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedShopId) {
      setShop(null);
      return;
    }

    let alive = true;
    setLoading(true);
    setError(null);

    getRepository()
      .then((repo) => repo.getShopById(selectedShopId))
      .then((data) => {
        if (alive) {
          setShop(data);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (alive) {
          setError(e instanceof Error ? e.message : "Failed to load shop");
          setLoading(false);
        }
      });

    return () => {
      alive = false;
    };
  }, [selectedShopId]);

  if (!selectedShopId) {
    return (
      <div className="pointer-events-auto absolute right-4 bottom-4 z-20 w-80 rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur">
        <p className="text-white/50 text-sm text-center py-8">
          Click a shop to view details
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="pointer-events-auto absolute right-4 bottom-4 z-20 w-80 rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/30 border-t-white" />
          <span className="ml-3 text-sm text-white/70">Loading shop details...</span>
        </div>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="pointer-events-auto absolute right-4 bottom-4 z-20 w-80 rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur">
        <p className="text-red-400 text-sm text-center py-4">
          {error ?? "Shop not found"}
        </p>
        <button
          onClick={() => useMallStore.getState().selectShop(null)}
          className="mt-3 w-full rounded-md px-3 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors"
        >
          Close
        </button>
      </div>
    );
  }

  const statusColor = STATUS_COLORS[shop.status as ShopStatus] ?? "#666";
  const categoryColor = CATEGORY_COLORS[shop.category as ShopCategory] ?? "#666";

  return (
    <div className="pointer-events-auto absolute right-4 bottom-4 z-20 w-80 max-h-[60vh] overflow-auto rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-white truncate">{shop.name}</h3>
          <p className="text-xs text-white/50">Unit: {shop.shopNumber}</p>
        </div>
        <button
          onClick={() => useMallStore.getState().selectShop(null)}
          className="text-white/50 hover:text-white transition-colors"
          aria-label="Close shop details"
        >
          ✕
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span
          className="px-2 py-0.5 text-xs font-medium rounded bg-white/10"
          style={{ backgroundColor: `${statusColor}33`, color: statusColor, border: `1px solid ${statusColor}66` }}
        >
          {shop.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
        </span>
        <span
          className="px-2 py-0.5 text-xs font-medium rounded bg-white/10"
          style={{ backgroundColor: `${categoryColor}33`, color: categoryColor, border: `1px solid ${categoryColor}66` }}
        >
          {shop.category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
        </span>
        <span className="px-2 py-0.5 text-xs text-white/60 bg-white/5 rounded border border-white/10">
          Floor: {shop.floorId}
        </span>
      </div>

      <dl className="mt-4 space-y-2 text-sm">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <dt className="text-white/50">Area</dt>
          <dd className="text-white font-mono">{shop.areaSqM.toLocaleString()} m²</dd>
          <dt className="text-white/50">Frontage</dt>
          <dd className="text-white font-mono">{shop.frontageM} m</dd>
          <dt className="text-white/50">Depth</dt>
          <dd className="text-white font-mono">{shop.depthM} m</dd>
          <dt className="text-white/50">Floor</dt>
          <dd className="text-white">{shop.floorId}</dd>
        </div>
      </dl>

      {shop.price && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <dt className="text-xs text-white/50 uppercase tracking-wide">Price</dt>
          <dd className="mt-1 text-white font-mono">
            {shop.price.sale !== undefined && (
              <div>
                Sale: {shop.price.currency} {shop.price.sale.toLocaleString()}
              </div>
            )}
            {shop.price.leaseRateSqm !== undefined && (
              <div>
                Lease: {shop.price.currency} {shop.price.leaseRateSqm.toLocaleString()}/m²/mo
              </div>
            )}
          </dd>
        </div>
      )}

      {shop.description && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <dt className="text-xs text-white/50 uppercase tracking-wide">Description</dt>
          <dd className="mt-1 text-sm text-white/80 whitespace-pre-wrap">{shop.description}</dd>
        </div>
      )}

      {shop.isDemo && shop.demoNotice && (
        <div className="mt-3 pt-3 border-t border-yellow-500/30">
          <p className="text-xs text-yellow-300/90">⚠ {shop.demoNotice}</p>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button className="flex-1 rounded-md bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors">
          View Brochure
        </button>
        <button className="flex-1 rounded-md border border-white/20 px-3 py-2 text-sm font-medium text-white hover:border-white/40 transition-colors">
          Enquire
        </button>
      </div>
    </div>
  );
}