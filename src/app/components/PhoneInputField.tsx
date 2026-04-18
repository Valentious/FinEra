import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

interface PhoneInputFieldProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  defaultCountry?: string;
  containerClassName?: string;
  inputClassName?: string;
  buttonClassName?: string;
  onBlur?: () => void;
}

/**
 * International phone input with country flags.
 * Stores value in E.164 format (e.g., +1234567890).
 */
export function PhoneInputField({
  value,
  onChange,
  id,
  placeholder = "Enter phone number",
  required = false,
  disabled = false,
  defaultCountry = "zw",
  containerClassName = "",
  inputClassName = "",
  buttonClassName = "",
  onBlur,
}: PhoneInputFieldProps) {
  const handleChange = (val: string) => {
    onChange(val ? `+${val}` : "");
  };

  const displayValue = value.startsWith("+") ? value.slice(1) : value;

  const containerClass = ["finera-phone-input", containerClassName].filter(Boolean).join(" ");

  return (
    <PhoneInput
      country={defaultCountry}
      value={displayValue}
      onChange={handleChange}
      enableSearch
      searchPlaceholder="Search country..."
      specialLabel=""
      inputProps={{
        id,
        required,
        "aria-required": required,
        ...(onBlur ? { onBlur } : {}),
      }}
      placeholder={placeholder}
      disabled={disabled}
      containerClass={containerClass}
      inputClass={`!flex-1 !min-w-0 !w-auto !h-12 !min-h-12 !rounded-r-xl !rounded-l-none !border !border-l-0 !border-slate-200 !bg-white !pl-3 !pr-4 !text-base !outline-none focus:!border-emerald-500 focus:!ring-2 focus:!ring-emerald-500/20 sm:!pl-4 ${inputClassName}`}
      buttonClass={`!h-12 !min-h-12 !min-w-[4.5rem] !shrink-0 !rounded-l-xl !rounded-r-none !border !border-r-0 !border-slate-200 !bg-slate-50 hover:!bg-slate-100 focus:!ring-2 focus:!ring-emerald-500/20 ${buttonClassName}`}
      dropdownClass="!z-[100] !rounded-xl !border !border-slate-200 !shadow-lg"
      searchClass="!rounded-lg !border-slate-200 !py-2"
    />
  );
}
