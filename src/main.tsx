import { Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./app/App.tsx";
import AdminApp from "./admin/AdminApp.tsx";
import { VerifyEmailPage } from "./app/components/VerifyEmailPage.tsx";
import { ThemeProvider } from "./app/providers/ThemeProvider.tsx";
import { I18nProvider } from "./app/providers/I18nProvider.tsx";
import { AppErrorBoundary } from "./app/components/AppErrorBoundary.tsx";
import { initNativeShell } from "./lib/nativeBridge.ts";
import "./styles/index.css";

try {
  initNativeShell();
} catch (e) {
  console.error("[FinEra] initNativeShell:", e);
}

const rootEl = document.getElementById("root");
if (!rootEl) {
  document.body.innerHTML =
    "<p style=\"font-family:system-ui;padding:1.5rem\">FinEra: missing #root element. Check index.html.</p>";
} else {
  createRoot(rootEl).render(
    <BrowserRouter>
      <AppErrorBoundary>
        <I18nProvider>
          <ThemeProvider>
            {/* useSearchParams() in App (and similar hooks) can suspend — without Suspense, React shows a blank screen. */}
            <Suspense
              fallback={
                <div className="relative isolate flex min-h-dvh items-center justify-center overflow-hidden text-foreground">
                  <div className="finera-gradient-plate pointer-events-none" aria-hidden />
                  <span className="relative z-10 text-sm font-medium text-muted-foreground">Loading…</span>
                </div>
              }
            >
              <Routes>
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                {/* `/admin` and nested paths - must stay above `/*` so the member app does not mount for /admin* */}
                <Route path="/admin/*" element={<AdminApp />} />
                <Route path="/*" element={<App />} />
              </Routes>
            </Suspense>
          </ThemeProvider>
        </I18nProvider>
      </AppErrorBoundary>
    </BrowserRouter>
  );
}
  