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

export function MallViewer() {
  return (
    <div className="absolute inset-0">
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        shadows
      >
        <color attach="background" args={["#0b0d12"]} />
        <fog attach="fog" args={["#0b0d12", 60, 160]} />

        <ambientLight intensity={0.45} />
        <hemisphereLight args={["#cfe8ff", "#2a2f3a", 0.5]} />
        <directionalLight
          position={[40, 60, 30]}
          intensity={1.4}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        <PerspectiveCamera makeDefault position={[38, 34, 42]} fov={45} />
        <OrbitControls
          makeDefault
          target={[0, 4, 0]}
          minDistance={8}
          maxDistance={140}
          maxPolarAngle={Math.PI / 2.05}
          enableDamping
        />

        <Suspense fallback={<LoadingScreen />}>
          <ModelErrorBoundary>
            <SceneContent />
          </ModelErrorBoundary>
        </Suspense>

        <axesHelper args={[4]} />
      </Canvas>
    </div>
  );
}

// Re-export so tests / docs reference one camera origin.
export const DEFAULT_CAMERA: [number, number, number] = [38, 34, 42];