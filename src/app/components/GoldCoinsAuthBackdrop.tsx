import { cn } from "@/app/components/ui/utils";

const BASE = import.meta.env.BASE_URL;

/** Gold coins on deep blue — `public/images/auth-gold-coins-backdrop.png` */
export const AUTH_GOLD_COINS_BACKDROP_URL = `${BASE}images/auth-gold-coins-backdrop.png`;

interface GoldCoinsAuthBackdropProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Full-viewport credentials canvas: rich coin photography + cinematic navy wash
 * so white form cards stay legible while gold reads as premium accent at the edges.
 */
export function GoldCoinsAuthBackdrop({ children, className }: GoldCoinsAuthBackdropProps) {
  const maxW = "max-w-md";

  return (
    <div
      className={cn(
        "relative isolate flex min-h-dvh min-h-screen w-full justify-center overflow-x-hidden overflow-y-auto bg-slate-950 px-4 py-8 sm:px-6 sm:py-10",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <img
          src={AUTH_GOLD_COINS_BACKDROP_URL}
          alt=""
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-[50%_32%] [transform:translateZ(0)_scale(1.06)]"
        />
        {/* Anchor to the plate’s navy + pull saturation toward FinEra greens */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/65 via-blue-950/[0.78] to-slate-950/[0.94]" />
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-950/25 via-transparent to-blue-900/20" />
        {/* Cool key light top / warm bounce from gold coins bottom */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_110%_70%_at_50%_-5%,rgba(56,189,248,0.18)_0%,transparent_52%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_95%_55%_at_50%_108%,rgba(251,191,36,0.14)_0%,transparent_48%)]" />
        {/* Vignette: keeps busy coin bokeh behind the form, not under it */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_85%_75%_at_50%_45%,transparent_0%,rgba(2,6,23,0.55)_72%,rgba(2,6,23,0.88)_100%)]" />
        <div className="absolute inset-0 ring-1 ring-inset ring-white/[0.06]" />
      </div>

      <div className={cn("relative z-10 w-full flex-none pb-10", maxW)}>{children}</div>
    </div>
  );
}
