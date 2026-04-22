import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { SplashScreen } from "@/app/components/SplashScreen";
import { LoginRegister } from "@/app/components/LoginRegister";
import { OTPVerification } from "@/app/components/OTPVerification";
import { MainNavigation } from "@/app/components/MainNavigation";
import { AccountTypeSelection } from "@/app/components/AccountTypeSelection";
import type { AccountOperatingMode } from "@/app/components/AccountTypeSelection";
import { VerifyAccess } from "@/app/components/VerifyAccess";
import { ProfileDetails } from "@/app/components/ProfileDetails";
import { DashboardV2 } from "@/app/components/DashboardV2";
import { WalletManagement } from "@/app/components/WalletManagement";
import { ApplyForCredit } from "@/app/components/ApplyForCredit";
import { CreditDetails } from "@/app/components/CreditDetails";
import { CollateralDetails } from "@/app/components/CollateralDetails";
import { ConfirmApplication } from "@/app/components/ConfirmApplication";
import { BuyBackAgreement } from "@/app/components/BuyBackAgreement";
import { CreditApproved } from "@/app/components/CreditApproved";
import { WalletCredited } from "@/app/components/WalletCredited";
import { RepaymentDashboard } from "@/app/components/RepaymentDashboard";
import { FinancialEducation } from "@/app/components/FinancialEducation";
import { PartnerProgram } from "@/app/components/PartnerProgram";
import { WithdrawFlow } from "@/app/components/WithdrawFlow";
import { DepositFlow } from "@/app/components/DepositFlow";
import { ProfileSettings } from "@/app/components/ProfileSettings";
import { AgreementsConsentScreen } from "@/app/components/AgreementsConsentScreen";
import { MakeRepayment } from "@/app/components/MakeRepayment";
import { MakePayment } from "@/app/components/MakePayment";
import { AccountCreationSuccess } from "@/app/components/AccountCreationSuccess";
import { Toaster, toast } from "sonner";
import { apiService, checkBackendHealth, USE_MOCK_DATA, type UserData, type Transaction, type CreditApplication, type FinEraAccountNumbers, type CurrencyConfig } from "@/services/index";
import type { LoanType } from "@/loan/loanTypes";
import { isLoanTypeAllowedForAccount, requiresCollateralStep, requiresWalletDisciplineForAmount } from "@/loan/loanTypes";
import { useAccountStore } from "@/stores/accountStore";
import { fetchWalletsForStore } from "@/lib/walletFetcher";
import { normalizeStoredMemberTrust } from "@/lib/memberTrustDefaults";
import {
  CURRENCY_AMOUNT_SYMBOLS,
  currencyAmountPlaceholder,
  formatAmountWithCurrency,
  getWalletLabel,
} from "@/types/wallet";
import { AccountSwitchOverlay } from "@/app/components/AccountSwitchOverlay";
import { BackendUnavailableBanner } from "@/app/components/BackendUnavailableBanner";
import { AppErrorBoundary } from "@/app/components/AppErrorBoundary";
import { PeerTransferFlow } from "@/app/components/PeerTransferFlow";
import { useI18n } from "@/app/providers/I18nProvider";
import { isAppLocale } from "@/i18n/locales";
import { cn } from "@/app/components/ui/utils";
import { MobileBottomNav } from "@/app/navigation/memberNav";
import { ForgotPasswordFlow } from "@/app/components/ForgotPasswordFlow";

type Screen =
  | "splash"
  | "loginRegister"
  | "forgotPassword"
  | "otpVerification"
  | "accountCreationSuccess"
  | "accountType"
  | "verify"
  | "profileDetails"
  | "dashboard"
  | "walletManagement"
  | "withdrawFlow"
  | "depositFlow"
  | "memberAgreement"
  | "agreementsConsent"
  | "applyForCredit"
  | "creditDetails"
  | "collateralDetails"
  | "confirmApplication"
  | "buyBackAgreement"
  | "applicationStatus"
  | "creditApproved"
  | "walletCredited"
  | "repaymentDashboard"
  | "financialEducation"
  | "profileSettings"
  | "partnerProgram"
  | "makeRepayment"
  | "makePayment"
  | "peerTransfer";

// NOTE: These limits are now defined in the backend
// Kept here for UI reference only - backend is the source of truth
const CREDIT_LIMITS = {
  student: { min: 20, max: 30 },
  staff: { min: 30, max: 2000 },
  alumni: { min: 30, max: 2000 },
};

// ==================== MOCK DATA HELPERS ====================
// TODO: Remove these when connecting to real backend
// These are only used in mock mode for development
function generateMemberId(): string {
  return 'MEM' + Date.now().toString().slice(-8);
}

function generateAccountNumber(): string {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return timestamp.slice(-9) + random;
}

/** Generate unique FinEra multi-currency account numbers (FE-USD-xxx, FE-ZIG-xxx, FE-ZAR-xxx) */
function generateFinEraAccountNumbers(): FinEraAccountNumbers {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const suffix = () => Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return {
    usd: `FE-USD-${suffix()}`,
    zig: `FE-ZIG-${suffix()}`,
    zar: `FE-ZAR-${suffix()}`,
  };
}

/** Same key as backend/mock: avoids member_User@x vs member_user@x mismatches */
function normalizeStorageEmail(email: string): string {
  return email.trim().toLowerCase();
}

const saveUserData = (data: UserData) => {
  const key = normalizeStorageEmail(data.email);
  localStorage.setItem(`member_${key}`, JSON.stringify(data));
};

const loadUserData = (email: string): UserData | null => {
  const key = normalizeStorageEmail(email);
  const saved = localStorage.getItem(`member_${key}`);
  if (!saved) return null;
  try {
    const parsed = JSON.parse(saved) as UserData;
    const { user, changed } = normalizeStoredMemberTrust(parsed);
    if (changed) {
      localStorage.setItem(`member_${key}`, JSON.stringify(user));
    }
    return user;
  } catch {
    return null;
  }
};

function readSessionAccountMode(): AccountOperatingMode {
  try {
    const s = sessionStorage.getItem("finera_pre_account_mode");
    if (s === "demo" || s === "real") return s;
  } catch {
    /* ignore */
  }
  return "real";
}
// ==================== END MOCK DATA HELPERS ====================

export default function App() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setLocale } = useI18n();

  const [currentScreen, setCurrentScreen] = useState<Screen>("splash");
  const [preSelectedAccountType, setPreSelectedAccountType] = useState<'student' | 'staff' | 'alumni' | null>(null);
  const [preSelectedAccountMode, setPreSelectedAccountMode] = useState<AccountOperatingMode>(readSessionAccountMode);
  const [userData, setUserData] = useState<UserData>({
    memberId: "",
    fullName: "",
    title: "",
    dateOfBirth: "",
    phoneNumber: "",
    accountNumber: "",
    nationalIdNumber: "",
    studentStaffId: "",
    salaryRange: null,
    email: "",
    mobile: "",
    password: "",
    accountType: "student",
    walletBalance: 0,
    approvedCreditWallet: 0, // New: Approved Credit Wallet (non-withdrawable)
    activeCredit: 0,
    availableCreditLimit: 30, // Student credit cap; backend/mock enforce per account type
    loanPrincipal: 0,
    transactions: [],
    // Financial Identity Metrics: New users start at 50 discipline, 0 loyalty
    disciplineScore: 50,
    creditScore: 50,
    loyaltyProgress: 0,
    missedPayments: 0,
    onTimePayments: 6,
  });

  useEffect(() => {
    const pl = userData.preferredLanguage;
    if (pl && isAppLocale(pl)) setLocale(pl);
  }, [userData.preferredLanguage, setLocale]);

  const handleLogout = useCallback(async () => {
    try {
      await apiService.logout();
    } catch {
      // Ignore logout API errors
    }
    localStorage.removeItem("active_user_email");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setCurrentScreen("loginRegister");
  }, []);

  // Restore session from local member cache when token exists (avoids async race with login/splash flow)
  useEffect(() => {
    const emailRaw = localStorage.getItem("active_user_email");
    const token = localStorage.getItem("auth_token") || localStorage.getItem("accessToken");
    if (!emailRaw || !token) return;

    const fromCache = loadUserData(emailRaw);
    if (!fromCache?.email) return;

    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000;
    if (fromCache.lastLogin && now - fromCache.lastLogin > maxAge) {
      void handleLogout();
      toast.error("Session expired. Please sign in again.");
      return;
    }
    setUserData((prev) => ({ ...prev, ...fromCache }));
    setCurrentScreen("dashboard");
  }, [handleLogout]);

  // Session Management Logic
  useEffect(() => {
    const checkSession = () => {
      const activeUserEmail = localStorage.getItem("active_user_email");
      if (!activeUserEmail) return;

      const saved = loadUserData(activeUserEmail);
      if (saved && saved.lastLogin) {
        const now = Date.now();
        const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours

        if (now - saved.lastLogin > sessionDuration) {
          void handleLogout();
          toast.error("Session expired. Please login again.");
          localStorage.removeItem("active_user_email");
        } else {
          // Auto-refresh token if < 1 hour left
          const refreshThreshold = 1 * 60 * 60 * 1000;
          if (sessionDuration - (now - saved.lastLogin) < refreshThreshold) {
            const updated = { ...saved, lastLogin: now };
            setUserData(updated);
            saveUserData(updated);
          }
        }
      }
    };

    const interval = setInterval(checkSession, 5 * 60 * 1000); // Every 5 mins
    checkSession(); // Initial check
    return () => clearInterval(interval);
  }, [handleLogout]);

  const activeWallet = useAccountStore((s) => s.activeWallet);
  const wallets = useAccountStore((s) => s.wallets);
  const walletLoading = useAccountStore((s) => s.isLoading);
  const fetchWallets = useAccountStore((s) => s.fetchWallets);
  const setActiveWalletById = useAccountStore((s) => s.setActiveWalletById);
  const resetToDefault = useAccountStore((s) => s.resetToDefault);
  const storeError = useAccountStore((s) => s.error);

  /** Selected dashboard tab - drives ALL wallet API calls (isolated from stale activeWallet when tab has no wallet row yet). */
  const [dashboardCurrency, setDashboardCurrency] = useState<"USD" | "ZIG" | "ZAR" | "EUR" | "GBP">("USD");

  useEffect(() => {
    if (activeWallet?.currency) {
      setDashboardCurrency(activeWallet.currency as "USD" | "ZIG" | "ZAR" | "EUR" | "GBP");
    }
  }, [activeWallet?.id]);

  const selectedCurrency = dashboardCurrency;

  /** Strict: one wallet row per dashboard currency - no cross-currency fallback */
  const dashboardWallet = useMemo(
    () => wallets.find((w) => w.currency === selectedCurrency),
    [wallets, selectedCurrency]
  );

  const creditWalletState = useMemo(() => {
    if (walletLoading) return { kind: "loading" as const };
    if (wallets.length > 0 && !dashboardWallet) {
      return {
        kind: "missing" as const,
        message: `No wallet found for ${selectedCurrency}. You cannot get a loan in this currency.`,
      };
    }
    if (!walletLoading && wallets.length === 0) {
      return {
        kind: "missing" as const,
        message: "Wallets could not be loaded. Try again or return to the dashboard.",
      };
    }
    return {
      kind: "ok" as const,
      balance: dashboardWallet!.balance,
      walletLabel: dashboardWallet!.walletLabel ?? getWalletLabel(selectedCurrency),
      activeLoanBalance: dashboardWallet!.activeLoanBalance,
    };
  }, [walletLoading, wallets.length, dashboardWallet, selectedCurrency]);

  const [creditAvailability, setCreditAvailability] = useState<number | null>(null);
  const [creditLimitFetchError, setCreditLimitFetchError] = useState(false);

  const [currencyTabs, setCurrencyTabs] = useState<CurrencyConfig[]>([]);

  /** Keep dashboard currency on a tab/wallet that exists — invalid Radix Select value white-screens the app. */
  useEffect(() => {
    if (walletLoading) return;

    if (currencyTabs.length > 0) {
      const okTab = currencyTabs.some((c) => c.currencyCode === selectedCurrency);
      if (!okTab) {
        const code = currencyTabs[0]?.currencyCode;
        if (code) {
          setDashboardCurrency(code as typeof selectedCurrency);
          const w = wallets.find((x) => x.currency === code);
          if (w) setActiveWalletById(w.id);
        }
        return;
      }
    }

    if (wallets.length > 0) {
      const okWallet = wallets.some((w) => w.currency === selectedCurrency);
      if (!okWallet) {
        const w0 = wallets[0];
        if (w0) {
          setDashboardCurrency(w0.currency as typeof selectedCurrency);
          setActiveWalletById(w0.id);
        }
      }
    }
  }, [walletLoading, currencyTabs, wallets, selectedCurrency, setActiveWalletById]);
  const [walletForCurrency, setWalletForCurrency] = useState<{
    balance: number;
    walletLabel: string;
    activeCredit: number;
    approvedCreditBalance: number;
    accountNumber: string;
    walletNumericId?: string;
  } | null>(null);
  /** Never fall back to userData.activeCredit for currency tabs - that value is profile-scoped and leaks loans across currencies. */
  const activeCreditForTab = walletForCurrency?.activeCredit ?? 0;
  const [transactionsForCurrency, setTransactionsForCurrency] = useState<Transaction[]>([]);
  const [backendAvailable, setBackendAvailable] = useState(true);
  /** Where Make Repayment should return after Back (dashboard shortcut vs repayment hub). */
  const [makeRepaymentReturnScreen, setMakeRepaymentReturnScreen] = useState<"dashboard" | "repaymentDashboard">(
    "repaymentDashboard"
  );

  useEffect(() => {
    if (USE_MOCK_DATA) return;
    const check = async () => {
      const ok = await checkBackendHealth();
      setBackendAvailable(ok);
    };
    check();
    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (searchParams.get("continue") === "onboarding") {
      try {
        const raw = sessionStorage.getItem("finera_post_verify");
        if (raw) {
          const parsed = JSON.parse(raw) as { user: UserData; nextScreen?: Screen };
          sessionStorage.removeItem("finera_post_verify");
          setUserData(parsed.user);
          saveUserData(parsed.user);
          localStorage.setItem("active_user_email", parsed.user.email);
          setCurrentScreen(parsed.nextScreen ?? "verify");
        }
      } catch {
        sessionStorage.removeItem("finera_post_verify");
      }
      setSearchParams({}, { replace: true });
      return;
    }
    if (searchParams.get("resume") === "register") {
      setCurrentScreen("loginRegister");
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Fetch wallets for Global Account Switcher + credit flow (strict per-currency savings)
  useEffect(() => {
    if (
      ![
        "dashboard",
        "walletManagement",
        "depositFlow",
        "withdrawFlow",
        "memberAgreement",
        "agreementsConsent",
        "applyForCredit",
        "creditDetails",
        "collateralDetails",
        "confirmApplication",
        "repaymentDashboard",
        "makeRepayment",
        "walletCredited",
      ].includes(currentScreen)
    )
      return;
    fetchWallets(fetchWalletsForStore);
  }, [currentScreen, fetchWallets]);

  // Per-currency credit eligibility (GET /credit/limit?currency=)
  useEffect(() => {
    const creditScreens = [
      "memberAgreement",
      "agreementsConsent",
      "applyForCredit",
      "creditDetails",
      "collateralDetails",
      "confirmApplication",
    ];
    if (!creditScreens.includes(currentScreen)) return;
    let cancelled = false;
    setCreditAvailability(null);
    setCreditLimitFetchError(false);
    (async () => {
      try {
        if (typeof apiService.getCreditLimitForCurrency !== "function") return;
        const r = await apiService.getCreditLimitForCurrency(selectedCurrency);
        if (!cancelled) setCreditAvailability(r.availableCredit);
      } catch {
        if (!cancelled) {
          setCreditLimitFetchError(true);
          setCreditAvailability(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentScreen, selectedCurrency]);

  // Error recovery: currency mismatch → reset to USD dashboard + default wallet
  useEffect(() => {
    if (storeError && storeError.toLowerCase().includes("currency")) {
      resetToDefault();
      setDashboardCurrency("USD");
      toast.error("Account error. Switched to default.");
    }
  }, [storeError, resetToDefault]);

  // Fetch currencies for dynamic dashboard tabs (when on dashboard)
  useEffect(() => {
    if (currentScreen !== "dashboard") return;
    const load = async () => {
      try {
        const tabs = await apiService.getCurrencies?.();
        if (Array.isArray(tabs) && tabs.length > 0) setCurrencyTabs(tabs);
      } catch {
        /* keep default */
      }
    };
    load();
  }, [currentScreen]);

  const walletSyncScreens = [
    "dashboard",
    "repaymentDashboard",
    "makeRepayment",
    "walletCredited",
  ] as const;

  // Fetch per-currency wallet + transactions when dashboard or currency changes (strict isolation)
  useEffect(() => {
    if (!walletSyncScreens.includes(currentScreen as (typeof walletSyncScreens)[number])) return;
    const load = async () => {
      try {
        if (currentScreen === "dashboard" && typeof apiService.getUserProfile === "function") {
          const profile = await apiService.getUserProfile(selectedCurrency);
          setUserData((prev) => {
            const merged = { ...prev, ...profile, transactions: prev.transactions };
            saveUserData(merged);
            return merged;
          });
        }
        if (typeof apiService.getWalletsByCurrency === "function") {
          const wallets = await apiService.getWalletsByCurrency(selectedCurrency);
          const w = wallets.find((x) => x.currencyCode === selectedCurrency) ?? wallets[0];
          if (w) {
            setWalletForCurrency({
              balance: w.balance,
              walletLabel: w.walletLabel ?? getWalletLabel(w.currencyCode),
              activeCredit: w.activeLoanBalance,
              approvedCreditBalance: w.approvedCreditBalance,
              accountNumber: w.accountNumber,
              walletNumericId: w.walletNumericId,
            });
          } else {
            setWalletForCurrency(null);
          }
        }
        if (
          currentScreen === "dashboard" &&
          typeof apiService.getTransactionsByCurrency === "function"
        ) {
          const txs = await apiService.getTransactionsByCurrency(selectedCurrency);
          setTransactionsForCurrency(txs);
        }
      } catch {
        setWalletForCurrency(null);
        if (currentScreen === "dashboard") setTransactionsForCurrency([]);
      }
    };
    load();
  }, [currentScreen, selectedCurrency]);

  // Auto-sync: refresh financial data periodically when on dashboard (non-mock mode)
  useEffect(() => {
    if (USE_MOCK_DATA || !backendAvailable) return;
    const refresh = async () => {
        if (currentScreen === "dashboard") {
        try {
          const profile = await apiService.getUserProfile(selectedCurrency);
          let transactions = [] as Transaction[];
          try {
            transactions = (await apiService.getTransactionsByCurrency?.(selectedCurrency)) as Transaction[] ?? [];
          } catch {
            /* keep existing from profile */
          }
          setUserData((prev) => {
            const merged = { ...prev, ...profile, transactions: transactions.length ? transactions : prev.transactions };
            saveUserData(merged);
            return merged;
          });
        } catch {
          /* silent - keep current state */
        }
      }
    };
    const interval = setInterval(refresh, 60_000); // every 60s
    return () => clearInterval(interval);
  }, [currentScreen, backendAvailable, selectedCurrency]);

  const [creditApplication, setCreditApplication] = useState<CreditApplication>({
    creditType: "essential",
    amount: 0,
    loanType: "NON_COLLATERAL",
    currency: "USD",
  });

  const [agreementsLoanType, setAgreementsLoanType] = useState<LoanType>("NON_COLLATERAL");

  const startLoanFromDashboard = useCallback(
    (loanType: LoanType) => {
      if (!isLoanTypeAllowedForAccount(loanType, userData.accountType)) {
        toast.error("This loan type is not available for your account.");
        return;
      }
      setCreditApplication((prev) => ({ ...prev, loanType }));
      setCurrentScreen("memberAgreement");
    },
    [userData.accountType]
  );

  useEffect(() => {
    setCreditApplication((prev) => ({ ...prev, currency: selectedCurrency }));
  }, [selectedCurrency]);

  const displayAccountNumber = (() => {
    if (walletForCurrency?.accountNumber) return walletForCurrency.accountNumber;
    const fe = userData.finEraAccountNumbers;
    if (fe) {
      const key = selectedCurrency.toLowerCase() as keyof typeof fe;
      if (key in fe) return (fe as Record<string, string>)[key];
    }
    return userData.accountNumber;
  })();

  /** Binance-style 10-digit Wallet ID for this currency (peer transfer). */
  const displayWalletNumericId =
    walletForCurrency?.walletNumericId ||
    userData.walletNumericIds?.[selectedCurrency] ||
    "";

  const handleLogin = async (email: string, password?: string) => {
    try {
      const { user, token } = await apiService.login({ email, password: password || "" });
      if (user && token) {
        const normalizedEmail = normalizeStorageEmail(user.email || email);
        const updated: UserData = {
          ...user,
          email: normalizedEmail,
          lastLogin: Date.now(),
          availableCreditLimit:
            user.availableCreditLimit ??
            (user.accountType === "student" ? 30 : user.accountType === "staff" || user.accountType === "alumni" ? 2000 : 30),
          disciplineScore: user.disciplineScore ?? 50,
          creditScore: user.creditScore ?? 50,
          loyaltyProgress: user.loyaltyProgress ?? 0,
          walletBalance: user.walletBalance ?? 0,
          approvedCreditWallet: user.approvedCreditWallet ?? 0,
          activeCredit: user.activeCredit ?? 0,
          accountMode: user.accountMode ?? "real",
        };
        if (!updated.finEraAccountNumbers) {
          updated.finEraAccountNumbers = generateFinEraAccountNumbers();
        }
        setUserData(updated);
        saveUserData(updated);
        localStorage.setItem("active_user_email", normalizedEmail);
        setCurrentScreen("dashboard");
        toast.success(`Welcome back, ${updated.fullName || "member"}!`);
      } else {
        toast.error("Login failed. Please check your credentials.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed. Please try again.";
      const isConnectionError =
        msg.includes("Unable to connect") || msg.includes("Failed to fetch") || msg.includes("NetworkError");
      toast.error(isConnectionError ? "Unable to connect. Please check your connection." : msg);
    }
  };

  const handleRegister = async (data: any) => {
    const accountType = preSelectedAccountType || "student";
    try {
      await apiService.register({
        ...data,
        accountType,
        accountMode: preSelectedAccountMode,
      });
      const email = String(data.email || "")
        .trim()
        .toLowerCase();
      navigate(`/verify-email?email=${encodeURIComponent(email)}`);
      toast.success("Account created. Check your email for a verification code.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Registration failed.";
      const isConnectionError =
        msg.includes("Unable to connect") || msg.includes("Failed to fetch") || msg.includes("NetworkError");
      toast.error(isConnectionError ? "Unable to connect. Please check your connection." : msg);
    }
  };

  const handlePreSelectAccountType = (type: "student" | "staff" | "alumni", accountMode: AccountOperatingMode) => {
    setPreSelectedAccountType(type);
    setPreSelectedAccountMode(accountMode);
    try {
      sessionStorage.setItem("finera_pre_account_mode", accountMode);
    } catch {
      /* ignore */
    }
    setCurrentScreen("loginRegister");
  };

  const handleSelectAccountType = (type: 'student' | 'staff' | 'alumni') => {
    const limit = CREDIT_LIMITS[type].max;
    setUserData({ ...userData, accountType: type, availableCreditLimit: limit });
    setCurrentScreen("verify");
  };

  const isAuthScreen = [
    "dashboard",
    "walletManagement",
    "withdrawFlow",
    "depositFlow",
    "applyForCredit",
    "creditDetails",
    "collateralDetails",
    "confirmApplication",
    "buyBackAgreement",
    "applicationStatus",
    "creditApproved",
    "walletCredited",
    "repaymentDashboard",
    "financialEducation",
    "profileSettings",
    "partnerProgram",
    "memberAgreement",
    "agreementsConsent",
    "makeRepayment",
    "makePayment",
    "peerTransfer",
  ].includes(currentScreen);

  const creditDetails = useMemo(() => {
    if (creditAvailability === null || creditLimitFetchError) return null;
    const cap = creditAvailability;
    switch (creditApplication.creditType) {
      case "essential":
        return { maxAmount: Math.min(5000, cap), repaymentCycle: "12 months", savingsRequirement: 0.2 };
      case "business":
        return { maxAmount: Math.min(10000, cap), repaymentCycle: "24 months", savingsRequirement: 0.2 };
      default:
        return { maxAmount: Math.min(5000, cap), repaymentCycle: "12 months", savingsRequirement: 0.2 };
    }
  }, [creditApplication.creditType, creditAvailability, creditLimitFetchError]);

  const updateAndSave = (newData: UserData) => {
    setUserData(newData);
    saveUserData(newData);
  };

  const refreshUserData = async () => {
    try {
      const profile = await apiService.getUserProfile(selectedCurrency);
      let transactions = userData.transactions;
      if (typeof apiService.getTransactionsByCurrency === 'function') {
        try {
          transactions = (await apiService.getTransactionsByCurrency(selectedCurrency)) as Transaction[];
        } catch {
          /* keep existing */
        }
      } else if (typeof apiService.getTransactions === 'function') {
        try {
          transactions = (await apiService.getTransactions({})) as Transaction[];
        } catch {
          /* keep existing */
        }
      }
      const merged = { ...userData, ...profile, transactions };
      setUserData(merged);
      saveUserData(merged);
      if (typeof apiService.getWalletsByCurrency === 'function') {
        try {
          const wallets = await apiService.getWalletsByCurrency(selectedCurrency);
          const w = wallets.find((x) => x.currencyCode === selectedCurrency) ?? wallets[0];
          if (w) {
            setWalletForCurrency({
              balance: w.balance,
              walletLabel: w.walletLabel ?? getWalletLabel(w.currencyCode),
              activeCredit: w.activeLoanBalance,
              approvedCreditBalance: w.approvedCreditBalance,
              accountNumber: w.accountNumber,
              walletNumericId: w.walletNumericId,
            });
          }
        } catch {
          /* keep current wallet state */
        }
      }
      // Refresh account store so all currency balances stay in sync (e.g. after deposit)
      fetchWallets(fetchWalletsForStore).catch(() => {});
    } catch {
      // Ignore - keep current state
    }
  };

  const handleMemberNavigate = useCallback(
    (s: string) => {
      if (s === "quickActions" || s === "savingsWallet") {
        setCurrentScreen("dashboard");
        return;
      }
      const screen = s as Screen;
      if (screen === "agreementsConsent") {
        setAgreementsLoanType(creditApplication.loanType);
      }
      setCurrentScreen(screen);
    },
    [creditApplication.loanType]
  );

  return (
    <div
      className={cn(
        "min-h-dvh bg-transparent text-foreground font-sans selection:bg-primary/20 selection:text-primary",
        isAuthScreen && "flex min-h-dvh flex-col",
      )}
    >
      <Toaster position="top-center" richColors />
      {!USE_MOCK_DATA && !backendAvailable && <BackendUnavailableBanner />}

      {isAuthScreen && (
        <MainNavigation
          activeScreen={currentScreen}
          onNavigate={handleMemberNavigate}
          onLogout={handleLogout}
        />
      )}

      <AccountSwitchOverlay />

      <div className={isAuthScreen ? "flex min-h-0 flex-1 flex-col md:pl-64" : "contents"}>
        <main
          className={
            isAuthScreen
              ? // h-12 notification strip + safe area; pb-20 clears fixed mobile tab bar.
                "flex-1 overflow-y-auto overflow-x-hidden px-4 pt-[calc(env(safe-area-inset-top,0px)+3.5rem+0.5rem)] pb-20 md:px-8 md:pb-[max(1rem,env(safe-area-inset-bottom,0px))]"
              : ""
          }
        >
        <AppErrorBoundary onReset={() => setCurrentScreen("dashboard")}>
        {currentScreen === "splash" && <SplashScreen onComplete={() => setCurrentScreen("accountType")} />}
        {currentScreen === "accountType" && (
          <AccountTypeSelection
            accountMode={preSelectedAccountMode}
            onAccountModeChange={(m) => {
              setPreSelectedAccountMode(m);
              try {
                sessionStorage.setItem("finera_pre_account_mode", m);
              } catch {
                /* ignore */
              }
            }}
            onSelectType={handlePreSelectAccountType}
            onBack={() => setCurrentScreen("splash")}
          />
        )}
        {currentScreen === "loginRegister" && (
          <LoginRegister
            accountType={preSelectedAccountType || "student"}
            accountMode={preSelectedAccountMode}
            onLogin={handleLogin}
            onRegister={handleRegister}
            onBack={() => setCurrentScreen("accountType")}
            onForgotPassword={() => setCurrentScreen("forgotPassword")}
          />
        )}
        {currentScreen === "forgotPassword" && (
          <ForgotPasswordFlow onBackToLogin={() => setCurrentScreen("loginRegister")} />
        )}
        {currentScreen === "otpVerification" && <OTPVerification email={userData.email} onVerify={() => setCurrentScreen("verify")} onBack={() => setCurrentScreen("loginRegister")} />}
        {currentScreen === "verify" && <VerifyAccess onVerify={() => setCurrentScreen("profileDetails")} />}
        {currentScreen === "profileDetails" && (
          <ProfileDetails 
            accountType={userData.accountType} 
            onComplete={async (profileData) => { 
              try {
                const res = await apiService.completeProfile(profileData);
                const updatedUser = { ...userData, ...profileData, ...(res?.user ?? {}) };
                setUserData(updatedUser);
                saveUserData(updatedUser);
                const finEra = generateFinEraAccountNumbers();
                const withAccounts = { ...updatedUser, finEraAccountNumbers: finEra };
                setUserData(withAccounts);
                saveUserData(withAccounts);
                setCurrentScreen("accountCreationSuccess");
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed to save profile. Please try again.");
              }
            }} 
          />
        )}
        {currentScreen === "accountCreationSuccess" && (
          <AccountCreationSuccess
            fullName={userData.fullName}
            phoneNumber={userData.phoneNumber}
            walletNumericIds={userData.walletNumericIds}
            onContinue={() => setCurrentScreen("dashboard")}
          />
        )}
        {currentScreen === "peerTransfer" && (
          <PeerTransferFlow
            currency={selectedCurrency}
            availableBalance={walletForCurrency?.balance ?? userData.walletBalance ?? 0}
            onBack={() => setCurrentScreen("dashboard")}
            onSuccess={refreshUserData}
          />
        )}
        {currentScreen === "dashboard" && (
          <DashboardV2
            userName={userData.fullName || "User"}
            walletBalance={walletForCurrency?.balance ?? userData.walletBalance}
            walletLabel={walletForCurrency?.walletLabel ?? getWalletLabel(selectedCurrency)}
            activeCredit={activeCreditForTab}
            availableCreditLimit={userData.availableCreditLimit}
            disciplineScore={userData.disciplineScore}
            creditScore={userData.creditScore}
            loyaltyProgress={userData.loyaltyProgress}
            selectedCurrency={selectedCurrency}
            onCurrencyChange={(c) => {
              setDashboardCurrency(c);
              const w = wallets.find((x) => x.currency === c);
              if (w) setActiveWalletById(w.id);
            }}
            displayAccountNumber={displayWalletNumericId || displayAccountNumber}
            accountType={userData.accountType}
            onSelectLoanType={startLoanFromDashboard}
            onAddSavings={() => setCurrentScreen("depositFlow")}
            onViewRepayment={() => setCurrentScreen("repaymentDashboard")}
            onWithdrawFunds={() => setCurrentScreen("withdrawFlow")}
            onMakeRepayment={() => {
              setMakeRepaymentReturnScreen("dashboard");
              setCurrentScreen("makeRepayment");
            }}
            onMakePayment={() => setCurrentScreen("makePayment")}
            onPeerTransfer={() => setCurrentScreen("peerTransfer")}
            transactions={transactionsForCurrency}
            currencyTabs={currencyTabs}
            dashboardConfig={currencyTabs.find((c) => c.currencyCode === selectedCurrency)?.dashboardConfig}
          />
        )}

        {currentScreen === "memberAgreement" && (
          <AgreementsConsentScreen
            loanType={creditApplication.loanType}
            accountType={userData.accountType}
            disciplineScore={userData.disciplineScore}
            onContinue={() => setCurrentScreen("applyForCredit")}
            onBack={() => setCurrentScreen("dashboard")}
          />
        )}

        {currentScreen === "agreementsConsent" && (
          <AgreementsConsentScreen
            loanType={agreementsLoanType}
            accountType={userData.accountType}
            disciplineScore={userData.disciplineScore}
            showLoanTypeSelector
            onLoanTypeChange={(lt) => {
              setAgreementsLoanType(lt);
              setCreditApplication((p) => ({ ...p, loanType: lt }));
            }}
            onContinue={() => setCurrentScreen("dashboard")}
            onBack={() => setCurrentScreen("dashboard")}
          />
        )}

        {currentScreen === "walletManagement" && (
          <WalletManagement
            currencyCode={selectedCurrency}
            walletLabel={walletForCurrency?.walletLabel ?? getWalletLabel(selectedCurrency)}
            approvedCreditWallet={walletForCurrency?.approvedCreditBalance ?? userData.approvedCreditWallet}
            walletBalance={walletForCurrency?.balance ?? userData.walletBalance}
            onTransferToSavings={async (amount) => {
              try {
                await apiService.transferCreditToSavings(amount, selectedCurrency);
                await refreshUserData();
              } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Transfer failed');
              }
            }}
            onAddSavings={() => setCurrentScreen("depositFlow")}
            onWithdraw={() => {
              const bal = walletForCurrency?.balance ?? userData.walletBalance;
              if (bal > 0) setCurrentScreen("withdrawFlow");
              else toast.error(`Insufficient balance in ${walletForCurrency?.walletLabel ?? getWalletLabel(selectedCurrency)}`);
            }}
            onBack={() => setCurrentScreen("dashboard")}
          />
        )}

        {currentScreen === "withdrawFlow" && (
          <WithdrawFlow
            balance={walletForCurrency?.balance ?? userData.walletBalance}
            approvedCreditBalance={walletForCurrency?.approvedCreditBalance ?? userData.approvedCreditWallet ?? 0}
            currencyCode={selectedCurrency}
            amountSymbol={CURRENCY_AMOUNT_SYMBOLS[selectedCurrency] ?? selectedCurrency}
            amountPlaceholder={currencyAmountPlaceholder(selectedCurrency)}
            virtualDebitCards={userData.virtualDebitCards ?? []}
            onVirtualDebitCardsChange={(cards) => updateAndSave({ ...userData, virtualDebitCards: cards })}
            physicalMastercardLast4={userData.physicalMastercardLast4}
            onPhysicalMastercardChange={(last4) => updateAndSave({ ...userData, physicalMastercardLast4: last4 })}
            onConfirm={async (amount, method, meta) => {
              try {
                if (method === "approved_credit") {
                  await apiService.transferCreditToSavings(amount, selectedCurrency);
                } else {
                  await apiService.withdrawFunds({
                    amount,
                    method,
                    currency: selectedCurrency,
                    debitCardMeta: meta?.debitCardMeta,
                  });
                }
                await refreshUserData();
              } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Cash out failed');
                throw err;
              }
            }}
            onBack={() => setCurrentScreen("dashboard")}
            onSuccess={() => setCurrentScreen("dashboard")}
          />
        )}

        {currentScreen === "depositFlow" && (
          <DepositFlow
            currentBalance={walletForCurrency?.balance ?? userData.walletBalance}
            currencyCode={selectedCurrency}
            amountSymbol={CURRENCY_AMOUNT_SYMBOLS[selectedCurrency] ?? selectedCurrency}
            amountPlaceholder={currencyAmountPlaceholder(selectedCurrency)}
            virtualDebitCards={userData.virtualDebitCards ?? []}
            onVirtualDebitCardsChange={(cards) => updateAndSave({ ...userData, virtualDebitCards: cards })}
            physicalMastercardLast4={userData.physicalMastercardLast4}
            onPhysicalMastercardChange={(last4) => updateAndSave({ ...userData, physicalMastercardLast4: last4 })}
            onConfirm={async (amount, method, purpose, meta) => {
              try {
                await apiService.depositFunds({
                  amount,
                  method,
                  purpose,
                  currency: selectedCurrency,
                  debitCardMeta: meta?.debitCardMeta,
                });
                await refreshUserData();
              } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Cash in failed');
                throw err;
              }
            }}
            onBack={() => setCurrentScreen("dashboard")}
            onSuccess={() => setCurrentScreen("dashboard")}
          />
        )}

        {currentScreen === "applyForCredit" && (
          <ApplyForCredit
            currencyCode={selectedCurrency}
            isWalletLoading={creditWalletState.kind === "loading"}
            walletError={creditWalletState.kind === "missing" ? creditWalletState.message : null}
            walletBalance={creditWalletState.kind === "ok" ? creditWalletState.balance : 0}
            walletLabel={creditWalletState.kind === "ok" ? creditWalletState.walletLabel : getWalletLabel(selectedCurrency)}
            hasActiveLoan={creditWalletState.kind === "ok" ? creditWalletState.activeLoanBalance > 0 : false}
            loanType={creditApplication.loanType}
            onSelectCreditType={(type) => {
              setCreditApplication({ ...creditApplication, creditType: type });
              setCurrentScreen("creditDetails");
            }}
            onBack={() => setCurrentScreen("dashboard")}
          />
        )}

        {currentScreen === "creditDetails" && (
          <CreditDetails
            currencyCode={selectedCurrency}
            walletLabel={creditWalletState.kind === "ok" ? creditWalletState.walletLabel : getWalletLabel(selectedCurrency)}
            isWalletLoading={creditWalletState.kind === "loading"}
            walletError={creditWalletState.kind === "missing" ? creditWalletState.message : null}
            creditLimitLoading={creditAvailability === null && !creditLimitFetchError}
            creditLimitError={creditLimitFetchError}
            limitsReady={creditDetails != null}
            loanType={creditApplication.loanType}
            creditType={creditApplication.creditType}
            maxAmount={creditDetails?.maxAmount ?? 0}
            repaymentCycle={creditDetails?.repaymentCycle ?? ""}
            savingsRequirement={(creditDetails?.savingsRequirement ?? 0) * 100}
            currentSavings={creditWalletState.kind === "ok" ? creditWalletState.balance : 0}
            onContinue={(amount) => {
              if (creditWalletState.kind !== "ok") {
                toast.error("Wallet not found for selected currency.");
                return;
              }
              const savings = creditWalletState.balance;
              if (
                requiresWalletDisciplineForAmount(creditApplication.loanType, creditApplication.creditType) &&
                savings < amount * 0.2
              ) {
                toast.error(
                  `Financial Discipline Notification: ${creditWalletState.kind === "ok" ? creditWalletState.walletLabel : getWalletLabel(selectedCurrency)} balance must be at least 20% of loan amount.`
                );
                return;
              }
              setCreditApplication({ ...creditApplication, amount });
              if (requiresCollateralStep(creditApplication.loanType)) {
                setCurrentScreen("collateralDetails");
              } else {
                setCurrentScreen("confirmApplication");
              }
            }}
            onBack={() => setCurrentScreen("applyForCredit")}
          />
        )}

        {currentScreen === "collateralDetails" && (
          <CollateralDetails
            currencyCode={selectedCurrency}
            loanType={creditApplication.loanType}
            onSubmit={() => setCurrentScreen("confirmApplication")}
            onBack={() => setCurrentScreen("creditDetails")}
          />
        )}

        {currentScreen === "applicationStatus" && (
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
            <div
              className="h-12 w-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"
              aria-hidden
            />
            <p className="text-lg font-black text-foreground">Processing your application</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Securely submitting your credit request. This usually takes a few seconds.
            </p>
          </div>
        )}
        {currentScreen === "confirmApplication" && (
          <ConfirmApplication
            currencyCode={selectedCurrency}
            creditType={creditApplication.creditType}
            amount={creditApplication.amount}
            repaymentTerms={creditDetails?.repaymentCycle ?? ""}
            loanType={creditApplication.loanType}
            onSubmit={async () => {
              setCurrentScreen("applicationStatus");
              try {
                await apiService.applyCreditApplication({ ...creditApplication, currency: selectedCurrency });
                await refreshUserData();
                setCurrentScreen("creditApproved");
              } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Application failed');
                setCurrentScreen("confirmApplication");
              }
            }}
            onBack={() =>
              setCurrentScreen(requiresCollateralStep(creditApplication.loanType) ? "collateralDetails" : "creditDetails")
            }
          />
        )}

        {currentScreen === "creditApproved" && (
          <CreditApproved
            currencyCode={selectedCurrency}
            approvedAmount={creditApplication.amount}
            repaymentSchedule={`${creditDetails?.repaymentCycle ?? ""}`}
            onViewWallet={() => setCurrentScreen("walletManagement")}
          />
        )}
        {currentScreen === "walletCredited" && (
          <WalletCredited
            currencyCode={selectedCurrency}
            amount={creditApplication.amount}
            onWithdrawFunds={() => setCurrentScreen("walletManagement")}
            onViewRepayment={() => setCurrentScreen("repaymentDashboard")}
          />
        )}

        {currentScreen === "repaymentDashboard" && (
          <RepaymentDashboard
            currencyCode={selectedCurrency}
            isWalletLoading={creditWalletState.kind === "loading"}
            walletError={creditWalletState.kind === "missing" ? creditWalletState.message : null}
            totalObligation={creditWalletState.kind === "ok" ? creditWalletState.activeLoanBalance : activeCreditForTab}
            amountRepaid={0}
            outstandingBalance={creditWalletState.kind === "ok" ? creditWalletState.activeLoanBalance : activeCreditForTab}
            onMakeRepayment={() => {
              setMakeRepaymentReturnScreen("repaymentDashboard");
              setCurrentScreen("makeRepayment");
            }}
            onBack={() => setCurrentScreen("dashboard")}
          />
        )}

        {currentScreen === "makeRepayment" && (
          <MakeRepayment
            currencyCode={selectedCurrency}
            isWalletLoading={creditWalletState.kind === "loading"}
            walletError={creditWalletState.kind === "missing" ? creditWalletState.message : null}
            outstandingBalance={creditWalletState.kind === "ok" ? creditWalletState.activeLoanBalance : activeCreditForTab}
            walletBalance={
              creditWalletState.kind === "ok" ? creditWalletState.balance : walletForCurrency?.balance ?? 0
            }
            walletLabel={
              creditWalletState.kind === "ok"
                ? creditWalletState.walletLabel
                : walletForCurrency?.walletLabel ?? getWalletLabel(selectedCurrency)
            }
            onBack={() => setCurrentScreen(makeRepaymentReturnScreen)}
            onConfirm={async (amount, method) => {
              try {
                await apiService.makeRepayment({ amount, method, currency: selectedCurrency });
                await refreshUserData();
                setCurrentScreen("dashboard");
                toast.success(
                  `Repayment of ${formatAmountWithCurrency(amount, selectedCurrency)} verified! Email confirmation sent.`
                );
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Repayment failed");
                throw err;
              }
            }}
          />
        )}

        {currentScreen === "financialEducation" && (
          <FinancialEducation
            onBack={() => setCurrentScreen("dashboard")}
            userData={userData}
          />
        )}
        {currentScreen === "makePayment" && (
          <MakePayment
            countryCode={userData.countryId || "zw"}
            currencyCode={selectedCurrency}
            walletBalance={walletForCurrency?.balance ?? userData.walletBalance}
            walletLabel={walletForCurrency?.walletLabel ?? getWalletLabel(selectedCurrency)}
            currencySymbol={{ USD: "$", ZIG: "Z$", ZAR: "R", EUR: "€", GBP: "£" }[selectedCurrency] ?? "$"}
            onBack={() => setCurrentScreen("dashboard")}
            onSuccess={async (payment) => {
              try {
                if (payment.gatewayId === "from_savings") {
                  await apiService.withdrawFunds({
                    amount: payment.amount,
                    method: "savings",
                    destination: payment.description,
                    currency: selectedCurrency,
                  });
                }
                await refreshUserData();
                setCurrentScreen("dashboard");
              } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Payment failed');
              }
            }}
          />
        )}
        {currentScreen === "profileSettings" && <ProfileSettings userData={userData} onLogout={handleLogout} onUpdate={(d) => updateAndSave({ ...userData, ...d })} />}
        {currentScreen === "partnerProgram" && <PartnerProgram />}
        </AppErrorBoundary>
        </main>
      </div>

      {isAuthScreen && (
        <MobileBottomNav
          className="md:hidden"
          activeScreen={currentScreen}
          onNavigate={handleMemberNavigate}
        />
      )}
    </div>
  );
}
