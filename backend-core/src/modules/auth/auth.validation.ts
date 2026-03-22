/**
 * FinEra Backend - Auth Validation Schemas
 *
 * Rules:
 * - Email: validated format, normalized (lowercase, trim) before DB
 * - Password: min 8 chars, complexity (upper, lower, number, special)
 * - Password belongs to USER (user_id), never to email
 */

import { z } from "zod";

const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, "Email required")
      .email("Invalid email format")
      .max(255)
      .transform((v) => v.trim().toLowerCase()),
    password: z
      .string()
      .min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters`)
      .max(PASSWORD_MAX, `Password must not exceed ${PASSWORD_MAX} characters`)
      .regex(PASSWORD_REGEX, "Password must include uppercase, lowercase, number, and special character (@$!%*?&)"),
    fullName: z.string().min(2, "Full name required").max(100).transform((v) => v.trim()),
    accountType: z.enum(["STUDENT", "STAFF", "ALUMNI"]),
    country: z.string().length(2, "Country must be ISO 2-letter code"),
    city: z.string().max(100).optional().transform((v) => v?.trim()),
    institution: z.string().max(200).optional().transform((v) => v?.trim()),
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
