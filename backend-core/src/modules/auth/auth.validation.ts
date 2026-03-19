/**
 * FinEra Backend - Auth Validation Schemas
 */

import { z } from "zod";

const PASSWORD_MIN = 8;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

export const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters`)
    .regex(PASSWORD_REGEX, "Password must include uppercase, lowercase, number, and special character"),
  fullName: z.string().min(2, "Full name required").max(100),
  accountType: z.enum(["STUDENT", "STAFF", "ALUMNI"]),
  country: z.string().length(2, "Country must be ISO 2-letter code"),
  city: z.string().max(100).optional(),
  institution: z.string().max(200).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password required"),
  deviceId: z.string().optional(),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
