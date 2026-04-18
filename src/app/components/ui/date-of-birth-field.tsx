"use client";

import * as React from "react";
import { format } from "date-fns";
import { enGB } from "date-fns/locale/en-GB";
import { enUS } from "date-fns/locale/en-US";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/app/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { cn } from "./utils";
import { DOB, getMaxDobIsoString, getMinDobIsoString, parseIsoDateToLocalNoon } from "@/lib/dob";

export type DateLocaleMode = "en-GB" | "en-US";

export interface DateOfBirthFieldProps {
  /** ISO YYYY-MM-DD */
  value: string;
  onChange: (iso: string) => void;
  id?: string;
  disabled?: boolean;
  locked?: boolean;
  error?: string;
  className?: string;
  localeMode?: DateLocaleMode;
  minAge?: number;
  maxAge?: number;
}

/** Compare calendar days using ISO strings (avoids midnight vs noon bugs). */
function isDateInAllowedRange(d: Date, minIso: string, maxIso: string): boolean {
  const iso = format(d, "yyyy-MM-dd");
  return iso >= minIso && iso <= maxIso;
}

/**
 * Production DOB field: native date input + optional calendar picker.
 */
export function DateOfBirthField({
  value,
  onChange,
  id = "date-of-birth",
  disabled,
  locked,
  error,
  className,
  localeMode = typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("en-us")
    ? "en-US"
    : "en-GB",
  minAge = DOB.MIN_AGE_YEARS,
  maxAge = DOB.MAX_AGE_YEARS,
}: DateOfBirthFieldProps) {
  const [open, setOpen] = React.useState(false);

  const minIso = getMinDobIsoString(maxAge);
  const maxIso = getMaxDobIsoString(minAge);
  const date = value ? parseIsoDateToLocalNoon(value) : undefined;
  const locale = localeMode === "en-US" ? enUS : enGB;

  const handleNativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleCalendarSelect = (d: Date | undefined) => {
    if (!d) return;
    onChange(format(d, "yyyy-MM-dd"));
    setOpen(false);
  };

  const isDisabled = disabled || locked;

  return (
    <div className={cn("space-y-3", className)}>
      <div>
        <Label htmlFor={id} className="text-sm font-bold text-foreground">
          Date of birth <span className="text-red-500">*</span>
        </Label>
        {locked && (
          <p className="text-xs text-muted-foreground mt-0.5 mb-2">
            Locked - contact support to change.
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center mt-1">
          <input
            id={id}
            type="date"
            name={id}
            autoComplete="bday"
            value={value || ""}
            min={minIso}
            max={maxIso}
            disabled={isDisabled}
            onChange={handleNativeChange}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : undefined}
            aria-label="Date of birth"
            className={cn(
              "w-full min-w-0 flex-1 h-12 rounded-xl border-2 border-slate-200 bg-white px-3 text-base text-foreground",
              "shadow-sm transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500",
              "[color-scheme:light]",
              error && "border-red-500",
              isDisabled && "opacity-60 cursor-not-allowed bg-slate-50"
            )}
          />

          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                disabled={isDisabled}
                className="h-12 w-full shrink-0 justify-center rounded-xl border-slate-200 sm:w-12"
                aria-label="Open date picker to choose date of birth"
              >
                <CalendarIcon className="h-4 w-4" aria-hidden />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start" sideOffset={6}>
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleCalendarSelect}
                disabled={(d) => !isDateInAllowedRange(d, minIso, maxIso)}
                defaultMonth={date ?? parseIsoDateToLocalNoon(maxIso) ?? undefined}
                initialFocus
              />
              {date ? (
                <p className="px-3 pb-2 text-xs text-muted-foreground border-t border-slate-100 pt-2">
                  Selected: {format(date, "PPP", { locale })}
                </p>
              ) : null}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-red-600 font-medium">
          {error}
        </p>
      ) : null}
    </div>
  );
}
