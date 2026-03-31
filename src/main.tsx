import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./app/App.tsx";
import AdminApp from "./admin/AdminApp.tsx";
import { VerifyEmailPage } from "./app/components/VerifyEmailPage.tsx";
import { ThemeProvider } from "./app/providers/ThemeProvider.tsx";
import { I18nProvider } from "./app/providers/I18nProvider.tsx";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <I18nProvider>
    <ThemeProvider>
      <Routes>
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="/*" element={<App />} />
      </Routes>
    </ThemeProvider>
    </I18nProvider>
  </BrowserRouter>
);
  