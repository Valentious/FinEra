/**
 * FinEra Backend - Auth Validation Schemas
 */

import { z } from "zod";

const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,128}$/;

const emailField = z
  .string()
  .min(1, "Email required")
  .email("Invalid email format")
  .max(255)
  .transform((v) => v.trim().toLowerCase());

export const verifyEmailSchema = z
  .object({
    email: emailField,
    code: z.string().length(6).regex(/^\d{6}$/, "Enter the 6-digit code"),
  })
  .strict();

export const resendOtpSchema = z
  .object({
    email: emailField,
  })
  .strict();

export const registerSchema = z
  .object({
    email: emailField,
    password: z
      .string()
      .min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters`)
      .max(PASSWORD_MAX, `Password must not exceed ${PASSWORD_MAX} characters`)
      .regex(
        PASSWORD_REGEX,
        "Password must include uppercase, lowercase, a number, and a symbol"
      ),
    fullName: z.string().min(2, "Full name required").max(100).transform((v) => v.trim()),
    accountType: z.enum(["STUDENT", "STAFF", "ALUMNI"]),
    country: z.string().length(2, "Country must be ISO 2-letter code"),
    city: z.string().max(100).optional().transform((v) => v?.trim()),
    institution: z.string().max(200).optional().transform((v) => v?.trim()),
    dateOfBirth: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be YYYY-MM-DD"),
    phoneNumber: z.string().min(5, "Phone number required").max(32).transform((v) => v.trim()),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.string().min(1, "Email required").email("Invalid email format").transform((v) => v.trim().toLowerCase()),
    password: z.string().min(1, "Password required"),
    deviceId: z.string().optional(),
  })
  .strict();

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
