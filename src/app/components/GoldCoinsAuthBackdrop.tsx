import { cn } from "@/app/components/ui/utils";

interface GoldCoinsAuthBackdropProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Unified onboarding canvas matching splash-screen gradient and spacing rhythm.
 */
export function GoldCoinsAuthBackdrop({ children, className }: GoldCoinsAuthBackdropProps) {
  const maxW = "max-w-md";

  return (
    <div
      className={cn(
        "relative isolate flex min-h-dvh min-h-screen w-full justify-center overflow-x-hidden overflow-y-auto bg-gradient-to-br from-whatsapp-green-light to-whatsapp-green px-4 py-8 sm:px-6 sm:py-10",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_70%_at_15%_5%,rgba(255,255,255,0.26)_0%,transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_95%_55%_at_88%_92%,rgba(5,150,105,0.18)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/8 via-transparent to-black/6" />
      </div>

      <div className={cn("relative z-10 w-full flex-none pb-10", maxW)}>{children}</div>
    </div>
  );
}
