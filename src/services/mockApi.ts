/**
 * Mock API Service for Development
 * 
 * This provides mock responses using localStorage to simulate backend behavior.
 * Use this during development until the real backend is ready.
 * 
 * To switch to real backend:
 * 1. Set USE_MOCK_DATA = false in api.ts
 * 2. Update BASE_URL in api.ts to your backend URL
 */

import type {
  UserData,
  Transaction,
  LoginRequest,
  RegisterRequest,
  OTPVerificationRequest,
  DepositRequest,
  WithdrawalRequest,
  RepaymentRequest,
  CreditApplication,
  NotificationItem,
  NotificationListPayload,
  PeerTransferRecipient,
  CompleteProfilePayload,
} from "./api";
import { getWalletLabel } from "@/types/wallet";
import { FINERA_REGISTRATION_CONSENT_VERSION } from "@/legal/consentVersion";
import { normalizeStoredMemberTrust } from "@/lib/memberTrustDefaults";
import {
  extractStudentIdContent,
  isNationalIdValid,
  isStudentIdValid,
  normalizeNationalIdForSubmit,
  NATIONAL_ID_ERROR,
  STUDENT_ID_ERROR,
  validateStructuredResidentialAddress,
} from "@/lib/kycIdentityFormats";

/** Aligned with backend `auth-messages` + strict email–account-line binding. */
const AUTH_MSG_EMAIL_ACCOUNT_IN_USE = `This email is already associated with an existing account. Please log in or use a different email.`;
const AUTH_MSG_SIGN_IN_INSTEAD = `This email is already in use. Sign in if you already have an account.`;

// ==================== HELPER FUNCTIONS ====================

function generateMemberId(): string {
  return 'MEM' + Date.now().toString().slice(-8);
}

function generateAccountNumber(): string {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return timestamp.slice(-9) + random;
}

function calculateCreditLimit(accountType: 'student' | 'staff' | 'alumni'): number {
  const limits = {
    student: 30,
    staff: 5000,
    alumni: 5000,
  };
  return limits[accountType];
}

function calculateActiveCredit(principal: number): number {
  const serviceFee = principal * 0.015; // 1.5%
  const interest = principal * 0.18; // 18%
  return principal + serviceFee + interest;
}

function saveUserData(user: UserData): void {
  localStorage.setItem(`member_${normalizeEmail(user.email)}`, JSON.stringify(user));
}

/** Extended user with per-currency wallet balances and auth (mock-only) */
type MockUserData = UserData & {
  walletBalances?: Record<string, number>;
  /** Per-currency approved credit (isolated wallets) */
  approvedCreditByCurrency?: Record<string, number>;
  /** Per-currency outstanding loan (isolated) */
  activeLoanByCurrency?: Record<string, number>;
  /** Password hash for mock auth - never returned to caller */
  _passwordHash?: string;
  /** Until email OTP is verified (mirrors backend PENDING_VERIFICATION) */
  _pendingVerification?: boolean;
};

function randomTenDigitId(): string {
  let s = "";
  for (let i = 0; i < 10; i++) s += Math.floor(Math.random() * 10).toString();
  return s;
}

function allTakenWalletNumericIds(): Set<string> {
  const set = new Set<string>();
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k?.startsWith("member_")) continue;
    const raw = localStorage.getItem(k);
    if (!raw) continue;
    try {
      const u = JSON.parse(raw) as MockUserData;
      const ids = u.walletNumericIds;
      if (ids && typeof ids === "object") {
        for (const v of Object.values(ids)) {
          if (typeof v === "string" && /^\d{10}$/.test(v)) set.add(v);
        }
      }
    } catch {
      /* ignore */
    }
  }
  return set;
}

/** Ensure each user has unique 10-digit Wallet IDs per USD / ZIG / ZAR (Binance-style). */
function ensureMockWalletNumericIds(user: MockUserData): void {
  if (!user.email) return;
  const taken = allTakenWalletNumericIds();
  const cur = { ...(user.walletNumericIds ?? {}) };
  let changed = false;
  for (const c of ["USD", "ZIG", "ZAR"]) {
    const ex = cur[c];
    if (ex && /^\d{10}$/.test(ex)) {
      taken.add(ex);
      continue;
    }
    let nid: string;
    do {
      nid = randomTenDigitId();
    } while (taken.has(nid));
    taken.add(nid);
    cur[c] = nid;
    changed = true;
  }
  if (changed) {
    user.walletNumericIds = cur;
    saveUserData(user);
  }
}

function findPeerByWalletNumericId(
  ten: string,
  selfEmail: string
): { peer: MockUserData; currencyCode: string } | null {
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k?.startsWith("member_")) continue;
    const raw = localStorage.getItem(k);
    if (!raw) continue;
    try {
      const u = JSON.parse(raw) as MockUserData;
      if (!u.email || normalizeEmail(u.email) === normalizeEmail(selfEmail)) continue;
      const ids = u.walletNumericIds;
      if (!ids) continue;
      for (const [cc, nid] of Object.entries(ids)) {
        if (nid === ten) return { peer: u, currencyCode: cc.toUpperCase() };
      }
    } catch {
      /* ignore */
    }
  }
  return null;
}

/** Hash password for mock storage (browser-safe, mirrors backend intent) */
async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const data = await crypto.subtle.digest("SHA-256", enc.encode(password));
  return Array.from(new Uint8Array(data))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const inputHash = await hashPassword(password);
  return inputHash === storedHash;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Strip internal fields before exposing user (never return _passwordHash) */
function toPublicUser(u: MockUserData): UserData {
  const { _passwordHash, _pendingVerification, ...rest } = u;
  void _pendingVerification;
  return rest as UserData;
}

function loadUserData(email: string): MockUserData | null {
  const key = `member_${normalizeEmail(email)}`;
  const saved = localStorage.getItem(key);
  const parsed = saved ? JSON.parse(saved) : null;
  if (!parsed) return null;
  // Migrate legacy users: single savingsBalance → per-currency
  if (!parsed.walletBalances || typeof parsed.walletBalances !== 'object') {
    parsed.walletBalances = {
      USD: (parsed as { walletBalance?: number; savingsBalance?: number }).walletBalance ?? (parsed as { savingsBalance?: number }).savingsBalance ?? 0,
      ZIG: 0,
      ZAR: 0,
    };
    saveUserData(parsed);
  }
  if (!parsed.approvedCreditByCurrency || typeof parsed.approvedCreditByCurrency !== "object") {
    parsed.approvedCreditByCurrency = {
      USD: parsed.approvedCreditWallet ?? 0,
      ZIG: 0,
      ZAR: 0,
    };
    saveUserData(parsed);
  }
  if (!parsed.activeLoanByCurrency || typeof parsed.activeLoanByCurrency !== "object") {
    parsed.activeLoanByCurrency = {
      USD: parsed.activeCredit ?? 0,
      ZIG: 0,
      ZAR: 0,
    };
    saveUserData(parsed);
  }
  let migrated = false;
  if (parsed.dateOfBirth === undefined) {
    parsed.dateOfBirth = '';
    migrated = true;
  }
  if (parsed.dateOfBirthLocked === undefined) {
    parsed.dateOfBirthLocked = false;
    migrated = true;
  }
  if (migrated) saveUserData(parsed);
  if (parsed.preferredLanguage === undefined || parsed.preferredLanguage === "") {
    parsed.preferredLanguage = "en";
    saveUserData(parsed);
  }
  if (!parsed.virtualDebitCards) {
    parsed.virtualDebitCards = [];
    saveUserData(parsed);
  }
  if (!parsed.userId) {
    parsed.userId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `00000000-0000-4000-8000-${Date.now().toString(16).slice(-12).padStart(12, "0")}`;
    saveUserData(parsed);
  }
  const trustNorm = normalizeStoredMemberTrust(parsed as UserData);
  if (trustNorm.changed) {
    Object.assign(parsed, trustNorm.user);
    saveUserData(parsed);
  }
  if (parsed.phoneVerified === undefined) {
    parsed.phoneVerified = true;
    saveUserData(parsed);
  }
  ensureMockWalletNumericIds(parsed);
  return parsed;
}

function getWalletBalance(user: MockUserData, currency: string): number {
  const c = (currency || 'USD').toUpperCase();
  return (user.walletBalances?.[c] ?? 0);
}

function getApprovedCreditForCurrency(user: MockUserData, currency: string): number {
  const c = (currency || "USD").toUpperCase();
  return user.approvedCreditByCurrency?.[c] ?? 0;
}

function getActiveLoanForCurrency(user: MockUserData, currency: string): number {
  const c = (currency || "USD").toUpperCase();
  return user.activeLoanByCurrency?.[c] ?? 0;
}

function setApprovedCreditForCurrency(user: MockUserData, currency: string, value: number): void {
  const c = currency.toUpperCase();
  if (!user.approvedCreditByCurrency) user.approvedCreditByCurrency = { USD: 0, ZIG: 0, ZAR: 0 };
  user.approvedCreditByCurrency[c] = value;
  user.approvedCreditWallet = user.approvedCreditByCurrency.USD ?? 0;
}

function setActiveLoanForCurrency(user: MockUserData, currency: string, value: number): void {
  const c = currency.toUpperCase();
  if (!user.activeLoanByCurrency) user.activeLoanByCurrency = { USD: 0, ZIG: 0, ZAR: 0 };
  user.activeLoanByCurrency[c] = value;
  user.activeCredit = user.activeLoanByCurrency.USD ?? 0;
}

function setWalletBalance(user: MockUserData, currency: string, amount: number): void {
  const c = (currency || 'USD').toUpperCase();
  if (!user.walletBalances) user.walletBalances = { USD: 0, ZIG: 0, ZAR: 0 };
  user.walletBalances[c] = amount;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Per-currency credit limit (mock) - aligns with active loan in that currency only */
export async function mockGetCreditLimitForCurrency(currency: string): Promise<{
  creditLimit: number;
  availableCredit: number;
  financialDisciplineScore: number;
}> {
  await delay(150);
  const email = localStorage.getItem("active_user_email");
  if (!email) throw new Error("Not authenticated");
  const user = loadUserData(email);
  if (!user) throw new Error("User not found");
  const limits: Record<string, number> = { student: 30, staff: 5000, alumni: 5000 };
  const max = limits[user.accountType] ?? 30;
  const c = (currency || "USD").toUpperCase();
  const outstanding = getActiveLoanForCurrency(user, c);
  const availableCredit = Math.max(0, max - outstanding);
  return {
    creditLimit: max,
    availableCredit,
    financialDisciplineScore: user.disciplineScore ?? 50,
  };
}

/** Pending 6-digit codes (mock “email send”) */
const EMAIL_VERIFY_KEY = (e: string) => `email_verify_${normalizeEmail(e)}`;
const PHONE_VERIFY_KEY = (e: string) => `finera_reg_phone_${normalizeEmail(e)}`;
/** Send a 6-digit code (stored locally; in production the backend emails it). */
export async function mockSendEmailVerificationCode(email: string): Promise<{ success: boolean; message: string }> {
  await delay(500);
  const normalized = normalizeEmail(email);
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = Date.now() + 10 * 60 * 1000;
  localStorage.setItem(EMAIL_VERIFY_KEY(normalized), JSON.stringify({ code, expiresAt }));
  if (typeof import.meta !== "undefined" && (import.meta as { env?: { DEV?: boolean } }).env?.DEV) {
    console.info(`[FinEra mock] Email verification code for ${normalized}: ${code}`);
  }
  return { success: true, message: "Verification code sent to your email." };
}

const PWD_OTP_KEY = (channel: "email" | "phone", id: string) =>
  `finera_pwd_otp_${channel}_${id.replace(/\s/g, "").toLowerCase()}`;

function phoneDigits(s: string): string {
  return s.replace(/\D/g, "");
}

function findMockUserByPhone(phone: string): MockUserData | null {
  const p = phoneDigits(phone);
  if (!p) return null;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k?.startsWith("member_")) continue;
    const raw = localStorage.getItem(k);
    if (!raw) continue;
    try {
      const u = JSON.parse(raw) as MockUserData;
      const num = phoneDigits(u.phoneNumber || u.mobile || "");
      if (!num) continue;
      if (num === p || (p.length >= 9 && num.endsWith(p)) || (num.length >= 9 && p.endsWith(num))) return u;
    } catch {
      /* ignore */
    }
  }
  return null;
}

export async function mockRequestPasswordReset(body: {
  channel: "email" | "phone";
  email?: string;
  phone?: string;
}): Promise<{ success: boolean; message: string }> {
  await delay(600);
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = Date.now() + 10 * 60 * 1000;

  if (body.channel === "email") {
    const id = normalizeEmail(body.email || "");
    if (!id) throw new Error("Email required");
    const user = loadUserData(id);
    if (!user) {
      return { success: true, message: "If an account exists, a reset code has been sent." };
    }
    localStorage.setItem(PWD_OTP_KEY("email", id), JSON.stringify({ code, expiresAt }));
    if (typeof import.meta !== "undefined" && (import.meta as { env?: { DEV?: boolean } }).env?.DEV) {
      console.info(`[FinEra mock] Password reset OTP emailed for ${id}: ${code}`);
    }
    return { success: true, message: "If an account exists, a reset code has been sent." };
  }

  const phone = (body.phone || "").trim();
  if (!phone) throw new Error("Phone required");
  const user = findMockUserByPhone(phone);
  if (!user?.email) {
    return { success: true, message: "If an account exists, a reset code has been sent." };
  }
  localStorage.setItem(PWD_OTP_KEY("phone", phone), JSON.stringify({ code, expiresAt, email: user.email }));
  if (typeof import.meta !== "undefined" && (import.meta as { env?: { DEV?: boolean } }).env?.DEV) {
    console.info(`[FinEra mock] Password reset OTP for phone ${phone} (account ${user.email}): ${code}`);
  }
  return { success: true, message: "If an account exists, a reset code has been sent." };
}

export async function mockVerifyPasswordResetOtp(body: {
  channel: "email" | "phone";
  email?: string;
  phone?: string;
  code: string;
}): Promise<{ resetSessionToken: string }> {
  await delay(500);
  const trimmed = body.code.trim();
  if (!/^\d{6}$/.test(trimmed)) throw new Error("Enter the 6-digit code.");

  if (body.channel === "email") {
    const id = normalizeEmail(body.email || "");
    const raw = localStorage.getItem(PWD_OTP_KEY("email", id));
    if (!raw) throw new Error("Invalid or expired code. Request a new one.");
    const { code, expiresAt } = JSON.parse(raw) as { code: string; expiresAt: number };
    if (Date.now() > expiresAt || code !== trimmed) throw new Error("Invalid or expired code.");
    localStorage.removeItem(PWD_OTP_KEY("email", id));
    const token = btoa(JSON.stringify({ t: "pwd", email: id, exp: Date.now() + 15 * 60 * 1000 }));
    return { resetSessionToken: token };
  }

  const phone = (body.phone || "").trim();
  const raw = localStorage.getItem(PWD_OTP_KEY("phone", phone));
  if (!raw) throw new Error("Invalid or expired code. Request a new one.");
  const parsed = JSON.parse(raw) as { code: string; expiresAt: number; email: string };
  if (Date.now() > parsed.expiresAt || parsed.code !== trimmed) throw new Error("Invalid or expired code.");
  localStorage.removeItem(PWD_OTP_KEY("phone", phone));
  const token = btoa(JSON.stringify({ t: "pwd", email: normalizeEmail(parsed.email), exp: Date.now() + 15 * 60 * 1000 }));
  return { resetSessionToken: token };
}

export async function mockCompletePasswordReset(body: {
  resetSessionToken: string;
  newPassword: string;
}): Promise<{ success: boolean; message: string }> {
  await delay(600);
  let payload: { t?: string; email?: string; exp?: number };
  try {
    payload = JSON.parse(atob(body.resetSessionToken)) as { t?: string; email?: string; exp?: number };
  } catch {
    throw new Error("Invalid or expired reset session. Start again.");
  }
  if (payload.t !== "pwd" || !payload.email || !payload.exp || Date.now() > payload.exp) {
    throw new Error("Invalid or expired reset session. Start again.");
  }
  const user = loadUserData(payload.email) as MockUserData | null;
  if (!user) throw new Error("User not found.");
  const nextHash = await hashPassword(body.newPassword);
  user._passwordHash = nextHash;
  saveUserData(user);
  return { success: true, message: "Password updated. You can sign in with your new password." };
}

/** POST /auth/verify-email (mock): verify OTP and issue session. Accepts any 6-digit code for local progress. */
export async function mockVerifyRegistrationEmail(
  email: string,
  code: string
): Promise<{ user: UserData; token: string; message: string; requiresPhoneVerification?: boolean }> {
  await delay(500);
  const normalized = normalizeEmail(email);
  const trimmed = code.trim();
  if (!/^\d{6}$/.test(trimmed)) {
    throw new Error("Enter a 6-digit code.");
  }

  const user = loadUserData(normalized) as MockUserData | null;
  if (!user) {
    throw new Error("User not found. Register again.");
  }
  if (user._pendingVerification === false) {
    throw new Error("Email already verified.");
  }

  localStorage.removeItem(EMAIL_VERIFY_KEY(normalized));
  user._pendingVerification = false;
  saveUserData(user);

  const token = "mock_jwt_token_" + Date.now();
  localStorage.setItem("auth_token", token);
  localStorage.setItem("accessToken", token);
  localStorage.setItem("refreshToken", "mock_refresh_" + Date.now());
  localStorage.setItem("active_user_email", normalized);

  const needsPhone = Boolean(user.phoneNumber?.trim()) && !user.phoneVerified;
  return {
    user: toPublicUser(user),
    token,
    message: "Email verified.",
    requiresPhoneVerification: needsPhone,
  };
}

/** POST /auth/verify-phone (mock) */
export async function mockVerifyPhone(
  email: string,
  code: string
): Promise<{ user: UserData; token: string; message: string }> {
  await delay(500);
  const normalized = normalizeEmail(email);
  const trimmed = code.trim();
  if (!/^\d{6}$/.test(trimmed)) {
    throw new Error("Enter a 6-digit code.");
  }
  const user = loadUserData(normalized) as MockUserData | null;
  if (!user) throw new Error("User not found. Register again.");
  if (user._pendingVerification) {
    throw new Error("Verify your email before your phone number.");
  }
  if (!user.phoneNumber?.trim()) {
    throw new Error("No phone number on this account.");
  }
  if (user.phoneVerified) {
    throw new Error("Phone number already verified.");
  }
  /* Any 6-digit code (aligns with email verify mock + backend OTP bypass for local testing). */
  user.phoneVerified = true;
  localStorage.removeItem(PHONE_VERIFY_KEY(normalized));
  saveUserData(user);
  const token = "mock_jwt_token_" + Date.now();
  localStorage.setItem("auth_token", token);
  localStorage.setItem("accessToken", token);
  localStorage.setItem("refreshToken", "mock_refresh_" + Date.now());
  localStorage.setItem("active_user_email", normalized);
  return { user: toPublicUser(user), token, message: "Phone number verified." };
}

export async function mockResendPhoneOtp(email: string): Promise<{ success: boolean; message: string }> {
  await delay(500);
  const normalized = normalizeEmail(email);
  const u = loadUserData(normalized) as MockUserData | null;
  if (!u || u._pendingVerification) {
    throw new Error("Verify your email first.");
  }
  if (!u.phoneNumber?.trim() || u.phoneVerified) {
    throw new Error("No phone verification required.");
  }
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = Date.now() + 10 * 60 * 1000;
  localStorage.setItem(PHONE_VERIFY_KEY(normalized), JSON.stringify({ code, expiresAt }));
  if (typeof import.meta !== "undefined" && (import.meta as { env?: { DEV?: boolean } }).env?.DEV) {
    console.info(`[FinEra mock] Phone verification code for ${normalized}: ${code}`);
  }
  return { success: true, message: "Verification code sent to your phone (mock: see console)." };
}

// ==================== MOCK API IMPLEMENTATIONS ====================

export async function mockRegister(data: RegisterRequest): Promise<{ user: UserData; message: string }> {
  await delay(800);
  const email = normalizeEmail(data.email);

  if (data.termsAccepted !== true || data.privacyPolicyAccepted !== true) {
    throw new Error("You must accept the Terms of Service and Privacy Policy to register.");
  }
  if (data.consentVersion !== FINERA_REGISTRATION_CONSENT_VERSION) {
    throw new Error("Consent version mismatch. Refresh the page and try again.");
  }

  const existing = loadUserData(email);
  if (existing) {
    if (existing.accountType !== data.accountType) {
      throw new Error(AUTH_MSG_EMAIL_ACCOUNT_IN_USE);
    }
    throw new Error(AUTH_MSG_SIGN_IN_INSTEAD);
  }

  const passwordHash = await hashPassword(data.password);
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = Date.now() + 10 * 60 * 1000;
  localStorage.setItem(EMAIL_VERIFY_KEY(email), JSON.stringify({ code, expiresAt }));
  if (typeof import.meta !== "undefined" && (import.meta as { env?: { DEV?: boolean } }).env?.DEV) {
    console.info(`[FinEra mock] Registration OTP for ${email}: ${code}`);
  }

  const hasPhone = Boolean(data.phoneNumber?.trim());
  const phoneRegCode = hasPhone ? String(Math.floor(100000 + Math.random() * 900000)) : null;
  if (phoneRegCode) {
    const phoneExpiresAt = Date.now() + 10 * 60 * 1000;
    localStorage.setItem(PHONE_VERIFY_KEY(email), JSON.stringify({ code: phoneRegCode, expiresAt: phoneExpiresAt }));
    if (typeof import.meta !== "undefined" && (import.meta as { env?: { DEV?: boolean } }).env?.DEV) {
      console.info(`[FinEra mock] Registration phone OTP for ${email}: ${phoneRegCode}`);
    }
  }

  const user: MockUserData = {
    userId:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `00000000-0000-4000-8000-${Date.now().toString(16).slice(-12).padStart(12, "0")}`,
    memberId: generateMemberId(),
    fullName: data.fullName,
    title: "",
    dateOfBirth: data.dateOfBirth,
    dateOfBirthLocked: false,
    phoneNumber: data.phoneNumber,
    phoneVerified: hasPhone ? false : true,
    accountNumber: generateAccountNumber(),
    nationalIdNumber: "",
    studentStaffId: "",
    salaryRange: null,
    email,
    mobile: data.phoneNumber,
    accountType: data.accountType,
    walletBalance: 0,
    approvedCreditWallet: 0,
    activeCredit: 0,
    availableCreditLimit: calculateCreditLimit(data.accountType),
    loanPrincipal: 0,
    transactions: [],
    disciplineScore: 50,
    creditScore: 50,
    loyaltyProgress: 0,
    missedPayments: 0,
    onTimePayments: 0,
    accountMode: data.accountMode === "demo" ? "demo" : "real",
    countryId: "zw",
    city: data.city || undefined,
    walletBalances: { USD: 0, ZIG: 0, ZAR: 0 },
    virtualDebitCards: [],
    _passwordHash: passwordHash,
    _pendingVerification: true,
    registrationConsentAt: new Date().toISOString(),
    registrationConsentVersion: data.consentVersion,
  };

  saveUserData(user);
  ensureMockWalletNumericIds(loadUserData(email)!);

  return {
    user: toPublicUser(user),
    message: hasPhone
      ? "Check your email and phone for verification codes (mock: see browser console)."
      : "Check your email for a verification code (mock: see browser console).",
  };
}

export async function mockCompleteProfile(data: CompleteProfilePayload): Promise<{ success: boolean; user: UserData }> {
  await delay(400);
  const rawEmail = localStorage.getItem("active_user_email");
  const email = rawEmail ? normalizeEmail(rawEmail) : "";
  const user = email ? loadUserData(email) : null;
  if (!user) throw new Error("Not authenticated");

  if (!isNationalIdValid(data.nationalIdNumber)) throw new Error(NATIONAL_ID_ERROR);
  const at = user.accountType;
  if (at === "student" && !isStudentIdValid(data.studentStaffId ?? "")) throw new Error(STUDENT_ID_ERROR);
  const addr = validateStructuredResidentialAddress(data.addressLine1, data.addressLine2);
  if (!addr.ok) throw new Error(addr.error);
  if ((at === "staff" || at === "alumni") && (!data.salaryRange || String(data.salaryRange).trim().length === 0)) {
    throw new Error("Income range is required");
  }

  user.nationalIdNumber = normalizeNationalIdForSubmit(data.nationalIdNumber);
  if (at === "student") {
    user.studentStaffId = extractStudentIdContent(data.studentStaffId ?? "");
  } else {
    user.studentStaffId = "";
  }
  user.title = data.title;
  if (at === "staff" || at === "alumni") {
    user.salaryRange = data.salaryRange ?? null;
  }
  saveUserData(user);
  return { success: true, user: toPublicUser(user) };
}

/**
 * Login: CORRECT 2-step flow (mirrors backend).
 * Step 1: Find user by email (secondary key)
 * Step 2: Compare password hash (never query password in same step)
 */
export async function mockLogin(data: LoginRequest): Promise<{ user: UserData; token: string }> {
  await delay(600);
  const email = normalizeEmail(data.email);

  // STEP 1: Fetch user by email only
  const user = loadUserData(email);
  if (!user) {
    throw new Error("User not found");
  }

  if (user.accountType.toUpperCase() !== data.accountType) {
    throw new Error(AUTH_MSG_EMAIL_ACCOUNT_IN_USE);
  }

  // STEP 2: Validate password (bcrypt-style: compare hash, not plaintext)
  const storedHash = (user as MockUserData)._passwordHash;
  if (storedHash) {
    const valid = await verifyPassword(data.password, storedHash);
    if (!valid) {
      throw new Error("Incorrect password");
    }
  }
  if ((user as MockUserData)._pendingVerification) {
    throw new Error("Please verify your email before signing in.");
  }
  if (user.phoneNumber?.trim() && user.phoneVerified === false) {
    throw new Error("Please verify your phone number. We sent a code to your number when you registered.");
  }
  // Legacy users without _passwordHash: allow login (migration path)

  const updatedUser = { ...user, lastLogin: Date.now() };
  saveUserData(updatedUser);

  const token = "mock_jwt_token_" + Date.now();
  localStorage.setItem("auth_token", token);
  localStorage.setItem("accessToken", token);
  localStorage.setItem("refreshToken", "mock_refresh_" + Date.now());

  return {
    user: toPublicUser(updatedUser),
    token,
  };
}

export async function mockVerifyOTP(data: OTPVerificationRequest): Promise<{ success: boolean; message: string }> {
  await mockVerifyRegistrationEmail(data.email, data.otp);
  return { success: true, message: "OTP verified successfully" };
}

export async function mockGetUserProfile(currency?: string): Promise<UserData> {
  await delay(300);

  const email = localStorage.getItem('active_user_email');
  if (!email) {
    throw new Error('Not authenticated');
  }

  const user = loadUserData(email);
  if (!user) {
    throw new Error('User not found');
  }

  // Per-currency: savings + loan + approved credit scoped to that currency only
  if (currency) {
    const c = currency.toUpperCase();
    const bal = getWalletBalance(user, c);
    return {
      ...user,
      walletBalance: bal,
      activeCredit: getActiveLoanForCurrency(user, c),
      approvedCreditWallet: getApprovedCreditForCurrency(user, c),
    };
  }
  return {
    ...user,
    walletBalance: getWalletBalance(user, "USD"),
    activeCredit: getActiveLoanForCurrency(user, "USD"),
    approvedCreditWallet: getApprovedCreditForCurrency(user, "USD"),
  };
}

export async function mockUpdateUserProfile(data: Partial<UserData>): Promise<Partial<UserData>> {
  await delay(500);
  
  const email = localStorage.getItem('active_user_email');
  if (!email) {
    throw new Error('Not authenticated');
  }

  const user = loadUserData(email);
  if (!user) {
    throw new Error('User not found');
  }

  const updatedUser = { ...user, ...data };
  if (data.preferredLanguage != null && data.preferredLanguage !== "")
    updatedUser.preferredLanguage = data.preferredLanguage;
  if (data.title !== undefined) updatedUser.title = data.title;
  if (data.city !== undefined) updatedUser.city = data.city;
  saveUserData(updatedUser);

  return updatedUser;
}

const DEMO_PEER_USER_ID = "00000000-0000-4000-8000-000000000001";

export async function mockGetPeerRecipient(input: string): Promise<PeerTransferRecipient> {
  await delay(400);
  const email = localStorage.getItem("active_user_email");
  if (!email) throw new Error("Not authenticated");
  const user = loadUserData(email);
  if (!user) throw new Error("User not found");

  const acc = input.trim();
  if (!/^\d{10}$/.test(acc)) {
    throw new Error("Enter the recipient's 10-digit Wallet ID (numbers only).");
  }

  ensureMockWalletNumericIds(user);
  const own = user.walletNumericIds ?? {};
  for (const v of Object.values(own)) {
    if (v === acc) throw new Error("You cannot transfer to your own wallet");
  }

  const match = findPeerByWalletNumericId(acc, email);
  if (!match) {
    throw new Error("Wallet ID not found. Ask the recipient for their 10-digit Wallet ID.");
  }

  const parts = (match.peer.fullName || "M").trim().split(/\s+/);
  const hint =
    parts.length <= 1
      ? `${parts[0]?.slice(0, 1) ?? "?"}.`
      : `${parts[0]!.slice(0, 1)}. ${parts[parts.length - 1]!.slice(0, 3)}***`;

  return {
    userId: match.peer.userId ?? DEMO_PEER_USER_ID,
    currencyCode: match.currencyCode,
    displayNameHint: hint,
    walletLabel: getWalletLabel(match.currencyCode),
  };
}

export async function mockPeerTransfer(params: {
  toUserId: string;
  amount: number;
  currency: string;
  referenceId?: string;
}): Promise<{ transactionId: string; reference: string; fromNewBalance: number; currency: string }> {
  await delay(800);
  const email = localStorage.getItem("active_user_email");
  if (!email) throw new Error("Not authenticated");
  const user = loadUserData(email);
  if (!user) throw new Error("User not found");

  const currency = (params.currency || "USD").toUpperCase();
  const bal = getWalletBalance(user, currency);
  if (params.amount <= 0 || params.amount > bal) {
    throw new Error("Invalid amount or insufficient balance");
  }

  const newBal = bal - params.amount;
  setWalletBalance(user, currency, newBal);

  const txn: Transaction & { currency?: string } = {
    id: "TXN" + Date.now(),
    type: "transfer",
    amount: params.amount,
    date: new Date().toISOString(),
    description: `Send to member (${params.referenceId || "peer"})`,
    status: "completed",
    currency,
  };
  user.transactions = [...(user.transactions || []), txn as Transaction];
  saveUserData(user);

  return {
    transactionId: txn.id,
    reference: `P2P-${Date.now().toString(36).toUpperCase()}`,
    fromNewBalance: newBal,
    currency,
  };
}

export async function mockDepositFunds(data: DepositRequest): Promise<{ transaction: Transaction; newBalance: number }> {
  await delay(1000);
  
  const email = localStorage.getItem('active_user_email');
  if (!email) {
    throw new Error('Not authenticated');
  }

  const user = loadUserData(email);
  if (!user) {
    throw new Error('User not found');
  }

  const meta = data.debitCardMeta;
  if (meta?.kind === "virtual" && meta.virtualCardId) {
    const cards = user.virtualDebitCards ?? [];
    const card = cards.find((x) => x.id === meta.virtualCardId);
    if (!card || card.blocked) throw new Error("Select an active virtual Mastercard.");
  }
  if (meta?.kind === "physical" && !user.physicalMastercardLast4?.trim()) {
    throw new Error("Register your physical Mastercard (last 4 digits) before using it for Cash In.");
  }

  const currency = (data.currency || 'USD').toUpperCase();
  const prevBal = getWalletBalance(user, currency);
  const newBal = prevBal + data.amount;
  setWalletBalance(user, currency, newBal);

  let debitNote = "";
  if (data.method === "debit_card_virtual" && meta?.virtualCardId) {
    const card = (user.virtualDebitCards ?? []).find((x) => x.id === meta.virtualCardId);
    debitNote = card ? ` · ${card.maskedPan}` : " · Virtual Mastercard";
  } else if (data.method === "debit_card_physical") {
    debitNote = ` · Physical Mastercard ****${user.physicalMastercardLast4 ?? "????"}`;
  }

  const transaction: Transaction & { currency?: string } = {
    id: 'TXN' + Date.now(),
    type: 'deposit',
    amount: data.amount,
    date: new Date().toISOString(),
    description: `Deposit via ${data.method} - ${data.purpose}${debitNote}`,
    status: 'completed',
  };
  (transaction as { currency?: string }).currency = currency;
  user.transactions.push(transaction as Transaction);
  saveUserData(user);

  return {
    transaction: transaction as Transaction,
    newBalance: newBal,
  };
}

export async function mockWithdrawFunds(data: WithdrawalRequest): Promise<{ transaction: Transaction; newBalance: number }> {
  await delay(1000);
  
  const email = localStorage.getItem('active_user_email');
  if (!email) {
    throw new Error('Not authenticated');
  }

  const user = loadUserData(email);
  if (!user) {
    throw new Error('User not found');
  }

  const wmeta = data.debitCardMeta;
  if (wmeta?.kind === "virtual" && wmeta.virtualCardId) {
    const cards = user.virtualDebitCards ?? [];
    const card = cards.find((x) => x.id === wmeta.virtualCardId);
    if (!card || card.blocked) throw new Error("Select an active virtual Mastercard.");
  }
  if (wmeta?.kind === "physical" && !user.physicalMastercardLast4?.trim()) {
    throw new Error("Register your physical Mastercard before Cash Out to card.");
  }

  const currency = (data.currency || 'USD').toUpperCase();
  const currBal = getWalletBalance(user, currency);
  const availableBalance = user.activeCredit > 0 ? currBal * 0.8 : currBal;
  if (data.amount > availableBalance) {
    throw new Error('Insufficient available balance');
  }

  const newBal = currBal - data.amount;
  setWalletBalance(user, currency, newBal);

  let wDebit = "";
  if (data.method === "debit_card_virtual" && wmeta?.virtualCardId) {
    const card = (user.virtualDebitCards ?? []).find((x) => x.id === wmeta.virtualCardId);
    wDebit = card ? ` · ${card.maskedPan}` : " · Virtual Mastercard";
  } else if (data.method === "debit_card_physical") {
    wDebit = ` · Physical ****${user.physicalMastercardLast4 ?? "????"}`;
  }

  const transaction: Transaction & { currency?: string } = {
    id: 'TXN' + Date.now(),
    type: 'withdrawal',
    amount: data.amount,
    date: new Date().toISOString(),
    description: `Withdrawal via ${data.method}${wDebit}`,
    status: 'completed',
  };
  (transaction as { currency?: string }).currency = currency;
  user.transactions.push(transaction as Transaction);
  saveUserData(user);

  return {
    transaction: transaction as Transaction,
    newBalance: newBal,
  };
}

export async function mockTransferCreditToSavings(amount: number, currency: string = 'USD'): Promise<{
  approvedCreditWallet: number;
  balance: number;
  fee: number;
  netCredited: number;
  transaction: Transaction;
  currency: string;
  walletLabel: string;
}> {
  await delay(800);
  
  const email = localStorage.getItem('active_user_email');
  if (!email) {
    throw new Error('Not authenticated');
  }

  const user = loadUserData(email);
  if (!user) {
    throw new Error('User not found');
  }

  const c = (currency || 'USD').toUpperCase();
  const approved = getApprovedCreditForCurrency(user, c);
  if (amount > approved) {
    throw new Error('Insufficient funds in Approved Credit Wallet');
  }

  const fee = Math.round(amount * 0.015 * 100) / 100;
  const net = Math.round((amount - fee) * 100) / 100;

  const prevBal = getWalletBalance(user, c);
  const newBal = prevBal + net;
  setWalletBalance(user, c, newBal);
  setApprovedCreditForCurrency(user, c, approved - amount);

  const transaction: Transaction & { currency?: string } = {
    id: 'TXN' + Date.now(),
    type: 'deposit',
    amount: net,
    date: new Date().toISOString(),
    description: `Transfer from Approved Credit to FINERA wallet (1.5% commission ${fee.toFixed(2)} ${c})`,
    status: 'completed',
  };
  (transaction as { currency?: string }).currency = c;
  user.transactions.push(transaction as Transaction);
  saveUserData(user);

  return {
    approvedCreditWallet: getApprovedCreditForCurrency(user, c),
    balance: newBal,
    fee,
    netCredited: net,
    transaction: transaction as Transaction,
    currency: c,
    walletLabel: getWalletLabel(c),
  };
}

type WalletResponse = {
  id: string;
  currencyCode: string;
  accountNumber: string;
  walletNumericId: string;
  balance: number;
  walletLabel: string;
  approvedCreditBalance: number;
  activeLoanBalance: number;
};

export async function mockGetWalletsByCurrency(currency?: string): Promise<WalletResponse[]> {
  await delay(200);
  const email = localStorage.getItem('active_user_email');
  if (!email) return [];
  const user = loadUserData(email);
  if (!user) return [];
  const fe = (user as UserData).finEraAccountNumbers;
  const baseAccount = user.accountNumber || '';
  const accounts: Record<string, string> = fe ? { usd: fe.usd, zig: fe.zig, zar: fe.zar } : { usd: baseAccount, zig: baseAccount, zar: baseAccount };
  ensureMockWalletNumericIds(user);
  const u2 = loadUserData(email) ?? user;
  const numeric = u2.walletNumericIds ?? {};
  // Scalable: return all supported currencies when no filter (USD, ZiG, ZAR, etc.)
  const currencies = currency ? [currency.toUpperCase()] : ['USD', 'ZIG', 'ZAR'];
  return currencies.map((c) => {
    const bal = getWalletBalance(user, c);
    const key = c === 'ZIG' ? 'zig' : c === 'ZAR' ? 'zar' : 'usd';
    return {
      id: `finera-${c.toLowerCase()}`,
      currencyCode: c,
      accountNumber: accounts[key] || `FE-${c}-${baseAccount.slice(-6)}`,
      walletNumericId: numeric[c] ?? "",
      balance: bal,
      walletLabel: getWalletLabel(c),
      approvedCreditBalance: getApprovedCreditForCurrency(user, c),
      activeLoanBalance: getActiveLoanForCurrency(user, c),
    };
  });
}

export async function mockGetTransactionsByCurrency(currency: string): Promise<Transaction[]> {
  await delay(200);
  const email = localStorage.getItem('active_user_email');
  if (!email) return [];
  const user = loadUserData(email);
  if (!user) return [];
  const list = user.transactions ?? [];
  const c = (currency || 'USD').toUpperCase();
  return list.filter((t) => ((t as Transaction & { currency?: string }).currency ?? 'USD') === c);
}

export async function mockApplyCreditApplication(data: CreditApplication): Promise<{
  applicationId: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedAmount?: number;
  totalCredit?: number;
  message: string;
}> {
  await delay(2000); // Simulate processing
  
  const email = localStorage.getItem('active_user_email');
  if (!email) {
    throw new Error('Not authenticated');
  }

  const user = loadUserData(email);
  if (!user) {
    throw new Error('User not found');
  }

  const creditCurrency = (data.currency || 'USD').toUpperCase();

  if (getActiveLoanForCurrency(user, creditCurrency) > 0) {
    return {
      applicationId: 'APP' + Date.now(),
      status: 'rejected',
      message: 'You already have an active loan in this currency',
    };
  }

  const totalCredit = calculateActiveCredit(data.amount);

  // Auto-approve for mock
  const transaction: Transaction & { currency?: string } = {
    id: 'TXN' + Date.now(),
    type: 'loan',
    amount: data.amount,
    date: new Date().toISOString(),
    description: `${data.creditType} loan approved (${creditCurrency})`,
    status: 'completed',
    currency: creditCurrency,
  };

  const prevApproved = getApprovedCreditForCurrency(user, creditCurrency);
  const prevLoan = getActiveLoanForCurrency(user, creditCurrency);
  setApprovedCreditForCurrency(user, creditCurrency, prevApproved + data.amount);
  setActiveLoanForCurrency(user, creditCurrency, prevLoan + totalCredit);
  user.loanPrincipal = data.amount;
  user.transactions.push(transaction as Transaction);
  saveUserData(user);

  return {
    applicationId: 'APP' + Date.now(),
    status: 'approved',
    approvedAmount: data.amount,
    totalCredit,
    message: 'Loan approved successfully',
  };
}

export async function mockMakeRepayment(data: RepaymentRequest): Promise<{
  transaction: Transaction;
  remainingBalance: number;
  loanFullyPaid: boolean;
  updatedScores: {
    disciplineScore: number;
    creditScore: number;
  };
}> {
  await delay(1200);
  
  const email = localStorage.getItem('active_user_email');
  if (!email) {
    throw new Error('Not authenticated');
  }

  const user = loadUserData(email);
  if (!user) {
    throw new Error('User not found');
  }

  if (!data.currency?.trim()) {
    throw new Error('Currency is required for repayment');
  }
  const c = data.currency.trim().toUpperCase();
  const outstanding = getActiveLoanForCurrency(user, c);
  if (data.amount > outstanding) {
    throw new Error('Repayment amount exceeds outstanding balance');
  }

  if (data.method === 'savings') {
    const sb = getWalletBalance(user, c);
    if (data.amount > sb) {
      throw new Error('Insufficient savings balance');
    }
    setWalletBalance(user, c, sb - data.amount);
  }

  const transaction: Transaction & { currency?: string } = {
    id: 'TXN' + Date.now(),
    type: 'repayment',
    amount: data.amount,
    date: new Date().toISOString(),
    description: `Repayment via ${data.method} (${c})`,
    status: 'completed',
    currency: c,
  };

  const newOutstanding = Math.max(0, outstanding - data.amount);
  setActiveLoanForCurrency(user, c, newOutstanding);
  user.onTimePayments += 1;

  const loanFullyPaid = newOutstanding <= 0;

  if (loanFullyPaid) {
    user.loanPrincipal = 0;
    user.loyaltyProgress += 1;
    user.disciplineScore = Math.min(100, user.disciplineScore + 5);
    user.creditScore = Math.min(100, user.creditScore + 3);
  } else {
    user.disciplineScore = Math.min(100, user.disciplineScore + 1);
    user.creditScore = Math.min(100, user.creditScore + 1);
  }

  user.transactions.push(transaction as Transaction);
  saveUserData(user);

  return {
    transaction: transaction as Transaction,
    remainingBalance: newOutstanding,
    loanFullyPaid,
    updatedScores: {
      disciplineScore: user.disciplineScore,
      creditScore: user.creditScore,
    },
  };
}

export async function mockGetRepaymentSchedule(): Promise<{
  totalAmount: number;
  amountPaid: number;
  remainingBalance: number;
  monthlyInstallment: number;
  nextDueDate: string;
  schedule: Array<{
    dueDate: string;
    amount: number;
    status: 'paid' | 'pending' | 'overdue';
  }>;
}> {
  await delay(500);
  
  const email = localStorage.getItem('active_user_email');
  if (!email) {
    throw new Error('Not authenticated');
  }

  const user = loadUserData(email);
  if (!user) {
    throw new Error('User not found');
  }

  const totalAmount = user.activeCredit;
  const monthlyInstallment = totalAmount / 6; // 6-month repayment cycle
  const amountPaid = 0; // Mock data

  const schedule = Array.from({ length: 6 }, (_, i) => {
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + i + 1);
    return {
      dueDate: dueDate.toISOString(),
      amount: monthlyInstallment,
      status: 'pending' as const,
    };
  });

  return {
    totalAmount,
    amountPaid,
    remainingBalance: user.activeCredit,
    monthlyInstallment,
    nextDueDate: schedule[0].dueDate,
    schedule,
  };
}

export async function mockGetFinancialMetrics(): Promise<{
  disciplineScore: number;
  creditScore: number;
  loyaltyProgress: number;
  missedPayments: number;
  onTimePayments: number;
  creditTier: string;
  sfisTier: string;
}> {
  await delay(300);
  
  const email = localStorage.getItem('active_user_email');
  if (!email) {
    throw new Error('Not authenticated');
  }

  const user = loadUserData(email);
  if (!user) {
    throw new Error('User not found');
  }

  let creditTier = 'Standard';
  if (user.creditScore >= 85) creditTier = 'Elite';
  else if (user.creditScore >= 70) creditTier = 'Growth';
  else if (user.creditScore >= 50) creditTier = 'Standard';
  else if (user.creditScore >= 30) creditTier = 'Watch';
  else creditTier = 'Restricted';

  let sfisTier = 'Fair';
  if (user.creditScore >= 85) sfisTier = 'Excellent';
  else if (user.creditScore >= 70) sfisTier = 'Good';
  else if (user.creditScore >= 50) sfisTier = 'Fair';
  else if (user.creditScore >= 30) sfisTier = 'Building';
  else sfisTier = 'Restricted';

  return {
    disciplineScore: user.disciplineScore,
    creditScore: user.creditScore,
    loyaltyProgress: user.loyaltyProgress,
    missedPayments: user.missedPayments,
    onTimePayments: user.onTimePayments,
    creditTier,
    sfisTier,
  };
}

const MOCK_NOTIF_KEY = 'finera_mock_in_app_notifications_v2';

function seedMockNotifications(): NotificationItem[] {
  const now = new Date();
  return [
    {
      id: 'mock-n1',
      type: 'TRANSACTION',
      priority: 'MEDIUM',
      title: 'Cash in confirmed',
      message: 'Your deposit was credited to your FINERA wallet. Funds are available for use.',
      isRead: false,
      createdAt: new Date(now.getTime() - 3600000).toISOString(),
      actionUrl: null,
    },
    {
      id: 'mock-n2',
      type: 'LOAN_REMINDER',
      priority: 'HIGH',
      title: 'Repayment reminder',
      message: 'Your next loan instalment is due soon. Pay on time to protect your discipline score.',
      isRead: false,
      createdAt: new Date(now.getTime() - 86400000 * 2).toISOString(),
      actionUrl: 'app:repaymentDashboard',
    },
    {
      id: 'mock-n3',
      type: 'SYSTEM_ALERT',
      priority: 'MEDIUM',
      title: 'Security tip',
      message: 'Never share your OTP or FinEra credentials. We will never ask for your password by phone.',
      isRead: true,
      readAt: new Date(now.getTime() - 86400000 * 3).toISOString(),
      createdAt: new Date(now.getTime() - 86400000 * 4).toISOString(),
      actionUrl: null,
    },
  ];
}

function loadMockNotifications(): NotificationItem[] {
  try {
    const raw = localStorage.getItem(MOCK_NOTIF_KEY);
    if (!raw) {
      const seeded = seedMockNotifications();
      localStorage.setItem(MOCK_NOTIF_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as NotificationItem[];
    return Array.isArray(parsed) ? parsed : seedMockNotifications();
  } catch {
    return seedMockNotifications();
  }
}

function saveMockNotifications(list: NotificationItem[]) {
  localStorage.setItem(MOCK_NOTIF_KEY, JSON.stringify(list));
}

export async function mockGetNotifications(): Promise<{
  success: boolean;
  data?: NotificationListPayload;
  message?: string;
}> {
  await delay(220);
  const notifications = loadMockNotifications();
  return {
    success: true,
    data: {
      notifications,
      pagination: {
        page: 1,
        limit: 50,
        total: notifications.length,
        totalPages: 1,
      },
    },
  };
}

export async function mockMarkNotificationRead(id: string): Promise<{ success: boolean; message?: string }> {
  await delay(120);
  const list = loadMockNotifications();
  const idx = list.findIndex((n) => n.id === id);
  if (idx === -1) return { success: false, message: 'Notification not found' };
  const now = new Date().toISOString();
  list[idx] = { ...list[idx], isRead: true, readAt: now };
  saveMockNotifications(list);
  return { success: true, message: 'Marked as read' };
}

export async function mockMarkAllNotificationsRead(): Promise<{ success: boolean; message?: string }> {
  await delay(180);
  const list = loadMockNotifications().map((n) => ({
    ...n,
    isRead: true,
    readAt: n.readAt ?? new Date().toISOString(),
  }));
  saveMockNotifications(list);
  return { success: true, message: 'All marked as read' };
}

export async function mockGetAdminOverview(): Promise<{
  totalCapital: number;
  activeCreditPortfolio: number;
  repaymentRate: number;
  totalUsers: number;
  usersByType: {
    student: number;
    staff: number;
    alumni: number;
  };
  defaultRate: number;
}> {
  await delay(600);
  
  // Mock data for admin overview
  return {
    totalCapital: 2500000,
    activeCreditPortfolio: 1875000,
    repaymentRate: 94.5,
    totalUsers: 2200,
    usersByType: {
      student: 1500,
      staff: 450,
      alumni: 250,
    },
    defaultRate: 2.3,
  };
}
