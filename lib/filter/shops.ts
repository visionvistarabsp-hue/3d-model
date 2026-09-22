/**
 * Pure, zod-validated filtering for the shop-explorer 3D scene.
 *
 * The filter is expressed as a plain, serializable `ShopFilter` object; the
 * shop data comes from the data layer (`ShopRepository`). There is NO business
 * logic in the scene: this module is the single source of truth for "does
 * this shop match the current search + filters".
 *
 * Matching rules (all AND semantics):
 *  - query      free-text, matched case-insensitively against name + id
 *  - categoryId exact category match (nullable = no constraint)
 *  - statusId   exact status match   (nullable = no constraint)
 *  - floorId    exact floor match    (nullable = no constraint)
 *
 * All matchers are pure and unit-testable; see tests/unit/filter-shops.test.ts.
 */
import { z } from "zod";
import { SHOP_CATEGORIES, SHOP_STATUSES } from "@/lib/model/shop-catalog";

export const categorySchema = z.enum(SHOP_CATEGORIES);
export type ShopCategory = z.infer<typeof categorySchema>;

export const statusSchema = z.enum(SHOP_STATUSES);
export type ShopStatus = z.infer<typeof statusSchema>;

export const shopFilterSchema = z.object({
  query: z.string().max(120).optional(),
  categoryId: categorySchema.nullable().optional(),
  statusId: statusSchema.nullable().optional(),
  floorId: z.string().max(12).nullable().optional(),
});
export type ShopFilter = z.infer<typeof shopFilterSchema>;

/** Normalize a user-typed search term for comparison. */
function normalizeTerm(term: string): string {
  return term.trim().toLowerCase();
}

/** True when `field` (normalized) contains `query` (normalized). */
function fieldIncludes(field: string, query: string): boolean {
  return field.includes(query);
}

/** True when `name` matches the canonical shop object naming convention. */
export function matchesShopObjectName(name: string): boolean {
  return /^SHOP_[A-Z0-9]+_\d{3,}$/i.test(name.trim());
}

/** Minimal shape a shop must expose for filtering (kept in lockstep with types). */
export interface ShopLike {
  name?: string | null;
  shopId?: string | null;
  categoryId?: ShopCategory | null;
  statusId?: ShopStatus | null;
  floorId?: string | null;
}

/** Convenience alias so callers can write `FilteredShop`-flavoured generics. */
export type ShopFilterLike = ShopLike;

/**
 * Return true when a shop passes the filter.
 *
 * Empty/undefined filter fields mean "no constraint". A shop matches when it
 * passes ALL specified constraints (AND semantics).
 */
export function matchesShopFilter(shop: ShopLike, filter: ShopFilter): boolean {
  const query = normalizeTerm(filter.query ?? "");
  if (query) {
    const name = normalizeTerm(shop.name ?? "");
    const id = normalizeTerm(shop.shopId ?? "");
    if (!fieldIncludes(name, query) && !fieldIncludes(id, query)) return false;
  }
  if (filter.categoryId && shop.categoryId !== filter.categoryId) return false;
  if (filter.statusId && shop.statusId !== filter.statusId) return false;
  if (filter.floorId && shop.floorId !== filter.floorId) return false;
  return true;
}

/** Validate + normalize an unknown filter (throws on invalid filters). */
export function parseShopFilter(input: unknown): ShopFilter {
  return shopFilterSchema.parse(input);
}

/** Apply a filter to a list of shops, preserving order. Pure. */
export function filterShops(shops: ShopLike[], filter: ShopFilter): ShopLike[] {
  return shops.filter((shop) => matchesShopFilter(shop, filter));
}
