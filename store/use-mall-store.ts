/**
 * Global UI/store state for the 3D explorer.
 *
 * By design the 3D scene is DUMB: it receives a shopId, never the full shop
 * record. The store translates mesh clicks to ids, and the data layer resolves
 * ids to commercial records. This keeps the R3F tree free of business logic.
 */
"use client";

import { create } from "zustand";
import type { Shop, Floor, ViewMode } from "@/types";
import { isViewMode } from "@/lib/validation/schemas";
import type { ShopCategory, ShopStatus } from "@/lib/filter/shops";

export interface MallState {
  // data
  floors: Floor[];
  shops: Shop[] | null;
  loaded: boolean;
  loadError: string | null;

  // selection
  selectedShopId: string | null;
  hoveredShopId: string | null;

  // navigation
  activeFloorId: string | null; // null = all floors visible
  activeCategoryId: ShopCategory | null;
  activeStatusId: ShopStatus | null;

  // visualization
  viewMode: ViewMode;

  // mobile bottom-sheet (search & filters)
  searchSheetOpen: boolean;

  // actions
  setFloors: (floors: Floor[]) => void;
  setShops: (shops: Shop[]) => void;
  setLoading: (loaded: boolean, error?: string | null) => void;
  selectShop: (id: string | null) => void;
  hoverShop: (id: string | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setActiveFloor: (id: string | null) => void;
  setActiveCategory: (id: ShopCategory | null) => void;
  setActiveStatus: (id: ShopStatus | null) => void;
  setSearchSheetOpen: (open: boolean) => void;
}

export const useMallStore = create<MallState>((set) => ({
  floors: [],
  shops: null,
  loaded: false,
  loadError: null,
  selectedShopId: null,
  hoveredShopId: null,
  activeFloorId: null,
  activeCategoryId: null,
  activeStatusId: null,
  viewMode: "realistic",
  searchSheetOpen: false,

  setFloors: (floors) => set({ floors }),
  setShops: (shops) => set({ shops }),
  setLoading: (loaded, error = null) => set({ loaded, loadError: error }),
  selectShop: (id) => set({ selectedShopId: id, searchSheetOpen: false }),
  hoverShop: (id) => set({ hoveredShopId: id }),
  setViewMode: (mode) => set(() => ({ viewMode: isViewMode(mode) ? mode : "realistic" })),
  setActiveFloor: (id) => set({ activeFloorId: id }),
  setActiveCategory: (id) => set({ activeCategoryId: id }),
  setActiveStatus: (id) => set({ activeStatusId: id }),
  setSearchSheetOpen: (open) => set({ searchSheetOpen: open })
}));

/** Selector helpers to avoid re-rendering whole scene on irrelevant changes. */
export const selectSelectedShopId = (s: MallState) => s.selectedShopId;
export const selectHoveredShopId = (s: MallState) => s.hoveredShopId;
export const selectViewMode = (s: MallState) => s.viewMode;
export const selectActiveFloorId = (s: MallState) => s.activeFloorId;
export const selectActiveCategoryId = (s: MallState) => s.activeCategoryId;
export const selectActiveStatusId = (s: MallState) => s.activeStatusId;