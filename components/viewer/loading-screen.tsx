"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * In-canvas Suspense fallback shown while the GLB is still loading.
 * A slowly rotating wireframe "shell" with a cyan kicker — pure styling,
 * no scene logic.
 */
export function LoadingScreen() {
  const shell = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (shell.current) {
      shell.current.rotation.y += delta * 0.45;
      shell.current.position.y = 4 + Math.sin(performance.now() * 0.001) * 0.3;
    }
  });

  return (
    <group>
      <color attach="background" args={["#0a0c11"]} />
      <group ref={shell} position={[0, 4, 0]}>
        <mesh>
          <boxGeometry args={[1.8, 2.4, 1.8]} />
          <meshStandardMaterial color="#141824" wireframe emissive="#22d3ee" emissiveIntensity={0.55} />
        </mesh>
        <pointLight position={[0, 0, 3]} intensity={1.6} color="#22d3ee" decay={0} />
      </group>
    </group>
  );
}