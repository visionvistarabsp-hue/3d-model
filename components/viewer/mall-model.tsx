"use client";

/**
 * Loads the demo GLB via three's GLTFLoader (drei useGLTF). Each selectable
 * shop mesh must carry `userData.shopId` — set at export time by the Blender
 * pipeline, verified here on load (see verifyShopObjectNames).
 *
 * TODO(PHASE 2): this path becomes active once the demo GLB export exists.
 */
import { useEffect } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import type { LoadableModel } from "@/lib/model/model-loader";
import { parseShopObjectName } from "@/lib/select/shop-id";

export function MallModel({ manifest }: { manifest: LoadableModel }) {
  const { scene } = useGLTF(manifest.url);

  useEffect(() => {
    verifyShopObjectNames(scene, manifest.metadata.objectNaming);
  }, [scene, manifest]);

  return (
    <group>
      <primitive object={scene} scale={1} />
    </group>
  );
}

function verifyShopObjectNames(root: THREE.Object3D, naming: string) {
  const names: string[] = [];
  root.traverse((o) => {
    if (o.userData?.shopId !== undefined) names.push(o.userData.shopId as string);
  });

  if (names.length === 0) {
    console.warn(
      `[viewer] GLB has no userData.shopId. Expected naming: ${naming}. ` +
        "Selection will rely on parseShopObjectName only."
    );
    return;
  }
  for (const n of names) {
    if (!parseShopObjectName(n)) {
      console.warn(`[viewer] Unexpected shop object name in GLB: ${n}`);
    }
  }
}