/**
 * Error tracking and analytics utilities.
 * Uses a simple event-based system that can be connected to Sentry, LogRocket, etc.
 */

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, string | number | boolean>;
  timestamp: number;
  sessionId: string;
  userId?: string;
}

export interface ErrorEvent {
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
  severity: "error" | "warning" | "info";
  timestamp: number;
  sessionId: string;
  userId?: string;
}

type EventHandler = (event: AnalyticsEvent | ErrorEvent) => void;

class Analytics {
  private handlers: EventHandler[] = [];
  private sessionId: string;
  private userId?: string;
  private enabled: boolean;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.enabled = typeof window !== "undefined" && process.env.NODE_ENV === "production";
  }

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  track(name: string, properties?: Record<string, string | number | boolean>) {
    if (!this.enabled) return;

    const event: AnalyticsEvent = {
      name,
      properties,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
    };

    this.handlers.forEach((h) => h(event));
    this.sendToEndpoint("/api/analytics/track", event);
  }

  trackError(message: string, error?: Error, context?: Record<string, unknown>, severity: "error" | "warning" | "info" = "error") {
    if (!this.enabled) return;

    const event: ErrorEvent = {
      message,
      stack: error?.stack,
      context,
      severity,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
    };

    this.handlers.forEach((h) => h(event));
    this.sendToEndpoint("/api/analytics/error", event);
  }

  onEvent(handler: EventHandler) {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler);
    };
  }

  private async sendToEndpoint(endpoint: string, payload: unknown) {
    try {
      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      });
    } catch {
      // Silently fail - don't break UX for analytics
    }
  }

  // Convenience methods for common events
  trackShopView(shopId: string, floorId: string) {
    this.track("shop_view", { shopId, floorId });
  }

  trackShopSelect(shopId: string, floorId: string) {
    this.track("shop_select", { shopId, floorId });
  }

  trackFloorChange(floorId: string) {
    this.track("floor_change", { floorId });
  }

  trackViewModeChange(mode: string) {
    this.track("view_mode_change", { mode });
  }

  trackSearch(query: string, resultsCount: number) {
    this.track("search", { query, resultsCount });
  }

  trackModelLoad(modelId: string, durationMs: number, success: boolean) {
    this.track("model_load", { modelId, durationMs, success });
  }

  trackErrorSimple(message: string, error?: Error, context?: Record<string, unknown>) {
    this.trackError(message, error, context, "error");
  }

  trackWarning(message: string, context?: Record<string, unknown>) {
    this.trackError(message, undefined, context, "warning");
  }
}

export const analytics = new Analytics();

// React hook for using analytics in components
import { useCallback } from "react";

export function useAnalytics() {
  const track = useCallback((name: string, properties?: Record<string, string | number | boolean>) => {
    analytics.track(name, properties);
  }, []);

  const trackError = useCallback((message: string, error?: Error, context?: Record<string, unknown>) => {
    analytics.trackError(message, error, context);
  }, []);

  const trackShopView = useCallback((shopId: string, floorId: string) => {
    analytics.trackShopView(shopId, floorId);
  }, []);

  const trackShopSelect = useCallback((shopId: string, floorId: string) => {
    analytics.trackShopSelect(shopId, floorId);
  }, []);

  const trackFloorChange = useCallback((floorId: string) => {
    analytics.trackFloorChange(floorId);
  }, []);

  const trackViewModeChange = useCallback((mode: string) => {
    analytics.trackViewModeChange(mode);
  }, []);

  const trackSearch = useCallback((query: string, resultsCount: number) => {
    analytics.trackSearch(query, resultsCount);
  }, []);

  return {
    track,
    trackError,
    trackShopView,
    trackShopSelect,
    trackFloorChange,
    trackViewModeChange,
    trackSearch,
  };
}

// Global error handler for unhandled errors
if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    analytics.trackError(event.message, event.error, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    analytics.trackError("Unhandled promise rejection", event.reason instanceof Error ? event.reason : new Error(String(event.reason)));
  });
}