/**
 * Global loading overlay during account switch.
 * Prevents "ghost data" from previous currency appearing.
 */

import { motion, AnimatePresence } from "motion/react";
import { useAccountStore } from "@/stores/accountStore";

export function AccountSwitchOverlay() {
  const isSwitching = useAccountStore((s) => s.isSwitching);

  return (
    <AnimatePresence>
      {isSwitching && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] bg-white/60 backdrop-blur-sm flex items-center justify-center"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-muted-foreground">
              Switching account...
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
