import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Maximize2, Minimize2, Smartphone } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  MOBILE_SIM_DEVICES,
  MOBILE_SIM_DEVICE_STORAGE_KEY,
  type MobileSimDeviceId,
  getMobileSimPreviewUrl,
} from "@/lib/mobileSimDevices";
import { cn } from "@/app/components/ui/utils";

/**
 * Presentation shell: the member app runs in an `iframe` so the browser’s layout viewport
 * matches phone width — Tailwind `sm`/`md` and mobile nav behave like a real device.
 */
export function MobileSimPage() {
  const [device, setDevice] = useState<MobileSimDeviceId>(() => {
    try {
      const s = localStorage.getItem(MOBILE_SIM_DEVICE_STORAGE_KEY);
      if (s === "iphone" || s === "android") return s;
    } catch {
      /* ignore */
    }
    return "iphone";
  });
  const [fs, setFs] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const spec = MOBILE_SIM_DEVICES[device];
  const iframeH = spec.h - spec.statusH;

  const iframeSrc = useMemo(() => getMobileSimPreviewUrl(), []);
  const openInTabUrl = useMemo(
    () => new URL(import.meta.env.BASE_URL || "/", window.location.origin).href,
    [],
  );

  useEffect(() => {
    try {
      localStorage.setItem(MOBILE_SIM_DEVICE_STORAGE_KEY, device);
    } catch {
      /* ignore */
    }
  }, [device]);

  const onFullscreen = useCallback(async () => {
    const el = frameRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await el.requestFullscreen({ navigationUI: "hide" });
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const h = () => setFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  return (
    <div
      ref={frameRef}
      className="finera-mobile-sim-host relative min-h-dvh overflow-x-hidden overflow-y-auto"
    >
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 0%, color-mix(in srgb, var(--primary-green) 10%, #0f172a) 0%, #020617 55%, #0b1220 100%)",
        }}
        aria-hidden
      />

      <div className="finera-mobile-sim-chrome border-b border-white/10 bg-black/20 px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">FinEra Inclusive Credit</p>
            <h1 className="text-balance text-lg font-semibold text-white sm:text-xl">Mobile app simulation</h1>
            <p className="mt-1 max-w-2xl text-balance text-xs text-zinc-400 sm:text-sm">
              True device viewport in the frame below — the same app as production, for demos and presentations. Touch or
              click to interact; scroll is inertial inside the app.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">
            <div
              className="mr-1 flex rounded-lg border border-white/10 bg-zinc-900/80 p-0.5"
              role="group"
              aria-label="Device size"
            >
              {(Object.keys(MOBILE_SIM_DEVICES) as MobileSimDeviceId[]).map((id) => {
                const d = MOBILE_SIM_DEVICES[id];
                return (
                  <Button
                    key={id}
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 rounded-md px-3 text-xs",
                      device === id
                        ? "bg-primary text-primary-foreground shadow"
                        : "text-zinc-300 hover:bg-white/10 hover:text-white",
                    )}
                    onClick={() => setDevice(id)}
                  >
                    {d.label}
                    <span className="ml-1 tabular-nums text-[10px] opacity-80">
                      {d.w}×{d.h}
                    </span>
                  </Button>
                );
              })}
            </div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-8 border border-white/15 bg-white/10 text-white hover:bg-white/20"
              onClick={onFullscreen}
            >
              {fs ? <Minimize2 className="mr-1.5 h-3.5 w-3.5" /> : <Maximize2 className="mr-1.5 h-3.5 w-3.5" />}
              {fs ? "Exit fullscreen" : "Fullscreen device"}
            </Button>
            <a
              href={openInTabUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 items-center justify-center rounded-md border border-white/10 bg-zinc-900/80 px-3 text-xs font-medium text-zinc-200 transition hover:border-primary/30 hover:text-white"
            >
              Open in tab
            </a>
            <Button asChild variant="outline" size="sm" className="h-8 border-zinc-600 text-zinc-200 hover:text-white">
              <Link to="/" className="text-xs">
                Exit preview
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 items-center justify-center px-3 py-8 sm:px-4 sm:py-12">
        <div
          className="finera-mobile-sim-bezel relative w-[min(100%,calc(100vw-1.5rem))]"
          style={{
            maxWidth: spec.w + 28,
            borderRadius: spec.frameRadius,
          }}
        >
          {spec.island && (
            <div
              className="finera-sim-island pointer-events-none absolute left-1/2 top-3 z-30 h-7 w-[5.5rem] -translate-x-1/2 rounded-full bg-black/95"
              aria-hidden
            />
          )}

          <div
            className="finera-sim-inset flex flex-col overflow-hidden bg-zinc-950 p-[0.2rem] shadow-2xl ring-1 ring-white/15"
            style={{ borderRadius: `calc(${spec.frameRadius} - 2px)` }}
          >
            <MobileSimStatusBar
              className="shrink-0 text-white"
              statusHeight={spec.statusH}
              withIslandOffset={!!spec.island}
            />
            <iframe
              title="FinEra mobile"
              className="finera-sim-iframe block w-full max-w-full shrink-0 border-0 bg-background"
              src={iframeSrc}
              width={spec.w}
              height={iframeH}
              style={{ width: spec.w, height: iframeH, maxWidth: "100%" }}
            />
            <div
              className="finera-sim-home-indicator flex shrink-0 items-center justify-center py-1.5"
              style={{ width: spec.w, maxWidth: "100%" }}
            >
              <div className="h-1 w-28 max-w-[40%] rounded-full bg-zinc-700/80" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileSimStatusBar({
  className,
  statusHeight,
  withIslandOffset,
}: {
  className?: string;
  statusHeight: number;
  withIslandOffset?: boolean;
}) {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
  );
  useEffect(() => {
    setTime(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
    const id = setInterval(
      () => setTime(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })),
      15_000,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className={cn(
        "finera-sim-status relative flex w-full min-w-0 max-w-full items-center justify-between bg-zinc-950 px-4 text-[12px] font-medium tabular-nums",
        withIslandOffset ? "pt-4" : "pt-2.5",
        "pb-1.5",
        className,
      )}
      style={{ minHeight: statusHeight }}
    >
      <span className="min-w-0 pl-0.5">{time}</span>
      <div className="flex min-w-0 items-center gap-1.5 pr-0.5 text-zinc-200">
        <span className="hidden min-[300px]:inline" aria-hidden>
          ●●●
        </span>
        <Smartphone className="h-3 w-3 text-zinc-400" aria-hidden />
        <div className="flex h-2.5 w-6 items-center justify-end rounded-sm border border-zinc-500/80 p-[1px]" aria-label="Battery">
          <div className="h-full w-[60%] rounded-sm bg-zinc-100" />
        </div>
      </div>
    </div>
  );
}
