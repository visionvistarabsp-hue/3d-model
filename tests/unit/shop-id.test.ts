import { describe, expect, it } from "vitest";
import {
  parseShopObjectName,
  shopObjectName,
  shopIdFromUserData,
  isStructureObjectName
} from "@/lib/select/shop-id";

describe("parseShopObjectName", () => {
  it("parses canonical shop object names", () => {
    expect(parseShopObjectName("SHOP_G_001")).toEqual({
      shopId: "SHOP_G_001",
      floorId: "G",
      sequence: 1
    });
    expect(parseShopObjectName("SHOP_F1_007")).toEqual({
      shopId: "SHOP_F1_007",
      floorId: "F1",
      sequence: 7
    });
    expect(parseShopObjectName("shop_b1_123")).toEqual({
      shopId: "SHOP_B1_123",
      floorId: "B1",
      sequence: 123
    });
  });

  it("returns null for non-shop and malformed names (never throws)", () => {
    for (const bad of [
      "SHOP_G_1", // seq must be ≥3 digits
      "SHOP_F1", // no seq
      "MALL_G_STRUCT",
      "COMMON_G_ATRIUM",
      "SITE_GROUND",
      "Cube",
      "SHOP_G__001",
      ""
    ]) {
      expect(parseShopObjectName(bad), `expected null for ${bad}`).toBeNull();
    }
  });
});

describe("shopObjectName", () => {
  it("builds canonical names", () => {
    expect(shopObjectName("g", 1)).toBe("SHOP_G_001");
    expect(shopObjectName("F1", 42)).toBe("SHOP_F1_042");
  });
});

describe("shopIdFromUserData", () => {
  it("reads the stable identity off a mesh", () => {
    expect(shopIdFromUserData({ shopId: "SHOP_G_001" })).toBe("SHOP_G_001");
    expect(shopIdFromUserData({ shopId: 42 })).toBeNull();
    expect(shopIdFromUserData(undefined)).toBeNull();
  });
});

describe("isStructureObjectName", () => {
  it("detects structure/site objects", () => {
    expect(isStructureObjectName("MALL_G_STRUCT")).toBe(true);
    expect(isStructureObjectName("COMMON_F2_ATRIUM")).toBe(true);
    expect(isStructureObjectName("SITE_GROUND")).toBe(true);
    expect(isStructureObjectName("SHOP_G_001")).toBe(false);
  });
});