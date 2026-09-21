/**
 * Repository factory — the single place that decides which data source the
 * app uses. Frontend code always goes through ShopRepository; only THIS file
 * knows about implementation details (mock in dev, API later).
 */
import type { ShopRepository } from "@/lib/data/shop-repository";
import { createMockRepository } from "@/lib/data/shop-repository";

let cached: ShopRepository | null = null;

export async function getRepository(): Promise<ShopRepository> {
  const source = process.env.NEXT_PUBLIC_DATA_SOURCE?.trim().toLowerCase() ?? "mock";
  switch (source) {
    case "mock":
      cached ??= await createMockRepository();
      return cached;
    case "api":
      // THROWS clearly until an ApiShopRepository is implemented (PHASE 6).
      throw new Error(
        "NEXT_PUBLIC_DATA_SOURCE=api is not implemented yet. Use 'mock'."
      );
    default:
      throw new Error(`Unknown data source: ${source}`);
  }
}