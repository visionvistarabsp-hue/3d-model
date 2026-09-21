import { describe, expect, it } from "vitest";
import {
  shopSchema,
  floorSchema,
  modelMetadataSchema,
  parseShops
} from "@/lib/validation/schemas";
import { DEMO_SHOPS } from "@/data/demo/shops";
import { demoFloors } from "@/data/demo/floors";
import { DEMO_MODEL_MANIFEST } from "@/data/demo/model";
import type { Shop } from "@/types";

const validShop: Shop = {
  id: "SHOP_G_001",
  shopNumber: "G-001",
  floorId: "G",
  name: "Demo Retail 1",
  status: "available",
  category: "retail",
  areaSqM: 48,
  frontageM: 6,
  depthM: 8,
  price: { currency: "INR", sale: 8_600_000, leaseRateSqm: 80_000 },
  modelObjectName: "SHOP_G_001",
  images: [],
  media: [],
  isDemo: true,
  demoNotice: "demo",
  updatedAt: "2026-01-01T00:00:00.000Z"
};

describe("shopSchema", () => {
  it("accepts a valid shop", () => {
    expect(shopSchema.safeParse(validShop).success).toBe(true);
  });

  it("rejects a non-contractual shop id", () => {
    const bad = { ...validShop, id: "SHOP_X" }; // missing _NNN
    expect(shopSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects negative areas", () => {
    expect(shopSchema.safeParse({ ...validShop, areaSqM: -1 }).success).toBe(false);
  });

  it("rejects a 2-char currency", () => {
    expect(
      shopSchema.safeParse({
        ...validShop,
        price: { currency: "IN", sale: 1 }
      }).success
    ).toBe(false);
  });
});

describe("demo data integrity", () => {
  it("all demo shops validate and use unique contractual ids", () => {
    const parsed = parseShops(DEMO_SHOPS);
    expect(parsed.length).toBeGreaterThan(0);
    expect(parsed.every((s) => s.isDemo === true)).toBe(true);
    const ids = parsed.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every demo shop references an existing floor", () => {
    const floorIds = new Set(demoFloors().map((f) => f.id));
    for (const shop of DEMO_SHOPS) {
      expect(floorIds.has(shop.floorId)).toBe(true);
    }
  });

  it("demo floors validate", () => {
    for (const floor of demoFloors()) {
      expect(floorSchema.safeParse(floor).success).toBe(true);
    }
  });

  it("demo model manifest validates (placeholder timestamps allowed until export)", () => {
    const m = modelMetadataSchema.safeParse(DEMO_MODEL_MANIFEST);
    expect(m.success).toBe(true);
  });
});