"use client";

import { useCallback, useState } from "react";
import { useMallStore } from "@/store/use-mall-store";
import { SHOP_CATEGORIES, SHOP_STATUSES } from "@/lib/model/shop-catalog";
import type { ShopCategory, ShopStatus } from "@/lib/filter/shops";
import { titleCase } from "@/lib/theme/premium";
import { IconSearch, IconClose, IconChevronDown, IconReset } from "@/components/ui/icons";

interface ShopSearchFiltersProps {
  floors: Array<{ id: string; label: string }>;
}

/**
 * Search + filters. Desktop: floating glass card. Mobile: a thumb-friendly
 * bottom sheet opened from a floating pill. The same form renders in both —
 * only the shell differs.
 */
export function ShopSearchFilters({ floors }: ShopSearchFiltersProps) {
  const activeCategoryId = useMallStore((s) => s.activeCategoryId);
  const activeStatusId = useMallStore((s) => s.activeStatusId);
  const activeFloorId = useMallStore((s) => s.activeFloorId);
  const setActiveCategory = useMallStore((s) => s.setActiveCategory);
  const setActiveStatus = useMallStore((s) => s.setActiveStatus);
  const setActiveFloor = useMallStore((s) => s.setActiveFloor);
  const searchSheetOpen = useMallStore((s) => s.searchSheetOpen);
  const setSearchSheetOpen = useMallStore((s) => s.setSearchSheetOpen);

  const [query, setQuery] = useState("");

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
  }, []);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
  }, []);

  const hasActive =
    query.length > 0 ||
    activeCategoryId !== null ||
    activeStatusId !== null ||
    activeFloorId !== null;

  const activeCount =
    (query.length > 0 ? 1 : 0) +
    (activeCategoryId ? 1 : 0) +
    (activeStatusId ? 1 : 0) +
    (activeFloorId ? 1 : 0);

  const clearAllFilters = useCallback(() => {
    setQuery("");
    setActiveCategory(null);
    setActiveStatus(null);
    setActiveFloor(null);
  }, [setActiveCategory, setActiveStatus, setActiveFloor]);

  return (
    <>
      {/* Desktop — floating glass card */}
      <div
        className="pointer-events-auto absolute right-4 top-20 z-20 hidden w-72 sm:block"
        role="search"
        aria-label="Shop search and filters"
      >
        <div className="luxe-panel fade-up rounded-2xl p-4">
          <PanelHeader hasActive={hasActive} activeCount={activeCount} onClear={clearAllFilters} />
          <FilterForm
            floors={floors}
            query={query}
            onQueryChange={handleQueryChange}
            onSubmit={handleSubmit}
            hasActive={hasActive}
            onClear={clearAllFilters}
          />
        </div>
      </div>

      {/* Mobile — floating trigger pill */}
      <button
        type="button"
        onClick={() => setSearchSheetOpen(true)}
        className="luxe-panel pointer-events-auto absolute bottom-6 left-4 z-20 flex cursor-pointer items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-white/90 transition-transform active:scale-95 sm:hidden"
      >
        <IconSearch className="h-4 w-4" />
        Search &amp; Filters
        {hasActive && (
          <span className="rounded-full bg-indigo-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {activeCount}
          </span>
        )}
      </button>

      {/* Mobile — bottom sheet */}
      {searchSheetOpen && (
        <div className="fixed inset-0 z-30 sm:hidden">
          <button
            type="button"
            aria-label="Close search panel"
            onClick={() => setSearchSheetOpen(false)}
            className="mod-fade absolute inset-0 cursor-pointer bg-black/50"
          />
          <div className="luxe-panel sheet-in absolute inset-x-0 bottom-0 max-h-[72vh] rounded-t-3xl border-b-0">
            <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-white/25" />
            <div className="luxe-scroll max-h-[64vh] overflow-y-auto px-5 pb-7 pt-3" role="search">
              <div className="flex items-center justify-between">
                <PanelHeader hasActive={hasActive} activeCount={activeCount} onClear={clearAllFilters} />
                <button
                  type="button"
                  aria-label="Close search panel"
                  onClick={() => setSearchSheetOpen(false)}
                  className="cursor-pointer rounded-full p-1.5 text-white/55 hover:bg-white/10 hover:text-white"
                >
                  <IconClose className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3">
                <FilterForm
                  floors={floors}
                  query={query}
                  onQueryChange={handleQueryChange}
                  onSubmit={handleSubmit}
                  hasActive={hasActive}
                  onClear={clearAllFilters}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PanelHeader({
  hasActive,
  activeCount,
  onClear
}: {
  hasActive: boolean;
  activeCount: number;
  onClear: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h2 className="text-sm font-semibold text-white/90">Search &amp; Filters</h2>
      {hasActive && (
        <button
          type="button"
          onClick={onClear}
          className="flex cursor-pointer items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-medium text-indigo-300 transition-colors hover:bg-white/10 hover:text-indigo-200"
        >
          <IconReset className="h-3 w-3" />
          Clear {activeCount ? `(${activeCount})` : ""}
        </button>
      )}
    </div>
  );
}

interface FilterFormProps {
  floors: Array<{ id: string; label: string }>;
  query: string;
  onQueryChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  hasActive: boolean;
  onClear: () => void;
}

function FilterForm({ floors, query, onQueryChange, onSubmit, hasActive, onClear }: FilterFormProps) {
  const activeCategoryId = useMallStore((s) => s.activeCategoryId);
  const activeStatusId = useMallStore((s) => s.activeStatusId);
  const activeFloorId = useMallStore((s) => s.activeFloorId);
  const setActiveCategory = useMallStore((s) => s.setActiveCategory);
  const setActiveStatus = useMallStore((s) => s.setActiveStatus);
  const setActiveFloor = useMallStore((s) => s.setActiveFloor);

  const selectClass =
    "w-full appearance-none rounded-xl border border-white/10 bg-black/30 py-2 pl-3 pr-9 text-sm text-white/90 focus:border-indigo-400/60 focus:outline-none focus:ring-1 focus:ring-indigo-400/40";

  return (
    <form onSubmit={onSubmit} className="space-y-3.5">
      <div>
        <label htmlFor="shop-search" className="sr-only">
          Search shops
        </label>
        <div className="relative">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            id="shop-search"
            type="search"
            placeholder="Search shop name, number..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 py-2 pl-9 pr-9 text-sm text-white placeholder-white/35 focus:border-indigo-400/60 focus:outline-none focus:ring-1 focus:ring-indigo-400/40"
            aria-label="Search shops by name or number"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              aria-label="Clear search text"
              className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-full p-1 text-white/45 hover:bg-white/10 hover:text-white"
            >
              <IconClose className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label htmlFor="category-filter" className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-white/45">
            Category
          </label>
          <div className="relative">
            <select
              id="category-filter"
              value={activeCategoryId ?? ""}
              onChange={(e) => setActiveCategory((e.target.value as ShopCategory) || null)}
              className={selectClass}
            >
              <option value="">All Categories</option>
              {SHOP_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {titleCase(cat)}
                </option>
              ))}
            </select>
            <IconChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          </div>
        </div>

        <div>
          <label htmlFor="status-filter" className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-white/45">
            Status
          </label>
          <div className="relative">
            <select
              id="status-filter"
              value={activeStatusId ?? ""}
              onChange={(e) => setActiveStatus((e.target.value as ShopStatus) || null)}
              className={selectClass}
            >
              <option value="">All Statuses</option>
              {SHOP_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {titleCase(status)}
                </option>
              ))}
            </select>
            <IconChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          </div>
        </div>

        <div>
          <label htmlFor="floor-filter" className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-white/45">
            Floor
          </label>
          <div className="relative">
            <select
              id="floor-filter"
              value={activeFloorId ?? ""}
              onChange={(e) => setActiveFloor(e.target.value || null)}
              className={selectClass}
            >
              <option value="">All Floors</option>
              {floors.map((floor) => (
                <option key={floor.id} value={floor.id}>
                  {floor.label}
                </option>
              ))}
            </select>
            <IconChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          </div>
        </div>
      </div>

      {hasActive && (
        <button
          type="button"
          onClick={onClear}
          className="w-full cursor-pointer rounded-xl border border-white/10 bg-white/5 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          Clear all filters
        </button>
      )}
    </form>
  );
}