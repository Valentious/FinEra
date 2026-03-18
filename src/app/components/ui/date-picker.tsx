"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/app/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { Button } from "@/app/components/ui/button";
import { cn } from "./utils";

export interface DatePickerProps {
  value?: string; // ISO format YYYY-MM-DD
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

/** Calculate age from date string (YYYY-MM-DD) */
function getAge(dateStr: string): number {
  const birth = new Date(dateStr);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

/** Get max date for minimum age (e.g. 16 = must be 16+ today) */
function getMaxDateForMinAge(minAge: number): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - minAge);
  return d;
}

/** Get min date for max age (e.g. 120 = no one older than 120) */
function getMinDateForMaxAge(maxAge: number): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - maxAge);
  return d;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  disabled = false,
  minAge = 16,
  maxAge = 120,
  className,
  id,
  required = false,
  error,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const date = value ? new Date(value) : undefined;

  const handleSelect = (d: Date | undefined) => {
    if (!d) return;
    const iso = format(d, "yyyy-MM-dd");
    const age = getAge(iso);
    if (age < minAge) {
      return; // Don't allow selection
    }
    onChange(iso);
    setOpen(false);
  };

  const fromDate = getMinDateForMaxAge(maxAge);
  const toDate = getMaxDateForMinAge(minAge);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full h-12 justify-start text-left font-normal rounded-lg border border-slate-200 bg-white hover:bg-slate-50",
            !date && "text-muted-foreground",
            error && "border-red-500 focus-visible:ring-red-500",
            className
          )}
          type="button"
        >
          <CalendarIcon className="mr-3 h-4 w-4 text-slate-400" />
          {date ? format(date, "PPP") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          disabled={(d) => d > toDate || d < fromDate}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
