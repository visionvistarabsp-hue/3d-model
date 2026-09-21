"use client";

/**
 * Full-viewport loading veil shown while the GLB / placeholder is async.
 * Pure styling; no scene logic.
 */
export function LoadingScreen() {
  return (
    <group>
      <color attach="background" args={["#0b0d12"]} />
      <mesh position={[0, 4, 0]}>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="#23262f" wireframe />
      </mesh>
    </group>
  );
}