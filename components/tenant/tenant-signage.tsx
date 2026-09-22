"use client";

import { useEffect } from "react";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";
import { storage } from "@/lib/storage/storage-client";
import type { ShopMediaAsset } from "@/types";

interface TenantSignageProps {
  position: THREE.Vector3;
  rotation?: THREE.Euler;
  scale?: number;
  media: ShopMediaAsset[];
}

const DEFAULT_LOGO_KEY = "brands/placeholder-logo.png";

export function TenantSignage({ position, rotation, scale = 1, media }: TenantSignageProps) {
  const logoAsset = media.find((m) => m.kind === "image" && m.label?.toLowerCase().includes("logo"));
  const signageTexture = storage.resolve(logoAsset ? logoAsset.key : DEFAULT_LOGO_KEY);

  const texture = useTexture(signageTexture);

  useEffect(() => {
    if (texture) {
      texture.colorSpace = THREE.SRGBColorSpace;
    }
  }, [texture]);

  if (!signageTexture || !texture) return null;

  return (
    <mesh position={position} rotation={rotation?.toArray() ?? [0, 0, 0]} scale={scale}>
      <planeGeometry args={[3, 1.5]} />
      <meshBasicMaterial
        map={texture}
        transparent
        alphaTest={0.1}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

export function FloorPlanOverlay({ imageKey, position, rotation, scale = 1 }: {
  imageKey: string;
  position: THREE.Vector3;
  rotation?: THREE.Euler;
  scale?: number;
}) {
  const url = storage.resolve(imageKey);
  const texture = useTexture(url);

  useEffect(() => {
    if (texture) {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
    }
  }, [texture]);

  if (!texture) return null;

  return (
    <mesh position={position} rotation={rotation?.toArray() ?? [-Math.PI / 2, 0, 0]} scale={scale}>
      <planeGeometry args={[10, 10, 1, 1]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={0.85}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}