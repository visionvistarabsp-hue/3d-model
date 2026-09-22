/**
 * Shop id <-> Blender object name mapping.
 *
 * Naming convention (stable, never renamed after export):
 *
 *   SHOP_<FLOOR>_<SEQ>        e.g. SHOP_G_001, SHOP_F1_007
 *
 *   Structure / support objects (not selectable):
 *   MALL_<FLOOR>_STRUCT       floorslab, columns...
 *   COMMON_<FLOOR>_<NAME>     atriums, corridors, escalators...
 *   SITE_*                    ground plane, context
 *
 * The web app parses floorId from the object name, and the data layer owns
 * every other field. Parsing is intentionally lenient at the boundary so a
 * hand-authored object name never crashes selection.
 */

export interface ParsedShopId {
  shopId: string;
  floorId: string;
  sequence: number;
}

/**
 * Parse a Blender object name into its shop identity, or null when the name
 * is not a shop object. Never throws.
 */
export function parseShopObjectName(name: string): ParsedShopId | null {
  const m = /^SHOP_([A-Z0-9]+)_(\d{3,})$/.exec(name.trim().toUpperCase());
  if (!m) return null;
  return {
    shopId: name.trim().toUpperCase(),
    floorId: m[1],
    sequence: parseInt(m[2], 10)
  };
}

/** Extract the raw stable identity directly from a mesh's userData if present. */
export function shopIdFromUserData(userData: Record<string, unknown> | undefined): string | null {
  if (!userData) return null;
  const v = userData.shopId;
  if (typeof v === "string") return v;
  return null;
}

/**
 * Resolve a shop id from a GLB object, preferring its userData.shopId and
 * falling back to its node name. Shops export as multiple parts (e.g.
 * `SHOP_G_001_GLASS`) whose names do not match the canonical pattern, but
 * every part carries userData.shopId. Never throws.
 */
export function shopIdFromObject(source: {
  name?: string;
  userData?: Record<string, unknown>;
}): string | null {
  const fromData = shopIdFromUserData(source.userData);
  if (fromData) return parseShopObjectName(fromData)?.shopId ?? null;
  if (!source.name) return null;
  return parseShopObjectName(source.name)?.shopId ?? null;
}

/** Build the canonical object name for a floor + sequence. */
export function shopObjectName(floorId: string, seq: number): string {
  return `SHOP_${floorId.toUpperCase()}_${String(seq).padStart(3, "0")}`;
}

/** True when the object name belongs to the interactive structure (not a shop). */
export function isStructureObjectName(name: string): boolean {
  return (
    /^MALL_/.test(name) || /^COMMON_/.test(name) || /^SITE_/.test(name) || name === ""
  );
}