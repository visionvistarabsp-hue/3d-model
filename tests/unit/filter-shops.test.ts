import { describe, expect, it } from "vitest";
import {
  matchesShopFilter,
  parseShopFilter,
  filterShops,
  matchesShopObjectName,
  shopFilterSchema,
  type ShopFilter,
  type ShopLike,
} from "@/lib/filter/shops";

describe("matchesShopFilter", () => {
  const baseShop: ShopLike = {
    name: "Test Shop",
    shopId: "SHOP_G_001",
    categoryId: "retail",
    statusId: "available",
    floorId: "G",
  };

  it("returns true for empty filter (no constraints)", () => {
    expect(matchesShopFilter(baseShop, {})).toBe(true);
  });

  it("matches query against name case-insensitively", () => {
    expect(matchesShopFilter(baseShop, { query: "test" })).toBe(true);
    expect(matchesShopFilter(baseShop, { query: "SHOP" })).toBe(true);
    expect(matchesShopFilter(baseShop, { query: "xyz" })).toBe(false);
  });

  it("matches query against shopId", () => {
    expect(matchesShopFilter(baseShop, { query: "g_001" })).toBe(true);
    expect(matchesShopFilter(baseShop, { query: "SHOP_G" })).toBe(true);
  });

  it("matches exact categoryId", () => {
    expect(matchesShopFilter(baseShop, { categoryId: "retail" })).toBe(true);
    expect(matchesShopFilter(baseShop, { categoryId: "food_and_beverage" })).toBe(false);
  });

  it("matches exact statusId", () => {
    expect(matchesShopFilter(baseShop, { statusId: "available" })).toBe(true);
    expect(matchesShopFilter(baseShop, { statusId: "leased" })).toBe(false);
  });

  it("matches exact floorId", () => {
    expect(matchesShopFilter(baseShop, { floorId: "G" })).toBe(true);
    expect(matchesShopFilter(baseShop, { floorId: "F1" })).toBe(false);
  });

  it("applies AND semantics across all filter fields", () => {
    expect(
      matchesShopFilter(baseShop, { query: "test", categoryId: "retail" })
    ).toBe(true);
    expect(
      matchesShopFilter(baseShop, { query: "test", categoryId: "food_and_beverage" })
    ).toBe(false);
    expect(
      matchesShopFilter(baseShop, {
        query: "test",
        categoryId: "retail",
        statusId: "available",
        floorId: "G",
      })
    ).toBe(true);
    expect(
      matchesShopFilter(baseShop, {
        query: "test",
        categoryId: "retail",
        statusId: "leased",
      })
    ).toBe(false);
  });

  it("handles nullable/optional fields correctly", () => {
    const shopNoCategory: ShopLike = { ...baseShop, categoryId: null };
    expect(matchesShopFilter(shopNoCategory, { categoryId: "retail" })).toBe(
      false
    );
    expect(matchesShopFilter(shopNoCategory, {})).toBe(true);
  });
});

describe("parseShopFilter", () => {
  it("parses valid filter object", () => {
    const input = { query: "test", categoryId: "retail", floorId: "G" };
    const result = parseShopFilter(input);
    expect(result.query).toBe("test");
    expect(result.categoryId).toBe("retail");
    expect(result.floorId).toBe("G");
  });

  it("defaults optional fields to undefined", () => {
    const result = parseShopFilter({});
    expect(result.query).toBeUndefined();
    expect(result.categoryId).toBeUndefined();
    expect(result.statusId).toBeUndefined();
    expect(result.floorId).toBeUndefined();
  });

  it("throws on invalid categoryId", () => {
    expect(() => parseShopFilter({ categoryId: "invalid" })).toThrow();
  });

  it("throws on invalid statusId", () => {
    expect(() => parseShopFilter({ statusId: "invalid" })).toThrow();
  });

  it("throws on query too long", () => {
    expect(() => parseShopFilter({ query: "a".repeat(121) })).toThrow();
  });
});

describe("filterShops", () => {
  const shops: ShopLike[] = [
    {
      name: "Retail Store",
      shopId: "SHOP_G_001",
      categoryId: "retail",
      statusId: "available",
      floorId: "G",
    },
    {
      name: "Food Court",
      shopId: "SHOP_F1_002",
      categoryId: "food_and_beverage",
      statusId: "available",
      floorId: "F1",
    },
    {
      name: "Entertainment Hub",
      shopId: "SHOP_F2_003",
      categoryId: "entertainment",
      statusId: "leased",
      floorId: "F2",
    },
  ];

  it("returns all shops for empty filter", () => {
    expect(filterShops(shops, {})).toHaveLength(3);
  });

  it("filters by query", () => {
    expect(filterShops(shops, { query: "retail" })).toHaveLength(1);
    expect(filterShops(shops, { query: "SHOP_F" })).toHaveLength(2);
  });

  it("filters by categoryId", () => {
    expect(filterShops(shops, { categoryId: "retail" })).toHaveLength(1);
    expect(filterShops(shops, { categoryId: "entertainment" })).toHaveLength(1);
  });

  it("filters by statusId", () => {
    expect(filterShops(shops, { statusId: "available" })).toHaveLength(2);
    expect(filterShops(shops, { statusId: "leased" })).toHaveLength(1);
  });

  it("filters by floorId", () => {
    expect(filterShops(shops, { floorId: "G" })).toHaveLength(1);
    expect(filterShops(shops, { floorId: "F1" })).toHaveLength(1);
  });

  it("combines filters with AND semantics", () => {
    expect(
      filterShops(shops, { categoryId: "retail", statusId: "available" })
    ).toHaveLength(1);
    expect(
      filterShops(shops, { categoryId: "retail", statusId: "leased" })
    ).toHaveLength(0);
  });

  it("preserves original order", () => {
    const filtered = filterShops(shops, { statusId: "available" });
    expect(filtered[0].shopId).toBe("SHOP_G_001");
    expect(filtered[1].shopId).toBe("SHOP_F1_002");
  });
});

describe("matchesShopObjectName", () => {
  it("returns true for canonical shop names", () => {
    expect(matchesShopObjectName("SHOP_G_001")).toBe(true);
    expect(matchesShopObjectName("SHOP_F1_007")).toBe(true);
    expect(matchesShopObjectName("shop_b1_123")).toBe(true);
    expect(matchesShopObjectName("SHOP_B2_999")).toBe(true);
  });

  it("returns false for non-shop and malformed names", () => {
    expect(matchesShopObjectName("SHOP_G_1")).toBe(false);
    expect(matchesShopObjectName("SHOP_F1")).toBe(false);
    expect(matchesShopObjectName("MALL_G_STRUCT")).toBe(false);
    expect(matchesShopObjectName("COMMON_G_ATRIUM")).toBe(false);
    expect(matchesShopObjectName("SITE_GROUND")).toBe(false);
    expect(matchesShopObjectName("Cube")).toBe(false);
    expect(matchesShopObjectName("SHOP_G__001")).toBe(false);
    expect(matchesShopObjectName("")).toBe(false);
  });
});

describe("shopFilterSchema", () => {
  it("validates ShopFilter type shape", () => {
    const valid: ShopFilter = {
      query: "test",
      categoryId: "retail",
      statusId: "available",
      floorId: "G",
    };
    expect(shopFilterSchema.parse(valid)).toEqual(valid);
  });
});