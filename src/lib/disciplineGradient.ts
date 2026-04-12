/**
 * Tailwind `bg-gradient-to-br` stop classes - same bands as TrustScore on the dashboard.
 */
export function getDisciplineScoreGradientClasses(score: number): string {
  const s = Number.isFinite(Number(score)) ? Number(score) : 50;
  if (s >= 80) return "from-primary to-primary-hover";
  if (s >= 65) return "from-primary/80 to-primary-hover";
  if (s >= 50) return "from-amber-500 to-amber-600";
  return "from-red-400 to-red-600";
}

/**
 * Copy on discipline / TrustScore gradient shells - soft charcoal & mist (not harsh #000 / #fff).
 * Reads like premium product UI: calm contrast, easy on the eyes.
 */
export const onDisciplineGradientText = "text-zinc-800 dark:text-zinc-100";

/** Supporting / secondary lines on the same gradients. */
export const onDisciplineGradientMuted = "text-zinc-600 dark:text-zinc-400";

/** Icons and glyphs - slightly softer than headlines for balance. */
export const onDisciplineGradientIcon = "text-zinc-700 dark:text-zinc-200";

/**
 * Glass on gradients: light frosts only - no black/zinc washes that muddy the band.
 */
export const onDisciplineGradientGlass =
  "border-white/45 bg-white/18 backdrop-blur-md dark:border-white/14 dark:bg-white/[0.10]";

/** Pills and badges (non-destructive) on those gradients. */
export const onDisciplineGradientPill =
  "border-white/50 bg-white/16 text-zinc-800 backdrop-blur-md dark:border-white/18 dark:bg-white/[0.11] dark:text-zinc-100";

/** Soft highlight orbs (never dark-tinted - keeps gradients smooth). */
export const onDisciplineGradientOrb = "bg-white/30 dark:bg-white/[0.10]";

/** Progress track / fill: frosted rails, bright fill - no zinc/black smear on the gradient. */
export const onDisciplineGradientTrack = "bg-white/30 dark:bg-white/18";
export const onDisciplineGradientTrackFill = "bg-white/95 dark:bg-white";

/** Outline / ghost buttons that sit on the gradient. */
export const onDisciplineGradientButtonOutline =
  "border-white/50 bg-white/14 hover:bg-white/22 dark:border-white/20 dark:bg-white/[0.10] dark:hover:bg-white/[0.16]";

/** Card / ribbon float shadow - tinted ambient only (no heavy black drop on the shell). */
export const onDisciplineGradientShellShadow =
  "shadow-[0_18px_44px_-12px_rgb(37_211_102/0.16)] dark:shadow-[0_22px_48px_-14px_rgb(37_211_102/0.12)]";
