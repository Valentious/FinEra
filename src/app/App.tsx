import { useState, useEffect } from "react";
import { SplashScreen } from "@/app/components/SplashScreen";
import { LoginRegister } from "@/app/components/LoginRegister";
import { OTPVerification } from "@/app/components/OTPVerification";
import { MainNavigation } from "@/app/components/MainNavigation";
import { AccountTypeSelection } from "@/app/components/AccountTypeSelection";
import { VerifyAccess } from "@/app/components/VerifyAccess";
import { ProfileDetails } from "@/app/components/ProfileDetails";
import { Dashboard } from "@/app/components/Dashboard";
import { DashboardV2 } from "@/app/components/DashboardV2";
import { SavingsWallet } from "@/app/components/SavingsWallet";
import { WalletManagement } from "@/app/components/WalletManagement";
import { ApplyForCredit } from "@/app/components/ApplyForCredit";
import { CreditDetails } from "@/app/components/CreditDetails";
import { CreditTypeSelection } from "@/app/components/CreditTypeSelection";
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
import { AdminOverview } from "@/app/components/AdminOverview";
import { MemberAgreement } from "@/app/components/MemberAgreement";
import { MakeRepayment } from "@/app/components/MakeRepayment";
import { MakePayment } from "@/app/components/MakePayment";
import { AccountCreationSuccess } from "@/app/components/AccountCreationSuccess";
import { QuickActionsScreen } from "@/app/components/QuickActionsScreen";
import { Toaster, toast } from "sonner";
import { apiService, checkBackendHealth, USE_MOCK_DATA, type UserData, type Transaction, type CreditApplication, type FinEraAccountNumbers, type CurrencyConfig } from "@/services/index";
import { useAccountStore } from "@/stores/accountStore";
import { fetchWalletsForStore } from "@/lib/walletFetcher";
import { AccountSwitchOverlay } from "@/app/components/AccountSwitchOverlay";
import { BankLinking } from "@/app/components/BankLinking";
import { BackendUnavailableBanner } from "@/app/components/BackendUnavailableBanner";

type Screen =
  | "splash"
  | "loginRegister"
  | "otpVerification"
  | "bankLinking"
  | "accountCreationSuccess"
  | "accountType"
  | "verify"
  | "profileDetails"
  | "dashboard"
  | "savingsWallet"
  | "walletManagement"
  | "withdrawFlow"
  | "depositFlow"
  | "memberAgreement"
  | "applyForCredit"
  | "creditDetails"
  | "creditTypeSelection"
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
  | "adminOverview"
  | "makeRepayment"
  | "makePayment"
  | "quickActions";

// NOTE: These limits are now defined in the backend
// Kept here for UI reference only - backend is the source of truth
const CREDIT_LIMITS = {
  student: { min: 20, max: 200 },
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

const saveUserData = (data: UserData) => {
  localStorage.setItem(`member_${data.email}`, JSON.stringify(data));
};

const loadUserData = (email: string): UserData | null => {
  const saved = localStorage.getItem(`member_${email}`);
  return saved ? JSON.parse(saved) : null;
};
// ==================== END MOCK DATA HELPERS ====================

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("splash");
  const [preSelectedAccountType, setPreSelectedAccountType] = useState<'student' | 'staff' | 'alumni' | null>(null);
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
    savingsBalance: 0,
    approvedCreditWallet: 0, // New: Approved Credit Wallet (non-withdrawable)
    activeCredit: 0,
    availableCreditLimit: 200, // Default for students
    loanPrincipal: 0,
    transactions: [],
    // Financial Identity Metrics: New users start at 50 discipline, 0 loyalty
    disciplineScore: 50,
    creditScore: 82,
    loyaltyProgress: 0,
    missedPayments: 0,
    onTimePayments: 6,
  });

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
          handleLogout();
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
  }, []);

  const activeWallet = useAccountStore((s) => s.activeWallet);
  const wallets = useAccountStore((s) => s.wallets);
  const fetchWallets = useAccountStore((s) => s.fetchWallets);
  const setActiveWalletById = useAccountStore((s) => s.setActiveWalletById);
  const resetToDefault = useAccountStore((s) => s.resetToDefault);
  const storeError = useAccountStore((s) => s.error);

  const [fallbackCurrency, setFallbackCurrency] = useState<"USD" | "ZIG" | "ZAR" | "USDT">("USD");
  const selectedCurrency = (activeWallet?.currency ?? fallbackCurrency) as "USD" | "ZIG" | "ZAR" | "USDT";
  const [currencyTabs, setCurrencyTabs] = useState<CurrencyConfig[]>([]);
  const [walletForCurrency, setWalletForCurrency] = useState<{ savingsBalance: number; activeCredit: number; approvedCreditBalance: number; accountNumber: string } | null>(null);
  const [transactionsForCurrency, setTransactionsForCurrency] = useState<Transaction[]>([]);
  const [backendAvailable, setBackendAvailable] = useState(true);

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

  // Fetch wallets for Global Account Switcher when user enters main app
  useEffect(() => {
    if (!["dashboard", "savingsWallet", "walletManagement", "depositFlow", "withdrawFlow"].includes(currentScreen))
      return;
    fetchWallets(fetchWalletsForStore);
  }, [currentScreen, fetchWallets]);

  // Error recovery: currency mismatch → reset to USD
  useEffect(() => {
    if (storeError && storeError.toLowerCase().includes("currency")) {
      resetToDefault();
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

  // Fetch per-currency wallet + transactions when dashboard or currency changes (strict isolation)
  useEffect(() => {
    if (currentScreen !== "dashboard") return;
    const load = async () => {
      try {
        if (typeof apiService.getWalletsByCurrency === "function") {
          const wallets = await apiService.getWalletsByCurrency(selectedCurrency);
          const w = wallets.find((x) => x.currencyCode === selectedCurrency) ?? wallets[0];
          if (w) {
            setWalletForCurrency({
              savingsBalance: w.savingsBalance,
              activeCredit: w.activeLoanBalance,
              approvedCreditBalance: w.approvedCreditBalance,
              accountNumber: w.accountNumber,
            });
          } else {
            setWalletForCurrency(null);
          }
        }
        if (typeof apiService.getTransactionsByCurrency === "function") {
          const txs = await apiService.getTransactionsByCurrency(selectedCurrency);
          setTransactionsForCurrency(txs);
        }
      } catch {
        setWalletForCurrency(null);
        setTransactionsForCurrency([]);
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
  }, [currentScreen, backendAvailable]);

  const [creditApplication, setCreditApplication] = useState<CreditApplication>({
    creditType: "essential",
    amount: 0,
    withCollateral: false,
  });

  const displayAccountNumber = (() => {
    if (walletForCurrency?.accountNumber) return walletForCurrency.accountNumber;
    const fe = userData.finEraAccountNumbers;
    if (fe) {
      const key = selectedCurrency.toLowerCase() as keyof typeof fe;
      if (key in fe) return (fe as Record<string, string>)[key];
    }
    return userData.accountNumber;
  })();

  const handleLogin = async (email: string, password?: string) => {
    try {
      const { user, token } = await apiService.login({ email, password: password || '' });
      if (user && token) {
        const updated = { ...user, lastLogin: Date.now() };
        if (!updated.finEraAccountNumbers) {
          (updated as UserData).finEraAccountNumbers = generateFinEraAccountNumbers();
        }
        setUserData(updated);
        saveUserData(updated);
        localStorage.setItem("active_user_email", email);
        setCurrentScreen("dashboard");
        toast.success(`Welcome back, ${updated.fullName}!`);
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
    const limit = CREDIT_LIMITS[accountType].max;
    try {
      const { user } = await apiService.register({
        ...data,
        accountType,
      });
      const newUser = {
        ...user,
        availableCreditLimit: limit,
        lastLogin: Date.now(),
      };
      setUserData(newUser);
      saveUserData(newUser);
      localStorage.setItem("active_user_email", data.email);
      setCurrentScreen("otpVerification");
      toast.success("Registration successful!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Registration failed.";
      const isConnectionError =
        msg.includes("Unable to connect") || msg.includes("Failed to fetch") || msg.includes("NetworkError");
      toast.error(isConnectionError ? "Unable to connect. Please check your connection." : msg);
    }
  };

  const handlePreSelectAccountType = (type: 'student' | 'staff' | 'alumni') => {
    setPreSelectedAccountType(type);
    setCurrentScreen("loginRegister");
  };

  const handleSelectAccountType = (type: 'student' | 'staff' | 'alumni') => {
    const limit = CREDIT_LIMITS[type].max;
    setUserData({ ...userData, accountType: type, availableCreditLimit: limit });
    setCurrentScreen("verify");
  };

  const isAuthScreen = [
    "dashboard", "quickActions", "savingsWallet", "walletManagement", "withdrawFlow", "depositFlow", "applyForCredit",
    "creditDetails", "creditTypeSelection", "collateralDetails", "confirmApplication",
    "buyBackAgreement", "creditApproved", "walletCredited", "repaymentDashboard", "financialEducation",
    "profileSettings", "partnerProgram", "adminOverview", "memberAgreement", "makeRepayment", "makePayment"
  ].includes(currentScreen);

  const handleLogout = async () => {
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
  };

  const creditDetails = (() => {
    switch (creditApplication.creditType) {
      case 'essential': return { maxAmount: Math.min(5000, userData.availableCreditLimit), repaymentCycle: "12 months", savingsRequirement: 0.2 };
      case 'emergency': return { maxAmount: Math.min(3000, userData.availableCreditLimit), repaymentCycle: "6 months", savingsRequirement: 0 };
      case 'business': return { maxAmount: Math.min(10000, userData.availableCreditLimit), repaymentCycle: "24 months", savingsRequirement: 0.2 };
    }
  })();

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
              savingsBalance: w.savingsBalance,
              activeCredit: w.activeLoanBalance,
              approvedCreditBalance: w.approvedCreditBalance,
              accountNumber: w.accountNumber,
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

  return (
    <div className="min-h-screen bg-[var(--background)] font-sans selection:bg-primary/20 selection:text-primary">
      <Toaster position="top-center" richColors />
      {!USE_MOCK_DATA && !backendAvailable && <BackendUnavailableBanner />}
      
      {isAuthScreen && (
        <MainNavigation 
          activeScreen={currentScreen} 
          onNavigate={(s) => setCurrentScreen(s as Screen)} 
          onLogout={handleLogout}
          userName={userData.fullName || "User"}
          accountNumber={displayAccountNumber}
          isAdmin={userData.accountType === 'staff'}
          onCreateWallet={() => setCurrentScreen("depositFlow")}
        />
      )}

      <AccountSwitchOverlay />

      <main className={`${isAuthScreen ? "pt-20 md:pl-64 p-4 md:p-8" : ""}`}>
        {currentScreen === "splash" && <SplashScreen onComplete={() => setCurrentScreen("accountType")} />}
        {currentScreen === "accountType" && <AccountTypeSelection onSelectType={handlePreSelectAccountType} onBack={() => setCurrentScreen("splash")} />}
        {currentScreen === "loginRegister" && <LoginRegister accountType={preSelectedAccountType || 'student'} onLogin={handleLogin} onRegister={handleRegister} onBack={() => setCurrentScreen("accountType")} />}
        {currentScreen === "otpVerification" && <OTPVerification email={userData.email} onVerify={() => setCurrentScreen("verify")} onBack={() => setCurrentScreen("loginRegister")} />}
        {currentScreen === "verify" && <VerifyAccess onVerify={() => setCurrentScreen("profileDetails")} />}
        {currentScreen === "profileDetails" && (
          <ProfileDetails 
            accountType={userData.accountType} 
            onComplete={async (profileData) => { 
              try {
                await apiService.completeProfile(profileData);
                const updatedUser = { ...userData, ...profileData };
                setUserData(updatedUser);
                saveUserData(updatedUser);
                // Staff & Alumni: redirect to bank linking first
                if (userData.accountType === "staff" || userData.accountType === "alumni") {
                  setCurrentScreen("bankLinking");
                } else {
                  // Student: generate FinEra accounts and go to success
                  const finEra = generateFinEraAccountNumbers();
                  const withAccounts = { ...updatedUser, finEraAccountNumbers: finEra };
                  setUserData(withAccounts);
                  saveUserData(withAccounts);
                  setCurrentScreen("accountCreationSuccess");
                }
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed to save profile. Please try again.");
              }
            }} 
          />
        )}
        {currentScreen === "bankLinking" && (
          <BankLinking
            accountHolderName={userData.fullName}
            onComplete={(bankData) => {
              const finEra = generateFinEraAccountNumbers();
              const updatedUser = {
                ...userData,
                bankLinkingData: bankData,
                finEraAccountNumbers: finEra,
              };
              setUserData(updatedUser);
              saveUserData(updatedUser);
              setCurrentScreen("accountCreationSuccess");
            }}
          />
        )}
        {currentScreen === "accountCreationSuccess" && (
          <AccountCreationSuccess
            fullName={userData.fullName}
            phoneNumber={userData.phoneNumber}
            finEraAccountNumbers={userData.finEraAccountNumbers}
            onContinue={() => setCurrentScreen("dashboard")}
          />
        )}
        {currentScreen === "quickActions" && (
          <QuickActionsScreen
            onAddSavings={() => setCurrentScreen("depositFlow")}
            onViewRepayment={() => setCurrentScreen("repaymentDashboard")}
            onWithdrawFunds={() => setCurrentScreen("withdrawFlow")}
            onMakePayment={() => setCurrentScreen("makePayment")}
            onBack={() => setCurrentScreen("dashboard")}
          />
        )}
        {currentScreen === "dashboard" && (
          <DashboardV2
            userName={userData.fullName || "User"}
            savingsBalance={walletForCurrency?.savingsBalance ?? userData.savingsBalance}
            activeCredit={walletForCurrency?.activeCredit ?? userData.activeCredit}
            availableCreditLimit={userData.availableCreditLimit}
            disciplineScore={userData.disciplineScore}
            creditScore={userData.creditScore}
            loyaltyProgress={userData.loyaltyProgress}
            selectedCurrency={selectedCurrency}
            onCurrencyChange={(c) => {
              const w = wallets.find((x) => x.currency === c);
              if (w) setActiveWalletById(w.id);
              else setFallbackCurrency(c);
            }}
            displayAccountNumber={displayAccountNumber}
            onApplyForCredit={() => setCurrentScreen("memberAgreement")}
            onAddSavings={() => setCurrentScreen("depositFlow")}
            onViewSavings={() => {
              const approved = (walletForCurrency?.approvedCreditBalance ?? userData.approvedCreditWallet) > 0;
              if (approved) setCurrentScreen("walletManagement");
              else setCurrentScreen("savingsWallet");
            }}
            onViewRepayment={() => setCurrentScreen("repaymentDashboard")}
            onWithdrawFunds={() => setCurrentScreen("withdrawFlow")}
            onMakePayment={() => setCurrentScreen("makePayment")}
            transactions={transactionsForCurrency}
            currencyTabs={currencyTabs}
            dashboardConfig={currencyTabs.find((c) => c.currencyCode === selectedCurrency)?.dashboardConfig}
          />
        )}

        {currentScreen === "memberAgreement" && (
          <MemberAgreement 
            memberType={userData.accountType} 
            onAgree={() => setCurrentScreen("applyForCredit")} 
            onBack={() => setCurrentScreen("dashboard")} 
          />
        )}

        {currentScreen === "savingsWallet" && (
          <SavingsWallet
            totalSavings={walletForCurrency?.savingsBalance ?? userData.savingsBalance}
            lockedSavings={(walletForCurrency?.activeCredit ?? userData.activeCredit) > 0 ? (walletForCurrency?.savingsBalance ?? userData.savingsBalance) * 0.2 : 0}
            availableSavings={(walletForCurrency?.activeCredit ?? userData.activeCredit) > 0 ? (walletForCurrency?.savingsBalance ?? userData.savingsBalance) * 0.8 : (walletForCurrency?.savingsBalance ?? userData.savingsBalance)}
            onAddSavings={() => setCurrentScreen("depositFlow")}
            onWithdraw={() => {
              const bal = walletForCurrency?.savingsBalance ?? userData.savingsBalance;
              if (bal > 0) setCurrentScreen("withdrawFlow");
              else toast.error("Insufficient balance");
            }}
            onBack={() => setCurrentScreen("dashboard")}
          />
        )}

        {currentScreen === "walletManagement" && (
          <WalletManagement
            approvedCreditWallet={walletForCurrency?.approvedCreditBalance ?? userData.approvedCreditWallet}
            savingsWallet={walletForCurrency?.savingsBalance ?? userData.savingsBalance}
            activeCredit={walletForCurrency?.activeCredit ?? userData.activeCredit}
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
              const bal = walletForCurrency?.savingsBalance ?? userData.savingsBalance;
              if (bal > 0) setCurrentScreen("withdrawFlow");
              else toast.error("Insufficient balance in Savings Wallet");
            }}
            onBack={() => setCurrentScreen("dashboard")}
          />
        )}

        {currentScreen === "withdrawFlow" && (
          <WithdrawFlow
            balance={walletForCurrency?.savingsBalance ?? userData.savingsBalance}
            onConfirm={async (amount, method) => {
              try {
                await apiService.withdrawFunds({ amount, method, currency: selectedCurrency });
                await refreshUserData();
              } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Withdrawal failed');
                throw err;
              }
            }}
            onBack={() => setCurrentScreen("dashboard")}
            onSuccess={() => setCurrentScreen("dashboard")}
          />
        )}

        {currentScreen === "depositFlow" && (
          <DepositFlow
            currentBalance={walletForCurrency?.savingsBalance ?? userData.savingsBalance}
            onConfirm={async (amount, method, purpose) => {
              try {
                await apiService.depositFunds({ amount, method, purpose, currency: selectedCurrency });
                await refreshUserData();
              } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Deposit failed');
                throw err;
              }
            }}
            onBack={() => setCurrentScreen("dashboard")}
            onSuccess={() => setCurrentScreen("dashboard")}
          />
        )}

        {currentScreen === "applyForCredit" && (
          <ApplyForCredit
            savingsBalance={walletForCurrency?.savingsBalance ?? userData.savingsBalance}
            hasActiveLoan={(walletForCurrency?.activeCredit ?? userData.activeCredit) > 0}
            onSelectCreditType={(type) => {
              setCreditApplication({ ...creditApplication, creditType: type });
              setCurrentScreen("creditDetails");
            }}
            onBack={() => setCurrentScreen("dashboard")}
          />
        )}

        {currentScreen === "creditDetails" && (
          <CreditDetails
            creditType={creditApplication.creditType}
            maxAmount={creditDetails.maxAmount}
            repaymentCycle={creditDetails.repaymentCycle}
            savingsRequirement={creditDetails.savingsRequirement * 100} // Convert to %
            currentSavings={walletForCurrency?.savingsBalance ?? userData.savingsBalance}
            onContinue={(amount) => {
              // Discipline Rule Check (20% Savings)
              const savings = walletForCurrency?.savingsBalance ?? userData.savingsBalance;
              if (creditApplication.creditType !== 'emergency' && savings < (amount * 0.2)) {
                toast.error("Financial Discipline Notification: Savings must be at least 20% of loan amount.");
                return;
              }
              setCreditApplication({ ...creditApplication, amount });
              setCurrentScreen("creditTypeSelection");
            }}
            onBack={() => setCurrentScreen("applyForCredit")}
          />
        )}

        {currentScreen === "creditTypeSelection" && (
          <CreditTypeSelection
            onSelect={(withCollateral) => {
              setCreditApplication({ ...creditApplication, withCollateral });
              if (withCollateral) setCurrentScreen("collateralDetails");
              else setCurrentScreen("confirmApplication");
            }}
            onBack={() => setCurrentScreen("creditDetails")}
          />
        )}

        {currentScreen === "collateralDetails" && (
          <CollateralDetails onSubmit={() => setCurrentScreen("confirmApplication")} onBack={() => setCurrentScreen("creditTypeSelection")} />
        )}

        {currentScreen === "confirmApplication" && (
          <ConfirmApplication
            creditType={creditApplication.creditType}
            amount={creditApplication.amount}
            repaymentTerms={creditDetails.repaymentCycle}
            withCollateral={creditApplication.withCollateral}
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
            onBack={() => setCurrentScreen(creditApplication.withCollateral ? "collateralDetails" : "creditTypeSelection")}
          />
        )}

        {currentScreen === "creditApproved" && <CreditApproved approvedAmount={creditApplication.amount} repaymentSchedule={`${creditDetails.repaymentCycle}`} onViewWallet={() => setCurrentScreen("walletManagement")} />}
        {currentScreen === "walletCredited" && <WalletCredited amount={creditApplication.amount} onWithdrawFunds={() => setCurrentScreen("walletManagement")} onViewRepayment={() => setCurrentScreen("repaymentDashboard")} />}
        
        {currentScreen === "repaymentDashboard" && (
          <RepaymentDashboard
            totalCredit={walletForCurrency?.activeCredit ?? userData.activeCredit}
            amountRepaid={0}
            outstandingBalance={walletForCurrency?.activeCredit ?? userData.activeCredit}
            onMakeRepayment={() => setCurrentScreen("makeRepayment")} 
            onBack={() => setCurrentScreen("dashboard")} 
          />
        )}

        {currentScreen === "makeRepayment" && (
          <MakeRepayment
            outstandingBalance={walletForCurrency?.activeCredit ?? userData.activeCredit}
            savingsBalance={walletForCurrency?.savingsBalance ?? userData.savingsBalance}
            onBack={() => setCurrentScreen("repaymentDashboard")}
            onConfirm={async (amount, method) => {
              try {
                await apiService.makeRepayment({ amount, method, currency: selectedCurrency });
                await refreshUserData();
                setCurrentScreen("dashboard");
                toast.success(`Repayment of $${amount} verified! Email confirmation sent.`);
              } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Repayment failed');
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
            savingsBalance={walletForCurrency?.savingsBalance ?? userData.savingsBalance}
            currencySymbol={{ USD: "$", ZIG: "Z$", ZAR: "R", USDT: "₮", EUR: "€", GBP: "£" }[selectedCurrency] ?? "$"}
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
      </main>
    </div>
  );
}