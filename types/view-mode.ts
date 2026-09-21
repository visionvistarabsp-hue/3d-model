/**
 * Visualization modes and the effect system.
 *
 * Effects are declarative, reusable configuration objects — NOT hardcoded
 * shaders in components. A view mode selects which effects are enabled and
 * with what intensity. The renderer converts them into materials,
 * postprocessing passes and shader parameters. This keeps effects swappable
 * (e.g. a weaker-device fallback) without touching scene components.
 */

export type ViewMode = "realistic" | "hologram" | "xray";

export type DeviceTier = "high" | "medium" | "low";

export type SelectionBehavior = "dim_others" | "isolate" | "none";

export interface EffectConfig {
  /** Global opacity (0..1) applied to non-selected geometry. */
  surroundingOpacity: number;
  /** Emissive tint applied to the "active" layer (shops / structure). */
  emissive: { r: number; g: number; b: number; intensity: number };
  /** Wireframe/edge emphasis 0..1. */
  edges: number;
  /** Scan-line animation speed; 0 disables. */
  scanlineSpeed: number;
  /** Grid/scan overlay opacity. */
  overlayOpacity: number;
  /** Depth-write behavior for transparent materials. */
  translucent: boolean;
}

export interface ViewModeDefinition {
  id: ViewMode;
  label: string;
  /** Shop mesh material behavior. */
  effects: EffectConfig;
  /** Post-processing passes enabled for this mode. */
  postprocess: {
    bloom: boolean;
    bloomIntensity: number;
    scanlines: boolean;
  };
  /** What happens to non-selected geometry when a shop is selected. */
  selection: SelectionBehavior;
}

export const VIEW_MODES: Record<ViewMode, ViewModeDefinition> = {
  realistic: {
    id: "realistic",
    label: "Realistic",
    effects: {
      surroundingOpacity: 1,
      emissive: { r: 0, g: 0, b: 0, intensity: 0 },
      edges: 0,
      scanlineSpeed: 0,
      overlayOpacity: 0,
      translucent: false
    },
    postprocess: { bloom: false, bloomIntensity: 0, scanlines: false },
    selection: "none"
  },
  hologram: {
    id: "hologram",
    label: "Hologram",
    effects: {
      surroundingOpacity: 1,
      emissive: { r: 0.15, g: 0.95, b: 1, intensity: 1.1 },
      edges: 0.85,
      scanlineSpeed: 0.6,
      overlayOpacity: 0.12,
      translucent: false
    },
    postprocess: { bloom: true, bloomIntensity: 0.85, scanlines: true },
    selection: "dim_others"
  },
  xray: {
    id: "xray",
    label: "X-Ray",
    effects: {
      surroundingOpacity: 0.22,
      emissive: { r: 0.2, g: 0.6, b: 1, intensity: 0.25 },
      edges: 0.6,
      scanlineSpeed: 0,
      overlayOpacity: 0,
      translucent: true
    },
    postprocess: { bloom: false, bloomIntensity: 0, scanlines: false },
    selection: "isolate"
  }
};

/**
 * Capability profile of the current device, used to scale effects down
 * (weaker GPUs drop bloom, edge lines and transparency passes).
 */
export interface DeviceProfile {
  tier: DeviceTier;
  /** WebGL2 available. */
  webgl2: boolean;
  powerPreference: string;
  /** Rough heuristic based on devicePixelRatio & hardwareConcurrency. */
  maxPixelRatio: number;
}