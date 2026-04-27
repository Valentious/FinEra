import { useEffect } from "react";
import { motion } from "framer-motion";
import { FinEraLogo } from "@/app/components/FinEraLogo";
import { FinEraShieldIcon } from "@/app/components/FinEraShieldIcon";

/** Matches {@link AccountTypeSelection} / open-account canvas */
const SPLASH_DURATION_MS = 4_000;

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const t = setTimeout(() => onComplete(), SPLASH_DURATION_MS);
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-[100] flex min-h-dvh min-h-screen flex-col overflow-hidden bg-gradient-to-br from-whatsapp-green-light to-whatsapp-green p-4 font-sans text-slate-900 antialiased"
      style={{ fontFamily: "'Inter', var(--font-sans), ui-sans-serif, system-ui, sans-serif" }}
    >
      <div className="relative z-20 flex min-h-0 w-full flex-1 flex-col items-stretch justify-between px-1 pt-[max(0.75rem,env(safe-area-inset-top,0.75rem))]">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center pb-4 sm:max-w-lg">
          <motion.div
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="flex w-full flex-col items-center text-center"
          >
            <div className="relative mb-1 flex w-full max-w-sm flex-col items-center">
              <div className="relative z-10 flex w-full max-w-md flex-col items-center">
                <div className="flex w-full items-center justify-center gap-0">
                  <FinEraShieldIcon size={80} className="h-20 w-20 shrink-0 drop-shadow-sm" />
                  <FinEraLogo
                    size="lg"
                    showTagline={false}
                    wordmarkAlign="start"
                    className="block h-[3.5rem] w-auto max-w-[min(100%,12.5rem)] shrink-0 drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]"
                  />
                </div>
                <p className="mt-2.5 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-black sm:text-[11px]">
                  INCLUSIVE CREDIT
                </p>
              </div>
            </div>

            <div className="mx-auto mt-3 h-0.5 w-12 rounded-full bg-whatsapp-green shadow-[0_0_12px_rgba(37,211,102,0.35)]" />

            <p className="mt-5 max-w-[20rem] text-balance text-black">
              <motion.span
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
                className="block text-[0.95rem] font-medium leading-[1.55] sm:text-base sm:leading-[1.6]"
              >
                Financial Assistant,
              </motion.span>
              <motion.span
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.26, duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
                className="mt-1.5 block text-[0.95rem] font-semibold leading-[1.5] tracking-[-0.01em] text-slate-800 sm:text-base sm:leading-[1.55]"
              >
                Made Just For You.
              </motion.span>
            </p>
          </motion.div>
        </div>

        <div className="relative mx-auto mb-[max(1rem,env(safe-area-inset-bottom,0.75rem))] h-2 w-[min(15rem,88vw)] shrink-0 overflow-hidden rounded-full bg-black/10 shadow-inner ring-1 ring-black/5">
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent" aria-hidden />
          <motion.div
            className="h-full w-full origin-left rounded-full bg-whatsapp-green will-change-transform"
            style={{
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.35), 0 0 16px color-mix(in srgb, var(--color-whatsapp-green, #25D366) 45%, transparent)",
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
