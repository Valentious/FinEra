import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  bundles,
  interpolate,
  isAppLocale,
  type AppLocale,
} from "@/i18n/locales";

const STORAGE_KEY = "finera_locale";

type I18nContextValue = {
  locale: AppLocale;
  setLocale: (l: AppLocale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function readStoredLocale(): AppLocale {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s && isAppLocale(s)) return s;
  } catch {
    /* ignore */
  }
  return "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>(() => readStoredLocale());

  const setLocale = useCallback((l: AppLocale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
      document.documentElement.lang = l;
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const table = bundles[locale] ?? bundles.en;
      const fallback = bundles.en[key] ?? key;
      const raw = table[key] ?? fallback;
      return vars ? interpolate(raw, vars) : raw;
    },
    [locale]
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}

/** Safe for optional i18n (e.g. tests) - returns key if no provider */
export function useOptionalI18n(): I18nContextValue | null {
  return useContext(I18nContext);
}
