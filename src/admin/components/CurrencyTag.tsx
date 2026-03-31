export type IsoCurrency = "USD" | "ZIG" | "ZAR";

const style: Record<IsoCurrency, string> = {
  USD: "bg-slate-800 text-white",
  ZIG: "bg-amber-700 text-white",
  ZAR: "bg-emerald-800 text-white",
};

export function CurrencyTag({ code }: { code: IsoCurrency }) {
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-bold ${style[code]}`}>
      {code}
    </span>
  );
}
