"use client";

/**
 * Procedural placeholder mall — used until the Phase 2 GLB export exists.
 *
 * Builds one box per shop from the SAME demo data (id, floor, category), each
 * carrying `userData.shopId` and a colour by status. Clicking a shop routes to
 * the same zustand store selection, so selection wiring can be tested WITHOUT
 * the Blender asset. Deletion point: end of PHASE 3 (real GLB owns geometry).
 */
import { useMemo } from "react";
import { useMallStore } from "@/store/use-mall-store";
import { DEMO_SHOPS } from "@/data/demo/shops";
import { demoFloors } from "@/data/demo/floors";
import { SHOP_COLORS } from "@/lib/theme/shop-colors";
import type { ShopStatus } from "@/types";

const FLOOR_HEIGHT = 4.2;
const BAY_X = 10; // shop bay width span (demo)
const BAY_Z = 8; // shop bay depth span (demo)
const GAP = 1.2;

export function PlaceholderMall() {
  const selectedShopId = useMallStore((s) => s.selectedShopId);

  // Deterministic layout from demo records (no randomness).
  const units = useMemo(() => {
    const shopsByFloor = new Map<string, typeof DEMO_SHOPS>();
    for (const shop of DEMO_SHOPS) {
      const arr = shopsByFloor.get(shop.floorId) ?? [];
      arr.push(shop);
      shopsByFloor.set(shop.floorId, arr);
    }

    const cells: Array<{
      id: string;
      status: ShopStatus;
      position: [number, number, number];
      size: [number, number, number];
    }> = [];

    for (const floor of demoFloors()) {
      const shops = shopsByFloor.get(floor.id) ?? [];
      shops.forEach((shop, col) => {
        cells.push({
          id: shop.id,
          status: shop.status,
          position: [
            -6 + col * (BAY_X + GAP),
            floor.baseElevationM + FLOOR_HEIGHT / 2,
            -4
          ],
          size: [BAY_X, FLOOR_HEIGHT, BAY_Z]
        });
      });
    }
    return cells;
  }, []);

  return (
    <group>
      {/* floor slabs */}
      {demoFloors().map((f) => (
        <mesh key={`slab:${f.id}`} position={[0, f.baseElevationM, 0]} receiveShadow>
          <boxGeometry args={[72, 0.3, 48]} />
          <meshStandardMaterial color="#23262f" roughness={0.9} />
        </mesh>
      ))}

      {units.map((u) => (
        <mesh
          key={u.id}
          position={u.position}
          castShadow
          receiveShadow
          userData={{ shopId: u.id }}
        >
          <boxGeometry args={u.size} />
          <meshStandardMaterial
            color={u.id === selectedShopId ? "#ffd54a" : SHOP_COLORS[u.status]}
            roughness={0.55}
            metalness={0.05}
          />
        </mesh>
      ))}
    </group>
  );
}