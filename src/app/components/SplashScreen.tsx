import { useEffect } from "react";
import { motion } from "framer-motion";
import { FinEraLogo } from "./FinEraLogo";
import { FinEraShieldIcon } from "./FinEraShieldIcon";

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
    <div className="fixed inset-0 bg-gradient-to-br from-emerald-800 via-green-800 to-emerald-950 flex flex-col items-center text-white overflow-hidden">
      <div className="flex-1 flex items-center justify-center w-full">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 flex flex-col items-center"
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
          className="text-slate-300 text-lg font-medium mb-8 text-center max-w-[20rem] sm:max-w-md px-4 leading-snug"
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
        className="flex items-center justify-center shrink-0 z-10 w-full text-center px-2"
        style={{ paddingBottom: "20px", paddingLeft: "24px", paddingRight: "24px" }}
      >
        <span
          className="font-medium tracking-[0.12em] uppercase max-w-[min(100%,22rem)]"
          style={{
            color: "#E5E7EB",
            fontSize: "0.875rem",
          }}
        >
          Powered by NUST AND SPC Microfinance
        </span>
      </motion.div>

      {/* Background Animated Orbs */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500 rounded-full blur-[120px]"
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 10, repeat: Infinity, delay: 1 }}
        className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-green-600 rounded-full blur-[150px]"
      />

      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: "200px" }}
        transition={{ duration: SPLASH_DURATION_MS / 1000, ease: "easeInOut" }}
        className="absolute bottom-20 h-1 bg-white/20 rounded-full overflow-hidden"
      >
        <div className="h-full bg-white w-full animate-progress" />
      </motion.div>
    </div>
  );
}