"use client";

/**
 * The full-screen 3D viewport. Holds lighting, camera, controls and the
 * scene graph. It is intentionally business-logic-free: raycast hits are
 * shipped to the store as shop ids only.
 */
import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { SceneContent } from "./scene-content";
import { LoadingScreen } from "./loading-screen";
import { ModelErrorBoundary } from "./model-error-boundary";
import { selectActiveFloorId, useMallStore } from "@/store/use-mall-store";
import { runtimeQuality } from "@/lib/performance/quality";

// Runtime capability: high devices keep the cinematic pipeline (dpr up to 1.5,
// crisp 2048 shadow maps, post-processing). Weak / mobile drops to the light
// profile: dpr 1, 1024 shadow maps and no composer (see scene-content).
const shadowMapSize = runtimeQuality === "low" ? 1024 : 2048;

// Dev helper — opt-in via NEXT_PUBLIC_SHOW_AXES="1" so shipped builds stay clean.
const showAxes = process.env.NEXT_PUBLIC_SHOW_AXES === "1";

export function MallViewer() {
  return (
    <div className="absolute inset-0">
      <Canvas
        dpr={runtimeQuality === "low" ? [1, 1] : [1, 1.5]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        shadows
      >
        <color attach="background" args={["#0a0c11"]} />
        <fog attach="fog" args={["#0a0c11", 60, 160]} />

        <ambientLight intensity={0.45} />
        <hemisphereLight args={["#cfe8ff", "#2a2f3a", 0.5]} />
        <directionalLight
          position={[40, 60, 30]}
          intensity={1.4}
          castShadow
          shadow-mapSize-width={shadowMapSize}
          shadow-mapSize-height={shadowMapSize}
        />

        <AdaptiveCamera />

        <Suspense fallback={<LoadingScreen />}>
          <ModelErrorBoundary>
            <SceneContent />
          </ModelErrorBoundary>
        </Suspense>

        {showAxes && <axesHelper args={[4]} />}
      </Canvas>
    </div>
  );
}

const FLOOR_CAMERA: [number, number, number] = [18, 15, 20];
const FLOOR_TARGET: [number, number, number] = [0, 1.2, 0];

function AdaptiveCamera() {
  const activeFloorId = useMallStore(selectActiveFloorId);
  const allFloors = activeFloorId === null;
  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={allFloors ? DEFAULT_CAMERA : FLOOR_CAMERA}
        fov={45}
      />
      <OrbitControls
        makeDefault
        target={allFloors ? [0, 4, 0] : FLOOR_TARGET}
        minDistance={8}
        maxDistance={140}
        maxPolarAngle={Math.PI / 2.05}
        enableDamping
      />
    </>
  );
}

// Re-export so tests / docs reference one camera origin.
export const DEFAULT_CAMERA: [number, number, number] = [38, 34, 42];