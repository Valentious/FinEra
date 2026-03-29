"use client";

/**
 * Registration / forms - same production DOB UX as DateOfBirthField (native input + calendar).
 */
import { DateOfBirthField } from "@/app/components/ui/date-of-birth-field";
import { DOB } from "@/lib/dob";
import { cn } from "./utils";

export interface DatePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minAge?: number;
  maxAge?: number;
  className?: string;
  id?: string;
  required?: boolean;
  error?: string;
}

export function DatePicker({
  value,
  onChange,
  disabled = false,
  minAge = DOB.MIN_AGE_YEARS,
  maxAge = DOB.MAX_AGE_YEARS,
  className,
  id,
  error,
}: DatePickerProps) {
  return (
    <DateOfBirthField
      value={value ?? ""}
      onChange={onChange}
      id={id}
      disabled={disabled}
      error={error}
      className={cn(className)}
      minAge={minAge}
      maxAge={maxAge}
    />
  );
}
