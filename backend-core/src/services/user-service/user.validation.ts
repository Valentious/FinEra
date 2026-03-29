/**
 * User profile update - server-side validation (FinEra data-integrity rules).
 */
import { z } from "zod";
import {
  fullNameSchema,
  optionalCitySchema,
  phoneNumberSchema,
} from "../../shared/validation/zod-schemas.js";

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
