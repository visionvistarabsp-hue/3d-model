/**
 * One-time runtime device capability check for the layered-quality system.
 * Kept separate from the store because it is computed once per session and
 * never changes; scene components read it directly.
 */
import type { DeviceTier } from "@/types/view-mode";

export type RuntimeQuality = Extract<DeviceTier, "high" | "low">;

function detect(): RuntimeQuality {
  if (typeof window === "undefined") return "high";
  try {
    const nav = navigator as Navigator & { deviceMemory?: number };
    const cores = nav.hardwareConcurrency ?? 8;
    const mem = nav.deviceMemory;
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const weak = mem !== undefined && mem <= 4;
    const fewCores = cores <= 4;

    // Phones / touch-first small viewports, especially underpowered ones.
    if (coarsePointer && (window.innerWidth < 900 || weak || fewCores)) return "low";
    // Low-RAM desktops with few cores get the light profile too.
    if (weak && fewCores) return "low";
  } catch {
    return "high";
  }
  return "high";
}

export const runtimeQuality: RuntimeQuality =
  typeof window === "undefined" ? "high" : detect();