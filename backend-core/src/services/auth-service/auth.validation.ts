/**
 * FinEra Backend - Auth Validation Schemas
 */

import { z } from "zod";
import {
  countryCodeSchema,
  dateIsoSchema,
  emailSchema,
  fullNameSchema,
  optionalCitySchema,
  optionalInstitutionSchema,
  phoneNumberSchema,
} from "../../shared/validation/zod-schemas.js";

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
    country: countryCodeSchema,
    city: optionalCitySchema,
    institution: optionalInstitutionSchema,
    dateOfBirth: dateIsoSchema,
    phoneNumber: phoneNumberSchema,
    /** Optional: practice (demo) vs live account - persisted in User.metadata */
    accountMode: z.enum(["real", "demo"]).optional(),
  })
  .strict();

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

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
