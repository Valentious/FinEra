type NativePayload = Record<string, unknown>;

type CapacitorRuntime = {
  isNativePlatform(): boolean;
  getPlatform(): string;
};

function getCapacitorRuntime(): CapacitorRuntime | null {
  if (typeof window === "undefined") return null;
  const c = (window as unknown as { Capacitor?: CapacitorRuntime }).Capacitor;
  return c ?? null;
}

declare global {
  interface Window {
    AndroidBridge?: { postMessage: (json: string) => void };
  }
}

/** True when the UI is running inside a Capacitor native WebView (injected before app JS). */
export function isCapacitorNative(): boolean {
  return Boolean(getCapacitorRuntime()?.isNativePlatform());
}

export function getNativePlatform(): "web" | "ios" | "android" {
  const c = getCapacitorRuntime();
  if (!c?.isNativePlatform()) return "web";
  const p = c.getPlatform();
  if (p === "ios" || p === "android") return p;
  return "web";
}

/** Optional host bridge (WKWebView / custom Android WebView). */
export function postToNativeHost(type: string, payload?: NativePayload): void {
  const body = JSON.stringify({ type, ...(payload ?? {}) });
  try {
    window.AndroidBridge?.postMessage(body);
  } catch {
    /* ignore */
  }
  try {
    const handlers = (
      window as unknown as {
        webkit?: { messageHandlers?: Record<string, { postMessage: (m: unknown) => void }> };
      }
    ).webkit?.messageHandlers;
    handlers?.FinEra?.postMessage(JSON.parse(body));
  } catch {
    /* ignore */
  }
}

/**
 * Marks the document when running inside Capacitor and registers light listeners
 * (deep links) without blocking first paint.
 */
export function initNativeShell(): void {
  if (typeof window === "undefined" || !isCapacitorNative()) return;
  document.documentElement.classList.add("capacitor-native");
  void import("@capacitor/app")
    .then(({ App }) => {
      void App.addListener("appUrlOpen", () => {
        /* Deep links: wire to react-router when you add universal links. */
      });
    })
    .catch(() => {
      /* Optional in minimal web-only installs */
    });
}
