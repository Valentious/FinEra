import { useEffect } from "react";
import { motion } from "framer-motion";
import { FinEraLogo } from "./FinEraLogo";
import { FinEraShieldIcon } from "./FinEraShieldIcon";
import { FineraGradientBackdrop } from "@/app/components/FineraGradientBackdrop";

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
    <div className="fixed inset-0 z-[100] flex min-h-dvh flex-col items-center overflow-hidden text-foreground">
      {/* Same stack as global canvas (app-canvas.css) — gradient + orbs */}
      <FineraGradientBackdrop />
      <div className="relative z-10 flex min-h-0 w-full flex-1 flex-col items-center pt-[env(safe-area-inset-top,0px)]">
        <div className="flex w-full flex-1 items-center justify-center px-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative flex flex-col items-center"
          >
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="mb-5"
            >
              <FinEraShieldIcon size={80} className="mx-auto" />
            </motion.div>

            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="mb-8"
            >
              <FinEraLogo size="lg" showTagline={true} />
            </motion.div>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mb-8 max-w-[20rem] px-4 text-center text-lg font-medium leading-snug text-foreground/90 sm:max-w-md"
            >
              Financial Assistant, Made Just For You.
            </motion.p>
          </motion.div>
        </div>

        {/* Footer: partner attribution */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="flex w-full shrink-0 items-center justify-center px-6 pb-2 text-center"
        >
          <span className="max-w-[min(100%,22rem)] text-sm font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Powered by NUST & SPC Microfinance
          </span>
        </motion.div>

        <div className="mb-[max(1.25rem,env(safe-area-inset-bottom,0px))] h-1 w-full max-w-[200px] shrink-0 overflow-hidden rounded-full bg-primary/20 px-0">
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