"use client";

import { useEffect, useState } from "react";
import { useMallStore } from "@/store/use-mall-store";
import { getRepository } from "@/lib/data/get-repository";
import { STATUS_COLORS, CATEGORY_COLORS } from "@/lib/theme/shop-colors";
import { ACCENT_GRADIENT, titleCase } from "@/lib/theme/premium";
import { IconClose } from "@/components/ui/icons";
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

  const deselect = () => useMallStore.getState().selectShop(null);

  let content: React.ReactNode;
  if (!selectedShopId) {
    content = (
      <div className="px-4 py-10 text-center text-sm text-white/50">
        Select a shop in the 3D view to see its details.
      </div>
    );
  } else if (loading) {
    content = (
      <div className="flex items-center justify-center gap-3 px-4 py-10 text-sm text-white/70">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/25 border-t-indigo-400" />
        Loading shop details…
      </div>
    );
  } else if (error || !shop) {
    content = (
      <div className="px-4 py-6 text-center">
        <p className="text-sm text-red-400">{error ?? "Shop not found"}</p>
        <button
          onClick={deselect}
          className="mt-3 cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white"
        >
          Close
        </button>
      </div>
    );
  } else {
    content = <ShopDetails shop={shop} onClose={deselect} />;
  }

  return (
    <>
      {/* Desktop — floating card */}
      <div className="luxe-panel hidden w-[22rem] flex-col overflow-hidden rounded-2xl sm:flex sm:absolute sm:right-4 sm:bottom-5 sm:z-20 sm:max-h-[72vh]">
        <div className="luxe-scroll overflow-y-auto">{content}</div>
      </div>

      {/* Mobile — bottom sheet (when a shop is selected) */}
      {selectedShopId && (
        <div className="fixed inset-0 z-30 sm:hidden">
          <button
            type="button"
            aria-label="Close shop details"
            onClick={deselect}
            className="mod-fade absolute inset-0 cursor-pointer bg-black/50"
          />
          <div className="luxe-panel sheet-in absolute inset-x-0 bottom-0 max-h-[80vh] rounded-t-3xl border-b-0" style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}>
            <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-white/25" />
            <div className="luxe-scroll max-h-[72vh] overflow-y-auto px-safe-x pb-6 pt-2">
              <div className="flex justify-end">
                <button
                  type="button"
                  aria-label="Close shop details"
                  onClick={deselect}
                  className="cursor-pointer rounded-full p-2 text-white/55 hover:bg-white/10 hover:text-white"
                >
                  <IconClose className="h-4 w-4" />
                </button>
              </div>
              {content}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ShopDetails({ shop, onClose }: { shop: Shop; onClose: () => void }) {
  const statusColor = STATUS_COLORS[shop.status as ShopStatus] ?? "#888";
  const categoryColor = CATEGORY_COLORS[shop.category as ShopCategory] ?? "#888";

  return (
    <div className="p-4">
      <div
        className="pointer-events-none -mx-2 -mt-2 mb-3 h-16 rounded-t-2xl"
        style={{
          background: `linear-gradient(135deg, ${categoryColor}30, transparent 65%)`
        }}
      />

      <div className="-mt-12 flex items-start justify-between gap-3 px-1">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-semibold"
            style={{
              backgroundColor: `${categoryColor}22`,
              color: categoryColor,
              border: `1px solid ${categoryColor}55`,
              boxShadow: `0 6px 18px -6px ${categoryColor}66`
            }}
          >
            {shop.name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-white">{shop.name}</h3>
            <p className="truncate text-xs text-white/50">
              Unit {shop.shopNumber} · Floor {shop.floorId}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close shop details"
          className="cursor-pointer rounded-full p-1.5 text-white/55 transition-colors hover:bg-white/10 hover:text-white"
        >
          <IconClose className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span
          className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
          style={{
            backgroundColor: `${statusColor}26`,
            color: statusColor,
            border: `1px solid ${statusColor}55`
          }}
        >
          {titleCase(shop.status)}
        </span>
        <span
          className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
          style={{
            backgroundColor: `${categoryColor}26`,
            color: categoryColor,
            border: `1px solid ${categoryColor}55`
          }}
        >
          {titleCase(shop.category)}
        </span>
        <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[11px] text-white/60">
          Floor: {shop.floorId}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-3 divide-x divide-white/10 rounded-xl border border-white/10 bg-black/20 text-center">
        <Stat label="Area" value={`${shop.areaSqM.toLocaleString()} m²`} />
        <Stat label="Frontage" value={`${shop.frontageM} m`} />
        <Stat label="Depth" value={`${shop.depthM} m`} />
      </dl>

      {shop.price && (
        <div className="mt-3 space-y-1 rounded-xl border border-white/10 bg-black/20 p-3">
          <dt className="text-[10px] font-medium uppercase tracking-wider text-white/45">
            Pricing
          </dt>
          {shop.price.sale !== undefined && (
            <dd className="font-mono text-sm text-white">
              Sale · {shop.price.currency} {shop.price.sale.toLocaleString()}
            </dd>
          )}
          {shop.price.leaseRateSqm !== undefined && (
            <dd className="font-mono text-sm text-white">
              Lease · {shop.price.currency} {shop.price.leaseRateSqm.toLocaleString()}/m²/mo
            </dd>
          )}
        </div>
      )}

      {shop.description && (
        <div className="mt-3">
          <dt className="text-[10px] font-medium uppercase tracking-wider text-white/45">
            Description
          </dt>
          <dd className="mt-1 max-h-40 space-y-1 overflow-y-auto text-xs text-white/80 sm:text-sm whitespace-pre-wrap">{shop.description}</dd>
        </div>
      )}

      {shop.isDemo && shop.demoNotice && (
        <div className="mt-3 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2">
          <p className="text-xs text-amber-200/90">⚠ {shop.demoNotice}</p>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          className="w-full cursor-pointer rounded-xl px-3 py-2.5 text-sm font-semibold text-[#0b0d12] transition-transform active:scale-[0.98] sm:flex-1"
          style={{ background: ACCENT_GRADIENT, boxShadow: "0 8px 24px -8px rgba(99, 102, 241, 0.8)" }}
        >
          Enquire
        </button>
        <button
          type="button"
          className="w-full cursor-pointer rounded-xl border border-white/20 bg-white/5 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:border-white/40 hover:bg-white/10 sm:flex-1"
        >
          View Brochure
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-1 py-2 sm:px-2 sm:py-3">
      <dd className="truncate font-mono text-xs font-medium text-white sm:text-sm">{value}</dd>
      <dt className="mt-0.5 text-[8px] uppercase tracking-wider text-white/45 sm:text-[10px]">{label}</dt>
    </div>
  );
}