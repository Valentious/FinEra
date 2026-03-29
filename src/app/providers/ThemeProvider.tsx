import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Persists theme in localStorage (key: finera-theme).
 * Class `dark` on <html> drives tokens in theme.css (.dark { ... }).
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="finera-theme" disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  );
}
