/**
 * Shared colour tokens for shop status / category display in the viewer.
 * Centralised so the 3D materials, info panel and floor legend agree.
 */
import type { ShopCategory, ShopStatus } from "@/types";

export const STATUS_COLORS: Record<ShopStatus, string> = {
  available: "#3fb27f", // green — open for sale/lease
  reserved: "#e0a92e", // amber — under offer
  leased: "#4f8ff7", // blue — occupied
  under_construction: "#b06bcf" // violet — not ready
};

export const CATEGORY_COLORS: Record<ShopCategory, string> = {
  retail: "#4f8ff7",
  food_and_beverage: "#e07a3f",
  entertainment: "#b06bcf",
  services: "#3fb27f",
  wellness: "#38c0c8",
  anchor: "#d1544f",
  office: "#7f8fb0",
  common: "#5a6270"
};

export const VIEW_MODE_ACCENT: Record<string, string> = {
  realistic: "#e8edf5",
  hologram: "#27e0f0",
  xray: "#5aa7ff"
};

/** Colour slot for the placeholder mall; structure objects share this. */
export const STRUCTURE_COLOR = "#23262f";

export const SHOP_COLORS = STATUS_COLORS;