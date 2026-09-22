"use client";

import { useState, useCallback } from "react";
import { useMallStore } from "@/store/use-mall-store";
import { SHOP_CATEGORIES, SHOP_STATUSES } from "@/lib/model/shop-catalog";
import type { ShopCategory, ShopStatus } from "@/lib/filter/shops";

export function ShopSearchFilters({ floors }: { floors: Array<{ id: string; label: string }> }) {
  const activeCategoryId = useMallStore((s) => s.activeCategoryId);
  const activeStatusId = useMallStore((s) => s.activeStatusId);
  const activeFloorId = useMallStore((s) => s.activeFloorId);
  const setActiveCategory = useMallStore((s) => s.setActiveCategory);
  const setActiveStatus = useMallStore((s) => s.setActiveStatus);
  const setActiveFloor = useMallStore((s) => s.setActiveFloor);
  const [query, setQuery] = useState("");

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
  }, []);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
  }, []);

  const handleCategoryChange = useCallback((cat: ShopCategory | null) => {
    setActiveCategory(cat);
  }, [setActiveCategory]);

  const handleStatusChange = useCallback((status: ShopStatus | null) => {
    setActiveStatus(status);
  }, [setActiveStatus]);

  const handleFloorChange = useCallback((floorId: string | null) => {
    setActiveFloor(floorId);
  }, [setActiveFloor]);

  const hasActiveFilters =
    query.length > 0 ||
    activeCategoryId !== null ||
    activeStatusId !== null ||
    activeFloorId !== null;

  const clearAllFilters = useCallback(() => {
    setQuery("");
    setActiveCategory(null);
    setActiveStatus(null);
    setActiveFloor(null);
  }, [setActiveCategory, setActiveStatus, setActiveFloor]);

  return (
    <div
      className="pointer-events-auto absolute right-4 top-16 z-20 w-72 rounded-lg border border-white/10 bg-white/5 p-3 backdrop-blur"
      role="search"
      aria-label="Shop search and filters"
    >
      <form onSubmit={handleSearch} className="space-y-3">
        <div>
          <label htmlFor="shop-search" className="sr-only">
            Search shops
          </label>
          <input
            id="shop-search"
            type="search"
            placeholder="Search shop name, number..."
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
            aria-label="Search shops by name or number"
          />
        </div>

        <div className="space-y-2">
          <div>
            <label htmlFor="category-filter" className="text-xs text-white/60">
              Category
            </label>
            <select
              id="category-filter"
              value={activeCategoryId ?? ""}
              onChange={(e) => handleCategoryChange((e.target.value as ShopCategory) || null)}
              className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
            >
              <option value="">All Categories</option>
              {SHOP_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="status-filter" className="text-xs text-white/60">
              Status
            </label>
            <select
              id="status-filter"
              value={activeStatusId ?? ""}
              onChange={(e) => handleStatusChange((e.target.value as ShopStatus) || null)}
              className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
            >
              <option value="">All Statuses</option>
              {SHOP_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="floor-filter" className="text-xs text-white/60">
              Floor
            </label>
            <select
              id="floor-filter"
              value={activeFloorId ?? ""}
              onChange={(e) => handleFloorChange(e.target.value || null)}
              className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
            >
              <option value="">All Floors</option>
              {floors.map((floor) => (
                <option key={floor.id} value={floor.id}>
                  {floor.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="w-full rounded-md px-3 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors"
          >
            Clear all filters
          </button>
        )}
      </form>
    </div>
  );
}