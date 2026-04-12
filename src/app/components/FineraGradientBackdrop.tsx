import { cn } from "@/app/components/ui/utils";

type FineraGradientBackdropProps = {
  /** Match rounded parent so gradient + orbs clip like SplashScreen / dashboard cards */
  clip?: "none" | "ribbon" | "card" | "panel" | "rounded-lg";
  className?: string;
};

/**
 * Same visual stack as {@link SplashScreen}: `finera-gradient-plate` from app-canvas.css
 * (soft top-left → intense green bottom-right + animated orbs).
 * Parent must be `position: relative` (and usually `overflow-hidden` when clipped).
 */
export function FineraGradientBackdrop({ clip = "none", className }: FineraGradientBackdropProps) {
  return (
    <div
      className={cn(
        "finera-gradient-plate pointer-events-none",
        clip === "ribbon" && "finera-gradient-plate--ribbon",
        clip === "card" && "finera-gradient-plate--card",
        clip === "panel" && "finera-gradient-plate--panel",
        clip === "rounded-lg" && "finera-gradient-plate--rounded-lg",
        className
      )}
      aria-hidden
    />
  );
}
