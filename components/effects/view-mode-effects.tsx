"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useMallStore } from "@/store/use-mall-store";
import { shopIdFromObject } from "@/lib/select/shop-id";
import { VIEW_MODES, type EffectConfig } from "@/types/view-mode";

interface ViewModeEffectsProps {
  scene: THREE.Group | null;
  selectedShopId: string | null;
}

function createHologramMaterial(baseMaterial: THREE.Material, config: EffectConfig): THREE.Material {
  const mat = baseMaterial.clone();
  if (mat instanceof THREE.MeshStandardMaterial) {
    mat.emissive.setRGB(config.emissive.r, config.emissive.g, config.emissive.b);
    mat.emissiveIntensity = config.emissive.intensity;
    mat.transparent = config.translucent;
    mat.opacity = config.surroundingOpacity;
    mat.depthWrite = !config.translucent;
  }
  return mat;
}

function createXRayMaterial(baseMaterial: THREE.Material, config: EffectConfig, isSelected: boolean): THREE.Material {
  const mat = baseMaterial.clone();
  if (mat instanceof THREE.MeshStandardMaterial) {
    mat.transparent = true;
    mat.opacity = isSelected ? 1 : config.surroundingOpacity;
    mat.emissive.setRGB(config.emissive.r, config.emissive.g, config.emissive.b);
    mat.emissiveIntensity = isSelected ? config.emissive.intensity * 2 : config.emissive.intensity;
    mat.depthWrite = false;
    mat.side = THREE.DoubleSide;
  }
  return mat;
}

function createRealisticMaterial(baseMaterial: THREE.Material): THREE.Material {
  const mat = baseMaterial.clone();
  if (mat instanceof THREE.MeshStandardMaterial) {
    mat.emissive.setRGB(0, 0, 0);
    mat.emissiveIntensity = 0;
    mat.transparent = false;
    mat.opacity = 1;
    mat.depthWrite = true;
    mat.side = THREE.FrontSide;
  }
  return mat;
}

function isMeshStandardMaterial(mat: THREE.Material): mat is THREE.MeshStandardMaterial {
  return mat instanceof THREE.MeshStandardMaterial;
}

export function ViewModeEffects({ scene, selectedShopId }: ViewModeEffectsProps) {
  const viewMode = useMallStore((s) => s.viewMode);
  const config = useMemo(() => VIEW_MODES[viewMode].effects, [viewMode]);
  const selectionBehavior = VIEW_MODES[viewMode].selection;

  useEffect(() => {
    if (!scene) return;

    const materials = new Map<THREE.Material, THREE.Material>();

    scene.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      if (!obj.material) return;

      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];

      mats.forEach((originalMat) => {
        let newMat: THREE.Material;

        const shopId = shopIdFromObject(obj);
        const isShop = !!shopId;
        const isSelected = isShop && selectedShopId === shopId;

        if (viewMode === "realistic") {
          newMat = createRealisticMaterial(originalMat);
        } else if (viewMode === "hologram") {
          newMat = createHologramMaterial(originalMat, config);
          if (isSelected && selectionBehavior === "dim_others" && isMeshStandardMaterial(newMat)) {
            newMat.emissiveIntensity *= 1.5;
            newMat.opacity = 1;
          } else if (!isSelected && selectionBehavior === "dim_others") {
            newMat.opacity = config.surroundingOpacity * 0.3;
          }
        } else if (viewMode === "xray") {
          newMat = createXRayMaterial(originalMat, config, isSelected);
          if (!isSelected && selectionBehavior === "isolate") {
            newMat.opacity = config.surroundingOpacity * 0.1;
          }
        } else {
          newMat = originalMat;
        }

        materials.set(originalMat, newMat);

        if (Array.isArray(obj.material)) {
          obj.material = mats.map((_, i) => materials.get(mats[i]) ?? mats[i]);
        } else {
          obj.material = newMat;
        }
      });
    });

    return () => {
      scene.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh)) return;
        if (!obj.material) return;

        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((mat, i) => {
          const original = Array.from(materials.entries()).find(([, v]) => v === mat)?.[0];
          if (original) {
            if (Array.isArray(obj.material)) {
              obj.material[i] = original;
            } else {
              obj.material = original;
            }
          }
        });
      });
      materials.forEach((_, original) => original.dispose());
    };
  }, [scene, viewMode, selectedShopId, config, selectionBehavior]);

  return null;
}