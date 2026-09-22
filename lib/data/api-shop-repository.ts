/**
 * ApiShopRepository — Supabase/PostgreSQL implementation of ShopRepository.
 * Used when NEXT_PUBLIC_DATA_SOURCE=api
 */
import type { Shop, Floor, Building } from "@/types";
import { parseShops, parseFloors } from "@/lib/validation/schemas";
import type { ShopRepository, ShopQuery } from "./shop-repository";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  return res.json();
}

export class ApiShopRepository implements ShopRepository {
  readonly dataSource = "api" as const;

  async getBuilding(): Promise<Building> {
    // Fetch floors and count shops
    const [floorsRes, shopsRes] = await Promise.all([
      fetchJson<{ floors: Floor[] }>(`${API_BASE}/floors`),
      fetchJson<{ shops: Shop[] }>(`${API_BASE}/shops`),
    ]);

    return {
      id: "MALL_DEMO_001",
      name: "Demo Mall (API)",
      floors: floorsRes.floors,
      shopCount: shopsRes.shops.length,
    };
  }

  async getFloors(): Promise<Floor[]> {
    const res = await fetchJson<{ floors: Floor[] }>(`${API_BASE}/floors`);
    return parseFloors(res.floors);
  }

  async getShops(): Promise<Shop[]> {
    const res = await fetchJson<{ shops: Shop[] }>(`${API_BASE}/shops`);
    return parseShops(res.shops);
  }

  async getShopById(id: string): Promise<Shop | null> {
    try {
      const shop = await fetchJson<Shop>(`${API_BASE}/shops/${id}`);
      return parseShops([shop])[0];
    } catch (e) {
      if (e instanceof Error && e.message.includes("404")) return null;
      throw e;
    }
  }

  async searchShops(query: ShopQuery): Promise<Shop[]> {
    const params = new URLSearchParams();
    if (query.floorId) params.set("floorId", query.floorId);
    if (query.status) params.set("status", query.status);
    if (query.category) params.set("category", query.category);
    if (query.search) params.set("search", query.search);
    params.set("limit", "500");

    const res = await fetchJson<{ shops: Shop[] }>(`${API_BASE}/shops?${params.toString()}`);
    return parseShops(res.shops);
  }
}