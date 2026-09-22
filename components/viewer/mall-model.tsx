"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import type { LoadableModel } from "@/lib/model/model-loader";
import { parseShopObjectName, shopIdFromObject } from "@/lib/select/shop-id";
import {
  selectSelectedShopId,
  selectActiveFloorId,
  useMallStore,
} from "@/store/use-mall-store";
import type { ThreeEvent } from "@react-three/fiber";

interface MallSceneContextValue {
  scene: THREE.Group | null;
}

const MallSceneContext = createContext<MallSceneContextValue>({ scene: null });

export function MallSceneProvider({ children, manifest }: { children: React.ReactNode; manifest: LoadableModel }) {
  const { scene } = useGLTF(manifest.url);
  const sceneRef = useRef<THREE.Group | null>(scene);

  useEffect(() => {
    sceneRef.current = scene;
  }, [scene]);

  return (
    <MallSceneContext.Provider value={{ scene: sceneRef.current }}>
      {children}
    </MallSceneContext.Provider>
  );
}

export function useMallScene() {
  return useContext(MallSceneContext);
}

export function MallModel({ manifest, children }: { manifest: LoadableModel; children?: React.ReactNode }) {
  const selectedShopId = useMallStore(selectSelectedShopId);
  const activeFloorId = useMallStore(selectActiveFloorId);
  const hoverShop = useMallStore((s) => s.hoverShop);
  const selectShop = useMallStore((s) => s.selectShop);

  const { scene } = useGLTF(manifest.url);

  useEffect(() => {
    verifyShopObjectNames(scene, manifest.metadata.objectNaming);
  }, [scene, manifest]);

  useEffect(() => {
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        const shopId = shopIdFromObject(obj);
        const floor = shopId ? parseShopObjectName(shopId)?.floorId ?? null : null;
        const shouldHide =
          activeFloorId !== null && floor !== null && floor !== activeFloorId;
        obj.visible = !shouldHide;
      }
    });
  }, [scene, activeFloorId]);

  const onPointerOver = (e: ThreeEvent<PointerEvent>) => {
    const target = shopIntersection(e);
    const id = target ? shopIdFromObject(target) : null;
    if (id) {
      hoverShop(id);
      document.body.style.cursor = "pointer";
    } else {
      hoverShop(null);
      document.body.style.cursor = "default";
    }
    e.stopPropagation();
  };

  const onPointerOut = (e: ThreeEvent<PointerEvent>) => {
    hoverShop(null);
    document.body.style.cursor = "default";
    e.stopPropagation();
  };

  const onClick = (e: ThreeEvent<PointerEvent>) => {
    const target = shopIntersection(e);
    const id = target ? shopIdFromObject(target) : null;
    selectShop(id === selectedShopId ? null : id);
    e.stopPropagation();
  };

  return (
    <MallSceneProvider manifest={manifest}>
      <group
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
        onClick={onClick}
      >
        <primitive object={scene} scale={1} />
        {children}
      </group>
    </MallSceneProvider>
  );
}

function shopIntersection(e: ThreeEvent<PointerEvent>): THREE.Mesh | null {
  for (const hit of e.intersections ?? []) {
    const obj = hit.object;
    if (obj instanceof THREE.Mesh) {
      const id = shopIdFromObject(obj);
      if (id) return obj;
    }
  }
  return null;
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