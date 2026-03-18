import { useEffect } from "react";
import { motion } from "framer-motion";
import { FinEraLogo } from "./FinEraLogo";
import { ZimbabweFlag } from "./ZimbabweFlag";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 6000); // Changed to 6 seconds
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
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-8"
        >
          <FinEraLogo size="xl" showTagline={true} />
        </motion.div>
        
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-slate-300 text-lg font-medium mb-8"
        >
          Your Financial Operating System
        </motion.p>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="text-white/60 text-xs font-semibold tracking-[0.2em] uppercase"
        >
          Powered by NUST AND SPC Microfinance
        </motion.p>
        </motion.div>
      </div>

      {/* Footer tagline: Proudly Zimbabwean */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="flex items-center justify-center gap-3 shrink-0 z-10 w-full"
        style={{ paddingBottom: "20px", paddingLeft: "24px", paddingRight: "24px" }}
      >
        <span
          className="font-medium tracking-wide"
          style={{
            color: "#E5E7EB",
            fontSize: "0.875rem",
            letterSpacing: "0.05em",
          }}
        >
          Proudly Zimbabwean
        </span>
        <ZimbabweFlag height={14} className="shrink-0" />
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
        transition={{ duration: 5.5, ease: "easeInOut" }}
        className="absolute bottom-20 h-1 bg-white/20 rounded-full overflow-hidden"
      >
        <div className="h-full bg-white w-full animate-progress" />
      </motion.div>
    </div>
  );
}