/**
 * Zod schemas for runtime validation of data + model metadata.
 * All data crossing the boundary between storage / API and the 3D app is
 * validated with these. TypeScript types mirror them (types/*.ts).
 */
import { z } from "zod";
import type { Shop, Floor, ModelMetadata, ViewMode, DeviceProfile } from "@/types";

export const SHOP_ID_PATTERN = /^SHOP_[A-Z0-9]+(_\d{3})$/;

export const shopStatusSchema = z.enum([
  "available",
  "reserved",
  "leased",
  "under_construction"
]);

export const shopCategorySchema = z.enum([
  "retail",
  "food_and_beverage",
  "entertainment",
  "services",
  "wellness",
  "anchor",
  "office",
  "common"
]);

export const coordinatesSchema = z
  .object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
    polygon: z.array(z.tuple([z.number(), z.number()])).optional()
  })
  .optional();

export const mediaAssetSchema = z.object({
  kind: z.enum(["image", "brochure", "video"]),
  key: z.string(),
  label: z.string().optional()
});

export const shopSchema = z.object({
  id: z
    .string()
    .regex(SHOP_ID_PATTERN, "shop id must match SHOP_<FLOOR>_<SEQ> (e.g. SHOP_G_001)"),
  shopNumber: z.string(),
  unitId: z.string().optional(),
  floorId: z.string(),
  name: z.string(),
  status: shopStatusSchema,
  category: shopCategorySchema,
  areaSqM: z.number().nonnegative(),
  frontageM: z.number().nonnegative(),
  depthM: z.number().nonnegative(),
  price: z
    .object({
      currency: z.string().length(3),
      sale: z.number().nonnegative().optional(),
      leaseRateSqm: z.number().nonnegative().optional()
    })
    .nullable(),
  modelObjectName: z.string(),
  images: z.array(z.string()),
  brochure: z.string().optional(),
  description: z.string().optional(),
  media: z.array(mediaAssetSchema),
  coordinates: coordinatesSchema,
  isDemo: z.boolean(),
  demoNotice: z.string().optional(),
  updatedAt: z.string().datetime()
}) satisfies z.ZodType<Shop>;

export const floorSchema = z.object({
  id: z.string(),
  index: z.number().int().nonnegative(),
  label: z.string(),
  kind: z.enum(["basement", "ground", "upper"]),
  baseElevationM: z.number(),
  heightM: z.number().positive(),
  description: z.string().optional(),
  isDemo: z.boolean()
}) satisfies z.ZodType<Floor>;

export const buildingSchema = z.object({
  id: z.string(),
  name: z.string(),
  floors: z.array(floorSchema),
  shopCount: z.number().int().nonnegative()
});

export const modelMetadataSchema = z.object({
  source: z.enum(["demo", "authoritative", "mixed"]),
  isDemo: z.boolean(),
  modelId: z.string(),
  label: z.string(),
  version: z.string(),
  units: z.literal("meters"),
  layout: z.enum(["single", "per_floor"]),
  glbKey: z.string(),
  floors: z.array(
    z.object({
      floorId: z.string(),
      glbKey: z.string(),
      url: z.string().optional()
    })
  ),
  objectNaming: z.string(),
  objectCount: z.number().int().nonnegative(),
  exportedAt: z.string().datetime(),
  toolchain: z.object({
    blenderVersion: z.string(),
    scriptVersion: z.string()
  })
}) satisfies z.ZodType<ModelMetadata>;

export const viewModeSchema = z.enum(["realistic", "hologram", "xray"]);

/** Parse + validate a raw JSON blob into a typed record. Throws on malformed data. */
export function parseShop(value: unknown): Shop {
  return shopSchema.parse(value);
}

export function parseFloors(value: unknown): Floor[] {
  return z.array(floorSchema).parse(value);
}

export function parseShops(value: unknown): Shop[] {
  return z.array(shopSchema).parse(value);
}

export function parseModelMetadata(value: unknown): ModelMetadata {
  return modelMetadataSchema.parse(value);
}

export function isViewMode(value: unknown): value is ViewMode {
  return viewModeSchema.safeParse(value).success;
}

export function isDeviceProfile(value: unknown): value is DeviceProfile {
  return (
    typeof value === "object" &&
    value !== null &&
    ["high", "medium", "low"].includes((value as DeviceProfile).tier)
  );
}