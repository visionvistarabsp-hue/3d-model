"use client";

/**
 * Demo palette pass over the loaded mall scene. Pure presentation: it clones
 * each shop-shell material and tints it with a lively storefront color so the
 * demo mall reads as alive. It never mutates the mesh<->shopId mapping and
 * never touches business data (see AGENTS rules 1-3).
 *
 * Only the canonical shell nodes (SHOP_<FLOOR>_<SEQ>) are recolored; part
 * nodes (_GLASS / _DOOR / _SIGN) and all structure stay neutral, so shared
 * materials like MAT_WALL are never recolored for non-shop objects.
 */
import { useEffect } from "react";
import * as THREE from "three";
import { parseShopObjectName } from "@/lib/select/shop-id";

const SHELL_PALETTE = [
  "#E85D4A", // coral
  "#3B82A0", // steel blue
  "#E8A33D", // amber
  "#6A4C93", // aubergine
  "#4FA880", // sage green
  "#D95D8A", // rose
  "#4F7ABF", // periwinkle
  "#C97B3D", // burnt sienna
];

/** Neighbours (same row/column) never share a colour: step by 5 mod 8. */
function shellColorFor(sequence: number): THREE.Color {
  const idx = ((sequence - 1) * 5) % SHELL_PALETTE.length;
  return new THREE.Color(SHELL_PALETTE[idx]);
}

const COLORED_MATERIALS = [
  THREE.MeshStandardMaterial,
  THREE.MeshBasicMaterial,
  THREE.MeshLambertMaterial,
  THREE.MeshPhongMaterial,
];

export function MallPalette({ scene }: { scene: THREE.Group | null }) {
  useEffect(() => {
    if (!scene) return;

    scene.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      const parsed = parseShopObjectName(obj.name);
      if (!parsed) return;

      const color = shellColorFor(parsed.sequence);
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      const colored = mats.map((m) => {
        const colorable = COLORED_MATERIALS.some((C) => m instanceof C);
        if (!colorable) return m;
        const clone = m.clone();
        clone.color.copy(color);
        return clone;
      });

      obj.material = Array.isArray(obj.material) ? colored : colored[0];
    });
  }, [scene]);

  return null;
}