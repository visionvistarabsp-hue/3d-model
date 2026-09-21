/**
 * ShopRepository — the ONLY way the UI/viewer reads shop and floor data.
 *
 * The 3D selection system works offline of this interface:
 *  - raycast click -> mesh `userData.shopId` (stable object name)
 *  - ShopRepository.getShopById(shopId) -> full commercial record
 *
 * Today: MockShopRepository (typed demo data, marked isDemo=true).
 * Tomorrow: ApiShopRepository talking to /api/shops backed by Neon/PostgreSQL.
 * Swap via env `NEXT_PUBLIC_DATA_SOURCE`.
 */
import type { Shop, Floor, Building } from "@/types";
import { parseShops, parseFloors } from "@/lib/validation/schemas";

export interface ShopQuery {
  floorId?: string;
  status?: Shop["status"];
  category?: Shop["category"];
  search?: string;
}

export interface ShopRepository {
  dataSource: "mock" | "api";
  getBuilding(): Promise<Building>;
  getFloors(): Promise<Floor[]>;
  getShops(): Promise<Shop[]>;
  getShopById(id: string): Promise<Shop | null>;
  searchShops(query: ShopQuery): Promise<Shop[]>;
}

const normalize = (s: string) =>
  s.trim().toLowerCase().replace(/[^a-z0-9]/g, "");

export class MockShopRepository implements ShopRepository {
  readonly dataSource = "mock" as const;

  constructor(private shops: Shop[], private building: Building) {}

  async getBuilding(): Promise<Building> {
    return this.building;
  }

  async getFloors(): Promise<Floor[]> {
    return parseFloors(this.building.floors);
  }

  async getShops(): Promise<Shop[]> {
    return parseShops(this.shops);
  }

  async getShopById(id: string): Promise<Shop | null> {
    const found = this.shops.find((s) => s.id === id);
    return found ? parseShopJson(found) : null;
  }

  async searchShops(query: ShopQuery): Promise<Shop[]> {
    const q = normalize(query.search ?? "");
    return this.shops
      .filter((s) => (query.floorId ? s.floorId === query.floorId : true))
      .filter((s) => (query.status ? s.status === query.status : true))
      .filter((s) => (query.category ? s.category === query.category : true))
      .filter((s) =>
        q
          ? [s.id, s.shopNumber, s.name, s.category].some((f) =>
              normalize(f).includes(q)
            )
          : true
      );
  }
}

function parseShopJson(raw: Shop): Shop {
  // Re-validate the single record through the schema.
  return parseShops([raw])[0];
}

/** Loads values straight from typed demo modules (no fetch in mock mode). */
export async function createMockRepository(): Promise<ShopRepository> {
  const [{ DEMO_SHOPS }, { DEMO_BUILDING }] = await Promise.all([
    import("@/data/demo/shops"),
    import("@/data/demo/floors")
  ]);
  return new MockShopRepository(DEMO_SHOPS, DEMO_BUILDING);
}