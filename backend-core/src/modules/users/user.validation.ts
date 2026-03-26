/**
 * User profile update — server-side validation (aligns with frontend KYC rules).
 */
import { z } from "zod";

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

export const updateProfileSchema = z
  .object({
    fullName: z.string().min(2).max(100).trim().optional(),
    phoneNumber: z.string().min(8).max(24).trim().optional(),
    dateOfBirth: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
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
