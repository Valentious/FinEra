import { cn } from "@/app/components/ui/utils";

const BRAND_HERO_URL = "/brand-hero-credit.png";
/** Splash-screen watermark only; dashboard variants still use `brand-hero-credit.png`. */
const SPLASH_WATERMARK_HERO_URL = "/splash-watermark-hero.png";

type BrandHeroVariant = "splash" | "splash-watermark" | "dashboard-ribbon" | "dashboard-ambient";

type BrandHeroFigureProps = {
  variant: BrandHeroVariant;
  className?: string;
};

/**
 * Isolated “credit success” cutout; shared by splash and dashboard.
 * Hero art from `/public/brand-hero-credit.png`; splash watermark from `/public/splash-watermark-hero.png`.
 */
export function BrandHeroFigure({ variant, className }: BrandHeroFigureProps) {
  if (variant === "splash") {
    return (
      <img
        src={BRAND_HERO_URL}
        alt=""
        width={800}
        height={900}
        decoding="async"
        role="presentation"
        className={cn(
          "h-full w-full object-contain object-bottom object-right",
          "max-h-[min(72dvh,560px)] drop-shadow-[0_24px_48px_rgba(0,0,0,0.12)]",
          "motion-safe:scale-[0.99]",
          "brand-hero-figure--splash",
          className
        )}
      />
    );
  }

  if (variant === "splash-watermark") {
    return (
      <div
        className={cn(
          "finera-splash-figure-wrap pointer-events-none h-full min-h-dvh w-full min-w-0 select-none",
          className
        )}
        aria-hidden
      >
        <img
          src={SPLASH_WATERMARK_HERO_URL}
          alt=""
          width={800}
          height={900}
          decoding="async"
          role="presentation"
          className="brand-hero-figure--splash-wm h-full min-h-0 w-full"
        />
      </div>
    );
  }

  if (variant === "dashboard-ribbon") {
    return (
      <img
        src={BRAND_HERO_URL}
        alt=""
        width={400}
        height={450}
        loading="lazy"
        decoding="async"
        role="presentation"
        className={cn(
          "h-full w-full object-contain object-bottom object-right",
          "max-h-full opacity-[0.92] [filter:drop-shadow(0_12px_32px_rgba(15,23,42,0.1))]",
          "brand-hero-figure--ribbon",
          className
        )}
      />
    );
  }

  return (
    <img
      src={BRAND_HERO_URL}
      alt=""
      width={500}
      height={560}
      loading="lazy"
      decoding="async"
      role="presentation"
      className={cn(
        "h-full w-full object-contain object-bottom object-right",
        "brand-hero-figure--ambient",
        className
      )}
    />
  );
}
