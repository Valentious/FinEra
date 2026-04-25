import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FinEraLogo } from "@/app/components/FinEraLogo";
import { FinEraShieldIcon } from "@/app/components/FinEraShieldIcon";

/**
 * Add `public/splash-base.png` (your reference art) for a soft, blended base layer.
 * The screen works without it: gradients + watermarks only.
 */
const BASE_IMG = `${import.meta.env.BASE_URL}splash-base.png`;

const SPLASH_DURATION_MS = 5_000;

const C = {
  deep: "#06140d",
  mid: "#0c2418",
  bright: "#1a3d2a",
  /** Edge tint for primary wash (kept lighter than pure black) */
  edge: "#0a1810",
  accent: "#4ade80",
  track: "rgba(15, 32, 24, 0.38)",
} as const;

/** Soft blended base: optional art + blur + opacity, reads as atmosphere not a “pasted” photo. */
function SplashBaseArt({ failed, onError }: { failed: boolean; onError: () => void }) {
  if (failed) return null;
  return (
    <div
      aria-hidden
      className="absolute inset-0 z-[1] overflow-hidden"
      style={{ transform: "translateZ(0)" }}
    >
      <img
        src={BASE_IMG}
        alt=""
        width={800}
        height={1400}
        decoding="async"
        onError={onError}
        className="h-[115%] w-full min-w-full object-cover object-center opacity-[0.42] blur-2xl sm:opacity-[0.38] sm:blur-3xl"
        style={{ filter: "saturate(0.9) contrast(0.95)" }}
      />
      <div
        className="absolute inset-0 mix-blend-soft-light"
        style={{
          background: `linear-gradient(175deg, color-mix(in srgb, ${C.deep} 0.56%, transparent) 0%, transparent 40%, color-mix(in srgb, ${C.mid} 50%, ${C.bright} 20%) 100%)`,
        }}
      />
    </div>
  );
}

function SplashTopLeftRings() {
  return (
    <svg
      className="pointer-events-none absolute -left-1 -top-1 h-44 w-44 overflow-visible opacity-[0.12] sm:h-52 sm:w-52"
      viewBox="0 0 100 100"
      aria-hidden
    >
      {[18, 32, 46, 60, 74, 88].map((r) => (
        <circle key={r} cx="0" cy="0" r={r} fill="none" stroke="white" strokeWidth="0.3" />
      ))}
    </svg>
  );
}

function SplashHexWaterMark() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute -right-[12%] top-[5%] w-[min(70vw,20rem)] opacity-[0.06] sm:right-[1%] sm:top-[9%]"
    >
      <svg viewBox="0 0 200 200" className="h-full w-full text-white">
        <polygon
          points="100,20 160,60 160,120 100,160 40,120 40,60"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
        />
        <text
          x="100"
          y="110"
          textAnchor="middle"
          fill="currentColor"
          style={{ fontSize: 72, fontWeight: 800, fontFamily: "Inter, system-ui, sans-serif" }}
        >
          F
        </text>
      </svg>
    </div>
  );
}

function SplashShieldWatermark() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute bottom-[30%] left-[-1%] w-24 opacity-[0.1] sm:bottom-[28%] sm:left-[3%]"
    >
      <svg viewBox="0 0 100 100" className="text-white">
        <path
          d="M50 8 L20 20 V48 C20 70 32 86 50 92 C68 86 80 70 80 48 V20 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M35 50 L44 60 L64 40"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function SplashBottomHorizon() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 top-[55%] z-[4]"
    >
      {/* Glowing horizon + data-line curves in the lower area */}
      <div
        className="absolute left-1/2 top-[40%] h-28 w-56 -translate-x-1/2 rounded-full opacity-25 blur-3xl"
        style={{ background: `color-mix(in srgb, ${C.accent} 50%, #bef264 30%)` }}
      />
      <svg
        className="absolute bottom-0 left-0 right-0 h-[42%] w-full opacity-90"
        viewBox="0 0 400 160"
        preserveAspectRatio="none"
        aria-hidden
      >
        {[
          "M0,120 Q100,100 200,90 T400,85",
          "M0,128 Q120,110 200,100 T400,95",
          "M0,138 Q100,120 200,110 T400,100",
        ].map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke={C.accent}
            strokeWidth="0.35"
            strokeOpacity="0.18"
            strokeDasharray="3 5"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      <div className="absolute inset-x-0 bottom-0 h-[32%] bg-gradient-to-b from-transparent to-[#0a1810]/[0.005]" />
      <div
        className="absolute inset-x-0 bottom-0 top-[28%] opacity-20"
        style={{
          backgroundImage: `radial-gradient(ellipse 120% 85% at 50% 0%, color-mix(in srgb, ${C.accent} 45%, transparent) 0%, transparent 50%)`,
        }}
      />
    </div>
  );
}

/** Ultra-subtle grid — extra depth without visual noise. */
function SplashFintechGrid() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[2] bg-[length:32px_32px] opacity-[0.04]"
      style={{
        backgroundImage: `linear-gradient(to right, white 0.5px, transparent 0.5px), linear-gradient(to bottom, white 0.5px, transparent 0.5px)`,
      }}
    />
  );
}

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [baseImgFailed, setBaseImgFailed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => onComplete(), SPLASH_DURATION_MS);
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-[100] flex min-h-dvh min-h-screen flex-col overflow-hidden font-sans text-white antialiased"
      data-splash-forest
      style={{ fontFamily: "'Inter', var(--font-sans), ui-sans-serif, system-ui, sans-serif" }}
    >
      {/* Primary wash — dark top → slightly brighter emerald low */}
      <div
        aria-hidden
        className="absolute inset-0 z-0"
        style={{
          background: `
            radial-gradient(ellipse 100% 75% at 50% 32%, color-mix(in srgb, ${C.bright} 85%, #1e3d2a) 0%, ${C.mid} 42%, color-mix(in srgb, ${C.deep} 28%, ${C.mid}) 100%),
            linear-gradient(180deg, color-mix(in srgb, ${C.edge} 0.39%, #0c2818) 0%, color-mix(in srgb, ${C.mid} 60%, #0f2d1c) 50%, color-mix(in srgb, #0d2a1a 45%, ${C.mid}) 100%)
          `,
        }}
      />

      <SplashBaseArt failed={baseImgFailed} onError={() => setBaseImgFailed(true)} />

      {/* Unify: green gradient + soft vignette over any base art */}
      <div
        aria-hidden
        className="absolute inset-0 z-[3]"
        style={{
          background: `
            linear-gradient(180deg, rgba(2,8,4,0.0028) 0%, rgba(6,22,12,0.00075) 38%, rgba(10,36,24,0.002) 78%, rgba(1,5,3,0.0035) 100%),
            radial-gradient(ellipse 80% 55% at 50% 32%, color-mix(in srgb, ${C.bright} 25%, transparent) 0%, transparent 60%)
          `,
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 z-[3] mix-blend-multiply opacity-[0.0035]"
        style={{
          background:
            "radial-gradient(ellipse 120% 90% at 50% 40%, transparent 0%, color-mix(in srgb, #0a120d 0.39%, #0b2415) 85%)",
        }}
      />

      <SplashFintechGrid />

      <SplashTopLeftRings />
      <SplashHexWaterMark />
      <SplashShieldWatermark />
      <SplashBottomHorizon />

      <div
        className="pointer-events-none absolute inset-0 z-[7] bg-gradient-to-b from-black/[0.0004] via-transparent to-[#0a1810]/[0.00275]"
        aria-hidden
      />

      <div className="relative z-20 flex min-h-0 w-full flex-1 flex-col items-stretch justify-between px-5 pt-[max(0.75rem,env(safe-area-inset-top,0.75rem))]">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center pb-4 sm:max-w-lg">
          <motion.div
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="flex w-full flex-col items-center text-center"
          >
            {/* Midground glow behind original shield + SVG wordmark */}
            <div className="relative mb-1 flex w-full max-w-sm flex-col items-center">
              <div
                aria-hidden
                className="absolute left-1/2 top-1/2 h-48 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/12 blur-3xl"
              />
              <div
                aria-hidden
                className="absolute left-1/2 top-1/2 h-32 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime-300/10 blur-2xl"
              />
              <div className="relative z-10 flex w-full flex-col items-center">
                <FinEraShieldIcon size={80} className="mb-4 shrink-0 drop-shadow-sm sm:mb-5" />
                <FinEraLogo size="lg" showTagline className="mx-auto max-w-full" />
              </div>
            </div>

            <div
              className="mx-auto mt-3 h-0.5 w-12 rounded-full"
              style={{
                background: `linear-gradient(90deg, transparent, ${C.accent}, transparent)`,
                boxShadow: "0 0 12px color-mix(in srgb, #4ade80 40%, transparent)",
              }}
            />

            {/* Tertiary tagline: hierarchy + “Made Just For You.” slightly emphasized */}
            <motion.p
              initial={{ y: 4, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.12, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="mt-5 max-w-[20rem] text-balance"
            >
              <span
                className="block text-[0.95rem] font-medium leading-[1.55] text-white/90 sm:text-base sm:leading-[1.6]"
                style={{ textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}
              >
                Financial Assistant,
              </span>
              <span
                className="mt-1.5 block text-[0.95rem] font-semibold leading-[1.5] tracking-[-0.01em] text-[#c8f5d6] sm:text-base sm:leading-[1.55]"
                style={{ textShadow: "0 0 16px color-mix(in srgb, #4ade80 8%, transparent)" }}
              >
                Made Just For You.
              </span>
            </motion.p>
          </motion.div>
        </div>

        <div
          className="relative mx-auto mb-[max(1rem,env(safe-area-inset-bottom,0.75rem))] h-2 w-[min(15rem,88vw)] shrink-0 overflow-hidden rounded-full shadow-inner ring-1 ring-white/5"
          style={{ background: C.track }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" aria-hidden />
          <motion.div
            className="h-full w-full origin-left rounded-full will-change-transform"
            style={{
              background: "linear-gradient(90deg, #22c55e 0%, #4ade80 50%, #86efac 100%)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.25), 0 0 20px color-mix(in srgb, #4ade80 50%, transparent)",
            }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: SPLASH_DURATION_MS / 1000, ease: "linear" }}
          />
        </div>
      </div>
    </div>
  );
}
