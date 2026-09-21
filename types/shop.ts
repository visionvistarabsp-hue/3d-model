/**
 * Canonical shop types.
 *
 * IMPORTANT (architecture rule):
 * The 3D mesh in the GLB is NEVER the source of truth for business data.
 * It only carries a stable `shopId` mapping (object name `SHOP_<FLOOR>_<NNN>`
 * and/or `userData.shopId`). Everything commercial — status, category, price,
 * area, images, brochure, description — must come from the data layer
 * (ShopRepository), never from the model.
 */

export type ShopStatus = "available" | "reserved" | "leased" | "under_construction";

export type ShopCategory =
  | "retail"
  | "food_and_beverage"
  | "entertainment"
  | "services"
  | "wellness"
  | "anchor"
  | "office"
  | "common";

/** Coordinates in local scene space (Blender world units = meters). */
export interface ShopCoordinates {
  x: number;
  y: number;
  z: number;
  /** Optional footprint polygon in the floor plane (x, z), clockwise. */
  polygon?: readonly [number, number][];
}

/** A link to an image, brochure, or video asset. Never a local file path. */
export interface ShopMediaAsset {
  kind: "image" | "brochure" | "video";
  /** Storage key resolved through StorageClient (e.g. `shops/SHOP_G_001/floorplan.webp`). */
  key: string;
  label?: string;
}

export const SHOP_ID_PATTERN = /^SHOP_[A-Z0-9]+(_\d{3})$/;

/**
 * Canonical shop record. Every shop has a stable unique `id` (e.g. SHOP_G_001)
 * and a matching `modelObjectName` in the exported GLB.
 */
export interface Shop {
  id: string;
  shopNumber: string;
  /** Id used by the data pipeline / tenant. Kept separate from the display number. */
  unitId?: string;
  floorId: string;
  name: string;
  status: ShopStatus;
  category: ShopCategory;
  /** Built-up area in square meters. */
  areaSqM: number;
  /** Shop frontage along the aisle, in meters. */
  frontageM: number;
  /** Shop depth from the aisle, in meters. */
  depthM: number;
  /** List price. `null`/omitted when the shop is not for sale/lease. */
  price: {
    currency: string;
    /** Sale price, or null when only lease is offered. */
    sale?: number;
    /** Lease rate (typically per sqm per month). */
    leaseRateSqm?: number;
  } | null;
  /** Stable Blender object name (e.g. `SHOP_G_001`). Lossless default = id. */
  modelObjectName: string;
  images: string[];
  brochure?: string;
  description?: string;
  media: ShopMediaAsset[];
  coordinates?: ShopCoordinates;
  /** `true` when this record is invented demo data, never real-world facts. */
  isDemo: boolean;
  demoNotice?: string;
  updatedAt: string;
}