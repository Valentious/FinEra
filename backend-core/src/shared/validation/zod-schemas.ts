/**
 * Reusable Zod schemas aligned with FinEra data-integrity rules.
 */

import { z } from "zod";
import {
  CITY_NAME_REGEX,
  COUNTRY_CODE_REGEX,
  PERSON_NAME_REGEX,
  formatCityName,
  normalizePhone,
  toTitleCaseWords,
} from "./rules.js";

export const emailSchema = z
  .string()
  .min(1, "Invalid email address")
  .email("Invalid email address")
  .max(255)
  .transform((v) => v.trim().toLowerCase());

export const fullNameSchema = z
  .string()
  .min(2, "Full name must contain letters only")
  .max(100)
  .transform((v) => toTitleCaseWords(v))
  .refine((v) => PERSON_NAME_REGEX.test(v), {
    message: "Full name must contain letters only",
  });

/** Optional city: letters and spaces only when non-empty. */
export const optionalCitySchema = z
  .preprocess((val) => {
    if (val === null || val === undefined || val === "") return undefined;
    const s = String(val).trim();
    return s === "" ? undefined : s;
  }, z.union([z.undefined(), z.string().max(100)]))
  .transform((v) => (v === undefined ? undefined : formatCityName(v)))
  .refine((v) => v === undefined || CITY_NAME_REGEX.test(v), {
    message: "City must contain letters only",
  });

export const countryCodeSchema = z
  .string()
  .length(2, "Country must be a 2-letter code")
  .regex(COUNTRY_CODE_REGEX, "Country must be a 2-letter code")
  .transform((v) => v.trim().toUpperCase());

/** Optional institution: letters, digits, spaces, common punctuation. */
export const optionalInstitutionSchema = z
  .preprocess((val) => {
    if (val === null || val === undefined || val === "") return undefined;
    const s = String(val).trim();
    return s === "" ? undefined : s;
  }, z.union([z.undefined(), z.string().max(200)]))
  .refine((v) => v === undefined || /^[\w\s&'.,\-]+$/.test(v), {
    message: "Institution contains invalid characters",
  });

export const phoneNumberSchema = z
  .string()
  .min(1, "Phone number must contain digits only")
  .transform((v) => v.trim())
  .refine((v) => normalizePhone(v) !== null, {
    message: "Phone number must be 10–15 digits (include country code, e.g. +263…)",
  })
  .transform((v) => normalizePhone(v)!.e164);

export const dateIsoSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");

export const trustScoreSchema = z
  .number()
  .int("Trust score must be a whole number")
  .min(0, "Trust score must be between 0 and 100")
  .max(100, "Trust score must be between 0 and 100");

export const loanPrincipalSchema = z
  .number()
  .positive("Loan amount must be greater than 0")
  .refine((n) => Number.isFinite(n), { message: "Loan amount must be a valid number" });
