/**
 * User profile update - server-side validation (FinEra data-integrity rules).
 */
import { z } from "zod";
import type { AccountType } from "@prisma/client";
import {
  fullNameSchema,
  optionalCitySchema,
  phoneNumberSchema,
} from "../../shared/validation/zod-schemas.js";
import {
  extractStaffEmployerIdContent,
  extractStudentIdContent,
  isNationalIdValid,
  isStaffEmployerIdValid,
  isStudentIdValid,
  normalizeNationalIdForSubmit,
  NATIONAL_ID_ERROR,
  STAFF_EMPLOYER_ID_ERROR,
  STUDENT_ID_ERROR,
  validateStructuredResidentialAddress,
} from "../../shared/validation/kyc-identity-formats.js";

const MIN_AGE = 18;
const MAX_AGE = 100;

function ageFromIso(dob: string): number {
  const birth = new Date(`${dob}T12:00:00`);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

const optionalFullName = z.preprocess(
  (val) => (val === null || val === undefined || val === "" ? undefined : String(val)),
  z.union([z.undefined(), fullNameSchema])
);

const optionalPhone = z.preprocess(
  (val) => (val === null || val === undefined || val === "" ? undefined : String(val)),
  z.union([z.undefined(), phoneNumberSchema])
);

const LANGUAGE_CODES = ["en", "es", "fr", "pt", "sw", "sn", "nd", "af"] as const;

export const updateProfileSchema = z
  .object({
    fullName: optionalFullName,
    phoneNumber: optionalPhone,
    city: optionalCitySchema,
    dateOfBirth: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
      .optional(),
    title: z
      .string()
      .max(32)
      .optional()
      .transform((s) => (s === "" ? undefined : s)),
    preferredLanguage: z.enum(LANGUAGE_CODES).optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.dateOfBirth) {
      const d = data.dateOfBirth;
      const birth = new Date(`${d}T12:00:00`);
      if (Number.isNaN(birth.getTime())) {
        ctx.addIssue({ code: "custom", message: "Invalid date", path: ["dateOfBirth"] });
        return;
      }
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (birth > today) {
        ctx.addIssue({ code: "custom", message: "Invalid date", path: ["dateOfBirth"] });
        return;
      }
      const minBirth = new Date();
      minBirth.setFullYear(minBirth.getFullYear() - (MAX_AGE + 1));
      if (birth < minBirth) {
        ctx.addIssue({ code: "custom", message: "Invalid date", path: ["dateOfBirth"] });
        return;
      }
      const age = ageFromIso(d);
      if (age < MIN_AGE) {
        ctx.addIssue({
          code: "custom",
          message: "You must be at least 18 years old",
          path: ["dateOfBirth"],
        });
      }
    }
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

const salaryRangeValues = ["0-500", "501-1000", "1001-2000", "2001-3000", "3001-5000", "5001+"] as const;

function accountTypeToBucket(at: AccountType): "STUDENT" | "STAFF" | "ALUMNI" {
  if (at === "STUDENT") return "STUDENT";
  if (at === "STAFF") return "STAFF";
  return "ALUMNI";
}

export function buildCompleteProfileSchema(accountType: AccountType) {
  const bucket = accountTypeToBucket(accountType);

  return z
    .object({
      title: z.string().trim().min(1, "Title is required").max(64),
      nationalIdNumber: z.string().min(1),
      /** Omitted or empty for STAFF (no staff ID collected). */
      studentStaffId: z.preprocess(
        (v) => (v === undefined || v === null ? "" : String(v)),
        z.string()
      ),
      salaryRange: z.preprocess(
        (v) => (v === null || v === undefined || v === "" ? undefined : String(v)),
        z.string().optional()
      ),
      addressLine1: z.string().min(1),
      addressLine2: z
        .union([z.string(), z.null(), z.undefined()])
        .optional()
        .transform((v) => (v === null || v === undefined || v === "" ? undefined : String(v))),
    })
    .strict()
    .superRefine((data, ctx) => {
      if (!isNationalIdValid(data.nationalIdNumber)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: NATIONAL_ID_ERROR, path: ["nationalIdNumber"] });
      }
      if (bucket === "STUDENT") {
        if (!isStudentIdValid(data.studentStaffId)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: STUDENT_ID_ERROR, path: ["studentStaffId"] });
        }
      } else if (bucket === "ALUMNI") {
        if (!isStaffEmployerIdValid(data.studentStaffId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: STAFF_EMPLOYER_ID_ERROR,
            path: ["studentStaffId"],
          });
        }
      }
      const addr = validateStructuredResidentialAddress(data.addressLine1, data.addressLine2);
      if (!addr.ok) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: addr.error,
          path: ["addressLine1"],
        });
      }
      if (bucket === "STAFF" || bucket === "ALUMNI") {
        const sr = data.salaryRange;
        if (
          sr === undefined ||
          sr === null ||
          sr === "" ||
          !salaryRangeValues.includes(sr as (typeof salaryRangeValues)[number])
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Salary range is required",
            path: ["salaryRange"],
          });
        }
      }
    })
    .transform((data) => {
      const addr = validateStructuredResidentialAddress(data.addressLine1, data.addressLine2);
      if (!addr.ok) throw new Error("Address validation failed");
      return {
        title: data.title.trim(),
        nationalIdNumber: normalizeNationalIdForSubmit(data.nationalIdNumber),
        studentStaffId:
          bucket === "STUDENT"
            ? extractStudentIdContent(data.studentStaffId)
            : bucket === "ALUMNI"
              ? extractStaffEmployerIdContent(data.studentStaffId)
              : "",
        salaryRange:
          bucket === "STAFF" || bucket === "ALUMNI"
            ? (data.salaryRange as (typeof salaryRangeValues)[number])
            : null,
        addressLine1: addr.normalizedLine1,
        addressLine2: addr.normalizedLine2,
      };
    });
}

export type CompleteProfileOutput = z.infer<ReturnType<typeof buildCompleteProfileSchema>>;
