/** Coin emoji with a dollar mark on top - e.g. Potential Credit. */
export function CoinDollarMarkIcon({ className = "" }: { className?: string }) {
  return (
    <span className={`relative inline-flex h-11 w-11 shrink-0 items-center justify-center ${className}`} role="img" aria-label="Coin with dollar">
      <span className="select-none text-[1.65rem] leading-none" aria-hidden>
        🪙
      </span>
      <span
        className="absolute -top-0.5 left-1/2 z-[1] -translate-x-1/2 text-[0.65rem] font-bold leading-none text-zinc-800 dark:text-zinc-100"
        aria-hidden
      >
        $
      </span>
    </span>
  );
}
