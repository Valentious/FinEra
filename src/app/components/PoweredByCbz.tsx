import { cn } from "@/app/components/ui/utils";

const CBZ_LOGO_SRC = `${import.meta.env.BASE_URL}cbz-logo.svg`;

type PoweredByCbzProps = {
  className?: string;
};

/**
 * Partner strip: CBZ mark + “Powered by CBZ” on white, for footers and splash.
 */
export function PoweredByCbz({ className }: PoweredByCbzProps) {
  return (
    <div
      className={cn(
        "inline-flex max-w-full items-center justify-center gap-3 rounded-lg bg-white px-3.5 py-2 text-sm font-medium text-slate-800 shadow-sm",
        className
      )}
      role="group"
      aria-label="Powered by CBZ"
    >
      <img
        src={CBZ_LOGO_SRC}
        alt=""
        width={56}
        height={16}
        className="h-4 w-auto shrink-0 object-contain object-center [image-rendering:-webkit-optimize-contrast]"
        aria-hidden
      />
      <span className="shrink-0 select-none leading-tight">Powered by CBZ</span>
    </div>
  );
}
