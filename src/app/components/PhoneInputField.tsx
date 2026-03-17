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
  defaultCountry = "us",
  containerClassName = "",
  inputClassName = "",
  buttonClassName = "",
}: PhoneInputFieldProps) {
  const handleChange = (val: string) => {
    onChange(val ? `+${val}` : "");
  };

  const displayValue = value.startsWith("+") ? value.slice(1) : value;

  return (
    <PhoneInput
      country={defaultCountry}
      value={displayValue}
      onChange={handleChange}
      enableSearch
      searchPlaceholder="Search country..."
      inputProps={{ id, required, "aria-required": required }}
      placeholder={placeholder}
      disabled={disabled}
      containerClass={containerClassName}
      inputClass={`!w-full !h-12 !rounded-lg !border !border-slate-200 !bg-white !px-4 !text-base !outline-none focus:!border-indigo-500 focus:!ring-2 focus:!ring-indigo-500/20 ${inputClassName}`}
      buttonClass={`!h-12 !rounded-l-lg !border !border-r-0 !border-slate-200 !bg-slate-50 hover:!bg-slate-100 focus:!ring-2 focus:!ring-indigo-500/20 ${buttonClassName}`}
      dropdownClass="!rounded-xl !border !border-slate-200 !shadow-lg"
      searchClass="!rounded-lg !border-slate-200 !py-2"
    />
  );
}
