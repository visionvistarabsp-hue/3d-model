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

export interface MallState {
  // data
  floors: Floor[];
  shops: Shop[] | null;
  loaded: boolean;
  loadError: string | null;

  // selection
  selectedShopId: string | null;
  hoveredShopId: string | null;

  // visualization
  viewMode: ViewMode;

  // actions
  setFloors: (floors: Floor[]) => void;
  setShops: (shops: Shop[]) => void;
  setLoading: (loaded: boolean, error?: string | null) => void;
  selectShop: (id: string | null) => void;
  hoverShop: (id: string | null) => void;
  setViewMode: (mode: ViewMode) => void;
}

export const useMallStore = create<MallState>((set) => ({
  floors: [],
  shops: null,
  loaded: false,
  loadError: null,
  selectedShopId: null,
  hoveredShopId: null,
  viewMode: "realistic",

  setFloors: (floors) => set({ floors }),
  setShops: (shops) => set({ shops }),
  setLoading: (loaded, error = null) => set({ loaded, loadError: error }),
  selectShop: (id) => set({ selectedShopId: id }),
  hoverShop: (id) => set({ hoveredShopId: id }),
  setViewMode: (mode) => set(() => ({ viewMode: isViewMode(mode) ? mode : "realistic" }))
}));

/** Selector helpers to avoid re-rendering whole scene on irrelevant changes. */
export const selectSelectedShopId = (s: MallState) => s.selectedShopId;
export const selectHoveredShopId = (s: MallState) => s.hoveredShopId;
export const selectViewMode = (s: MallState) => s.viewMode;