"use client";

/**
 * Catches GLB/GLTF load failures (e.g. missing file before Phase 2 export)
 * and falls back to the procedural placeholder so the app is never a black
 * screen. When the real model fails in production this is also where we'd
 * surface a proper "model unavailable" message.
 */
import { Component, type ErrorInfo, type ReactNode } from "react";
import { PlaceholderMall } from "./placeholder-mall";

export class ModelErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn("[viewer] model load failed — using procedural fallback", {
      error,
      info
    });
  }

  render() {
    if (this.state.hasError) {
      return <PlaceholderMall />;
    }
    return this.props.children;
  }
}