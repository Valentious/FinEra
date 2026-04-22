/**
 * FinEra Backend - Auth Validation Schemas
 */

import { z } from "zod";
import {
  dateIsoSchema,
  emailSchema,
  fullNameSchema,
  phoneNumberSchema,
} from "../../shared/validation/zod-schemas.js";
import {
  ZW_REGISTRATION_CITY_NAMES,
  getZimbabweRegistrationInstitutionNames,
} from "../user-service/reference.data.js";
import { FINERA_REGISTRATION_CONSENT_VERSION } from "../../shared/legal/consent-version.js";

const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,128}$/;

export const verifyEmailSchema = z
  .object({
    email: emailSchema,
    code: z.string().length(6).regex(/^\d{6}$/, "Enter the 6-digit code"),
  })
  .strict();

export const resendOtpSchema = z
  .object({
    email: emailSchema,
  })
  .strict();

export const registerSchema = z
  .object({
    email: emailSchema,
    password: z
      .string()
      .min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters`)
      .max(PASSWORD_MAX, `Password must not exceed ${PASSWORD_MAX} characters`)
      .regex(
        PASSWORD_REGEX,
        "Password must include uppercase, lowercase, a number, and a symbol"
      ),
    fullName: fullNameSchema,
    accountType: z.enum(["STUDENT", "STAFF", "ALUMNI"]),
    /** Onboarding is Zimbabwe-only; API accepts only ZW. */
    country: z.literal("ZW"),
    city: z
      .string()
      .min(1, "City is required")
      .refine((v) => (ZW_REGISTRATION_CITY_NAMES as readonly string[]).includes(v), {
        message: "City must be a supported Zimbabwe location",
      }),
    institution: z
      .string()
      .min(1, "Institution is required")
      .max(200, "Institution name is too long"),
    dateOfBirth: dateIsoSchema,
    phoneNumber: phoneNumberSchema,
    /** Optional: practice explore mode (stored as `demo`) vs live account - persisted in User.metadata */
    accountMode: z.enum(["real", "demo"]).optional(),
    /** Legal consent — both required; must be literal `true` (not coerced strings). */
    termsAccepted: z.literal(true, {
      errorMap: () => ({ message: "You must accept the Terms of Service to register" }),
    }),
    privacyPolicyAccepted: z.literal(true, {
      errorMap: () => ({ message: "You must accept the Privacy Policy to register" }),
    }),
    /** Must match server-issued document bundle version. */
    consentVersion: z.literal(FINERA_REGISTRATION_CONSENT_VERSION, {
      errorMap: () => ({
        message: "Consent version is outdated or invalid. Refresh the page and try again.",
      }),
    }),
  })
  .strict()
  .superRefine((data, ctx) => {
    const inst = data.institution.trim();
    if (data.accountType === "STUDENT") {
      const allowed = getZimbabweRegistrationInstitutionNames("STUDENT");
      if (!allowed.includes(inst)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Institution must be selected from the Zimbabwe onboarding list",
          path: ["institution"],
        });
      }
    } else {
      /** Professional (STAFF) and Business (ALUMNI): free-text organisation / employer name. */
      if (inst.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter your institution or organisation name (at least 2 characters)",
          path: ["institution"],
        });
      }
    }
  })
  .transform((data) => ({
    ...data,
    institution: data.institution.trim(),
  }));

export const loginSchema = z
  .object({
    email: z
      .string()
      .min(1, "Invalid email address")
      .email("Invalid email address")
      .transform((v) => v.trim().toLowerCase()),
    password: z.string().min(1, "Password required"),
    deviceId: z.string().optional(),
  })
  .strict();

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token required"),
});

const passwordResetChannelRefine = (
  data: { channel: "email" | "phone"; email?: string; phone?: string },
  ctx: z.RefinementCtx
) => {
  if (data.channel === "email") {
    const e = data.email?.trim() ?? "";
    if (!e) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Email is required", path: ["email"] });
    }
  } else {
    const p = data.phone?.trim() ?? "";
    if (!p) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Phone number is required", path: ["phone"] });
    }
  }
};

export const passwordResetRequestSchema = z
  .object({
    channel: z.enum(["email", "phone"]),
    email: z.string().optional(),
    phone: z.string().optional(),
  })
  .strict()
  .superRefine(passwordResetChannelRefine);

export const passwordResetVerifySchema = z
  .object({
    channel: z.enum(["email", "phone"]),
    email: z.string().optional(),
    phone: z.string().optional(),
    code: z
      .string()
      .min(1, "Code is required")
      .refine((v) => /^\d{6}$/.test(v.trim()), "Enter the 6-digit code"),
  })
  .strict()
  .superRefine(passwordResetChannelRefine);

export const passwordResetCompleteSchema = z
  .object({
    resetSessionToken: z.string().min(1, "Reset session is required"),
    newPassword: z
      .string()
      .min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters`)
      .max(PASSWORD_MAX, `Password must not exceed ${PASSWORD_MAX} characters`)
      .regex(
        PASSWORD_REGEX,
        "Password must include uppercase, lowercase, a number, and a symbol"
      ),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
