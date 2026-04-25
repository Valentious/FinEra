import { useEffect } from "react";
import { motion } from "framer-motion";
import { FinEraLogo } from "./FinEraLogo";
import { FinEraShieldIcon } from "./FinEraShieldIcon";
import { FineraGradientBackdrop } from "@/app/components/FineraGradientBackdrop";
import { PoweredByCbz } from "@/app/components/PoweredByCbz";
import { BrandHeroFigure } from "@/app/components/BrandHeroFigure";

interface SplashScreenProps {
  onComplete: () => void;
}

/** Total time splash is shown before advancing (ms). */
const SPLASH_DURATION_MS = 5_000;

export function SplashScreen({ onComplete }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] flex min-h-dvh flex-col overflow-hidden text-foreground">
      <FineraGradientBackdrop className="finera-gradient-plate--splash" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-primary/[0.12] via-primary/[0.04] to-primary/[0.18]"
      />

      {/* Watermark: full view height, behind all copy */}
      <div
        className="pointer-events-none absolute inset-0 z-[2] overflow-hidden"
        aria-hidden
      >
        <BrandHeroFigure variant="splash-watermark" />
      </div>

      {/* Light veil so logo + type stay legible on top of the mark */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[3] bg-[radial-gradient(ellipse_90%_72%_at_50%_36%,color-mix(in_srgb,var(--background-main)_24%,transparent)_0%,transparent_64%)] dark:bg-[radial-gradient(ellipse_90%_72%_at_50%_36%,oklch(0.2_0.04_150_/_0.2)_0%,transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[3] bg-gradient-to-b from-primary/[0.14] via-transparent to-primary/[0.1]"
      />

      <div className="relative z-20 flex min-h-0 w-full flex-1 flex-col items-center pt-[env(safe-area-inset-top,0px)]">
        <div className="flex w-full flex-1 flex-col items-center justify-center px-4 py-6 sm:py-10">
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex w-full max-w-md flex-col items-center"
          >
            <motion.div
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.45, ease: "easeOut" }}
              className="mb-4 sm:mb-5"
            >
              <FinEraShieldIcon size={80} className="mx-auto drop-shadow-sm" />
            </motion.div>

            <motion.div
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.45, ease: "easeOut" }}
              className="mb-6 sm:mb-8"
            >
              <FinEraLogo size="lg" showTagline={true} />
            </motion.div>

            <motion.p
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.38, duration: 0.5, ease: "easeOut" }}
              className="mt-3 text-balance px-2 text-center text-base font-semibold leading-snug text-[#0a0a0a] antialiased sm:mt-4 sm:max-w-lg sm:text-lg dark:text-zinc-100"
            >
              Financial Assistant, Made Just For You.
            </motion.p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="flex w-full shrink-0 items-center justify-center px-6 pb-1 pt-2 text-center"
        >
          <PoweredByCbz className="max-w-[min(100%,20rem)]" />
        </motion.div>

        <div className="mb-[max(1.25rem,env(safe-area-inset-bottom,0px))] h-1 w-full max-w-[200px] shrink-0 self-center overflow-hidden rounded-full bg-primary/35">
          <motion.div
            className="h-full w-full origin-left rounded-full bg-primary"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: SPLASH_DURATION_MS / 1000, ease: "linear" }}
          />
        </div>
      </div>
    </div>
  );
}
