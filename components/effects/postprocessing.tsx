"use client";

import { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { EffectComposer, RenderPass, UnrealBloomPass, ShaderPass } from "three-stdlib";
import { useMallStore } from "@/store/use-mall-store";
import { VIEW_MODES } from "@/types/view-mode";
import * as THREE from "three";

const ScanlineShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
    intensity: { value: 0.12 },
    speed: { value: 0.6 },
    count: { value: 800 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float time;
    uniform float intensity;
    uniform float speed;
    uniform float count;
    varying vec2 vUv;

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      float scanline = sin(vUv.y * count + time * speed) * intensity;
      color.rgb += scanline * color.rgb * 0.3;
      color.rgb += vec3(0.0, 0.02, 0.04) * intensity * 0.5;
      gl_FragColor = color;
    }
  `,
};

export function PostProcessing() {
  const viewMode = useMallStore((s) => s.viewMode);
  const { gl, scene, camera, size } = useThree();
  const composerRef = useRef<EffectComposer | null>(null);
  const bloomPassRef = useRef<UnrealBloomPass | null>(null);
  const scanlinePassRef = useRef<ShaderPass | null>(null);
  const timeRef = useRef(0);

  useEffect(() => {
    const composer = new EffectComposer(gl);
    composer.addPass(new RenderPass(scene, camera));

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(size.width, size.height),
      0.85,
      0.4,
      0.85
    );
    bloomPass.enabled = false;
    composer.addPass(bloomPass);
    bloomPassRef.current = bloomPass;

    const scanlinePass = new ShaderPass(ScanlineShader);
    scanlinePass.enabled = false;
    composer.addPass(scanlinePass);
    scanlinePassRef.current = scanlinePass;

    composerRef.current = composer;

    return () => {
      composer.dispose();
      bloomPass.dispose();
      scanlinePass.dispose();
    };
  }, [gl, scene, camera, size]);

  useEffect(() => {
    const mode = VIEW_MODES[viewMode];
    if (bloomPassRef.current) {
      bloomPassRef.current.enabled = mode.postprocess.bloom;
      bloomPassRef.current.strength = mode.postprocess.bloomIntensity;
    }
    if (scanlinePassRef.current) {
      scanlinePassRef.current.enabled = mode.postprocess.scanlines;
      scanlinePassRef.current.uniforms.intensity.value = mode.effects.overlayOpacity;
      scanlinePassRef.current.uniforms.speed.value = mode.effects.scanlineSpeed;
    }
  }, [viewMode]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (scanlinePassRef.current) {
      scanlinePassRef.current.uniforms.time.value = timeRef.current;
    }
    if (composerRef.current) {
      composerRef.current.render(delta);
    }
  });

  return null;
}