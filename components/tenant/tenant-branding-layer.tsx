"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";
import { useMallStore } from "@/store/use-mall-store";
import { getRepository } from "@/lib/data/get-repository";
import { storage } from "@/lib/storage/storage-client";

interface TenantBrandingLayerProps {
  scene: THREE.Group | null;
}

const DEFAULT_LOGO_KEY = "brands/placeholder-logo.png";

export function TenantBrandingLayer({ scene }: TenantBrandingLayerProps) {
  const shops = useMallStore((s) => s.shops);
  const [brandingData, setBrandingData] = useState<Map<string, { logoUrl: string; position: THREE.Vector3; rotation: THREE.Euler }>>(new Map());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!shops || loaded) return;
    let alive = true;

    async function loadBranding() {
      try {
        const repo = await getRepository();
        const allShops = await repo.getShops();
        const data = new Map<string, { logoUrl: string; position: THREE.Vector3; rotation: THREE.Euler }>();

        for (const shop of allShops) {
          const logoAsset = shop.media.find(m => m.kind === "image" && m.label?.toLowerCase().includes("logo"));
          const logoUrl = storage.resolve(logoAsset ? logoAsset.key : DEFAULT_LOGO_KEY);

          const parsed = shop.id.match(/^SHOP_([A-Z0-9]+)_(\d{3,})$/i);
          if (parsed) {
            const seq = parseInt(parsed[2], 10);
            const x = -6 + (seq - 1) * 11.2;
            const y = shop.floorId === "G" ? 2.1 : shop.floorId === "F1" ? 6.3 : 10.5;
            const z = -4;

            data.set(shop.id, {
              logoUrl,
              position: new THREE.Vector3(x, y, z),
              rotation: new THREE.Euler(0, Math.PI / 2, 0),
            });
          }
        }

        if (alive) {
          setBrandingData(data);
          setLoaded(true);
        }
      } catch (e) {
        console.warn("[tenant] failed to load branding", e);
      }
    }

    loadBranding();
    return () => { alive = false; };
  }, [shops, loaded]);

  if (!scene || brandingData.size === 0) return null;

  return (
    <group name="tenant-branding">
      {Array.from(brandingData.entries()).map(([shopId, data]) => (
        <TenantBillboard key={shopId} shopId={shopId} logoUrl={data.logoUrl} position={data.position} rotation={data.rotation} />
      ))}
    </group>
  );
}

function TenantBillboard({ shopId, logoUrl, position, rotation }: {
  shopId: string;
  logoUrl: string;
  position: THREE.Vector3;
  rotation: THREE.Euler;
}) {
  const texture = useTexture(logoUrl);
  const selectedShopId = useMallStore((s) => s.selectedShopId);
  const isSelected = selectedShopId === shopId;

  useEffect(() => {
    if (texture) {
      texture.colorSpace = THREE.SRGBColorSpace;
    }
  }, [texture]);

  if (!texture) return null;

  return (
    <mesh
      position={position}
      rotation={rotation.toArray()}
      scale={isSelected ? 1.5 : 1}
    >
      <planeGeometry args={[4, 2]} />
      <meshBasicMaterial
        map={texture}
        transparent
        alphaTest={0.1}
        side={THREE.DoubleSide}
        opacity={isSelected ? 1 : 0.9}
      />
    </mesh>
  );
}