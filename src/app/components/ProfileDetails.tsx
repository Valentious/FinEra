import { useCallback, useMemo, useState } from "react";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  ArrowRight,
  UserSquare2,
  GraduationCap,
  Briefcase,
  Users,
  DollarSign,
  Award,
  MapPin,
} from "lucide-react";
import type { CompleteProfilePayload } from "@/types/profileCompletion";
import { GoldCoinsAuthBackdrop } from "@/app/components/GoldCoinsAuthBackdrop";
import {
  extractStudentIdContent,
  formatNationalIdDisplay,
  isNationalIdValid,
  isStudentIdValid,
  normalizeCommaAddressPart,
  normalizeNationalIdForSubmit,
  NATIONAL_ID_ERROR,
  stripKycInvisible,
  STRUCTURED_ADDRESS_ERROR,
  STUDENT_ID_ERROR,
  validateStructuredResidentialAddress,
} from "@/lib/kycIdentityFormats";

interface ProfileDetailsProps {
  accountType: "student" | "staff" | "alumni";
  onComplete: (data: CompleteProfilePayload) => void | Promise<void>;
}

export function ProfileDetails({ accountType, onComplete }: ProfileDetailsProps) {
  const [title, setTitle] = useState("");
  const [nationalIdNumber, setNationalIdNumber] = useState("");
  const [studentStaffId, setStudentStaffId] = useState("");
  const [salaryRange, setSalaryRange] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");

  const [nationalBlurred, setNationalBlurred] = useState(false);
  const [studentBlurred, setStudentBlurred] = useState(false);
  const [addressBlurred, setAddressBlurred] = useState(false);
  const [salaryBlurred, setSalaryBlurred] = useState(false);
  const [titleBlurred, setTitleBlurred] = useState(false);

  const nationalOk = isNationalIdValid(nationalIdNumber);
  const studentOk = accountType === "student" ? isStudentIdValid(studentStaffId) : true;
  const addressResult = useMemo(
    () => validateStructuredResidentialAddress(addressLine1, addressLine2),
    [addressLine1, addressLine2]
  );
  const addressOk = addressResult.ok;
  const salaryOk = accountType === "student" || (typeof salaryRange === "string" && salaryRange.length > 0);
  const titleOk = title.trim().length > 0;

  const showNationalError =
    (nationalBlurred || nationalIdNumber.length > 0) && nationalIdNumber.length > 0 && !nationalOk;
  const showStudentError =
    accountType === "student" &&
    (studentBlurred || studentStaffId.length > 0) &&
    studentStaffId.length > 0 &&
    !studentOk;
  const showAddressError =
    (addressBlurred || addressLine1.length > 0) && addressLine1.length > 0 && !addressOk;
  const showSalaryError = (accountType === "staff" || accountType === "alumni") && salaryBlurred && !salaryOk;

  const canSubmit = titleOk && nationalOk && studentOk && addressOk && salaryOk;

  const onNationalChange = useCallback((raw: string) => {
    setNationalIdNumber(formatNationalIdDisplay(raw));
  }, []);

  const onNationalPaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain") ?? "";
    onNationalChange(text);
  }, [onNationalChange]);

  const onStudentChange = useCallback((raw: string) => {
    const cleaned = stripKycInvisible(raw).replace(/\s+/g, "");
    setStudentStaffId(extractStudentIdContent(cleaned));
  }, []);

  const onStudentPaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const text = e.clipboardData.getData("text/plain") ?? "";
      onStudentChange(text);
    },
    [onStudentChange]
  );

  const onAddressPaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>, field: 1 | 2) => {
    e.preventDefault();
    const text = stripKycInvisible(e.clipboardData.getData("text/plain") ?? "");
    if (field === 1) setAddressLine1(text);
    else setAddressLine2(text);
  }, []);

  const handleComplete = () => {
    setTitleBlurred(true);
    setNationalBlurred(true);
    if (accountType === "student") setStudentBlurred(true);
    setAddressBlurred(true);
    if (accountType === "staff" || accountType === "alumni") setSalaryBlurred(true);
    if (!canSubmit) return;

    const addr = validateStructuredResidentialAddress(addressLine1, addressLine2);
    if (!addr.ok) return;

    const payload: CompleteProfilePayload = {
      title: title.trim(),
      nationalIdNumber: normalizeNationalIdForSubmit(nationalIdNumber),
      studentStaffId: accountType === "student" ? extractStudentIdContent(studentStaffId) : "",
      salaryRange: accountType === "student" ? null : salaryRange,
      addressLine1: addr.normalizedLine1,
      addressLine2: addr.normalizedLine2,
    };

    void onComplete(payload);
  };

  const getIcon = () => {
    switch (accountType) {
      case "student":
        return GraduationCap;
      case "staff":
        return Briefcase;
      case "alumni":
        return Users;
    }
  };

  const getTitleOptions = () => {
    switch (accountType) {
      case "student":
        return [
          { value: "Mr", label: "Mr" },
          { value: "Mrs", label: "Mrs" },
          { value: "Miss", label: "Miss" },
          { value: "Ms", label: "Ms" },
          { value: "Mx", label: "Mx" },
        ];
      case "staff":
        return [
          { value: "Mr", label: "Mr" },
          { value: "Mrs", label: "Mrs" },
          { value: "Miss", label: "Miss" },
          { value: "Ms", label: "Ms" },
          { value: "Dr", label: "Dr" },
          { value: "Prof", label: "Professor" },
          { value: "Assoc Prof", label: "Associate Professor" },
          { value: "Sr Lecturer", label: "Senior Lecturer" },
          { value: "Lecturer", label: "Lecturer" },
          { value: "Rev", label: "Reverend" },
        ];
      case "alumni":
        return [
          { value: "Mr", label: "Mr" },
          { value: "Mrs", label: "Mrs" },
          { value: "Miss", label: "Miss" },
          { value: "Ms", label: "Ms" },
          { value: "Dr", label: "Dr" },
          { value: "Prof", label: "Professor" },
          { value: "CEO", label: "CEO" },
          { value: "President", label: "President" },
          { value: "Vice President", label: "Vice President" },
          { value: "Director", label: "Director" },
          { value: "Hon", label: "Honorable" },
          { value: "Rev", label: "Reverend" },
        ];
    }
  };

  const Icon = getIcon();
  const titleOptions = getTitleOptions();

  const salaryRanges = [
    { value: "0-500", label: "$0 - $500" },
    { value: "501-1000", label: "$501 - $1,000" },
    { value: "1001-2000", label: "$1,001 - $2,000" },
    { value: "2001-3000", label: "$2,001 - $3,000" },
    { value: "3001-5000", label: "$3,001 - $5,000" },
    { value: "5001+", label: "$5,001+" },
  ];

  const studentIdErrorMessage = accountType === "student" ? STUDENT_ID_ERROR : "";

  return (
    <GoldCoinsAuthBackdrop>
    <div className="mx-auto w-full max-w-md space-y-6 animate-in fade-in duration-500">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-amber-300 ring-1 ring-white/15 backdrop-blur-sm">
          <Icon className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-black tracking-tight text-white drop-shadow-sm">Complete Your Profile</h2>
        <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-slate-300">
          Identity Verification Details
        </p>
      </div>

      <Card className="rounded-3xl border border-white/25 bg-white/[0.98] p-6 shadow-2xl shadow-black/45 backdrop-blur-sm">
        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="font-bold text-foreground ml-1 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" />
              Title
            </Label>
            <select
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setTitleBlurred(true)}
              className="w-full h-14 rounded-2xl border-slate-200 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 font-semibold text-base px-4 bg-white"
            >
              <option value="">Select your title</option>
              {titleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {!titleOk && titleBlurred ? <p className="text-sm font-medium text-red-600">Title is required</p> : null}
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1 px-1">
              * Your preferred title for official correspondence
            </p>
          </div>

          <div className="space-y-2">
            <Label className="font-bold text-foreground ml-1 flex items-center gap-2" htmlFor="kyc-national-id">
              <UserSquare2 className="w-4 h-4 text-emerald-600" />
              National ID Number
            </Label>
            <Input
              id="kyc-national-id"
              placeholder="54 2005580 Z 54"
              inputMode="text"
              autoComplete="off"
              spellCheck={false}
              value={nationalIdNumber}
              onChange={(e) => onNationalChange(e.target.value)}
              onBlur={() => setNationalBlurred(true)}
              onPaste={onNationalPaste}
              maxLength={15}
              aria-invalid={showNationalError}
              className={`h-14 rounded-2xl border-slate-200 focus:ring-emerald-600 font-semibold text-base tracking-wide ${
                showNationalError ? "border-red-500 focus-visible:ring-red-500" : ""
              }`}
            />
            {showNationalError ? (
              <p className="text-sm font-medium text-red-600">{NATIONAL_ID_ERROR}</p>
            ) : null}
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1 px-1">
              * Format: 2 digits, 7 digits, 1 letter (A–Z), 2 digits — spaces added automatically
            </p>
          </div>

          {accountType === "student" && (
            <div className="space-y-2">
              <Label className="font-bold text-foreground ml-1 flex items-center gap-2" htmlFor="kyc-student-staff-id">
                <Icon className="w-4 h-4 text-emerald-600" />
                Student ID Number
              </Label>
              <Input
                id="kyc-student-staff-id"
                placeholder="N02427344M"
                autoComplete="off"
                spellCheck={false}
                value={studentStaffId}
                onChange={(e) => onStudentChange(e.target.value)}
                onBlur={() => setStudentBlurred(true)}
                onPaste={onStudentPaste}
                maxLength={10}
                aria-invalid={showStudentError}
                className={`h-14 rounded-2xl border-slate-200 focus:ring-emerald-600 font-semibold text-base uppercase ${
                  showStudentError ? "border-red-500 focus-visible:ring-red-500" : ""
                }`}
              />
              {showStudentError ? (
                <p className="text-sm font-medium text-red-600">{studentIdErrorMessage}</p>
              ) : null}
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1 px-1">
                * One letter, eight digits, one letter — letters auto-uppercased
              </p>
            </div>
          )}

          {(accountType === "staff" || accountType === "alumni") && (
            <div className="space-y-2">
              <Label className="font-bold text-foreground ml-1 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Monthly Income Range
              </Label>
              <select
                value={salaryRange}
                onChange={(e) => setSalaryRange(e.target.value)}
                onBlur={() => setSalaryBlurred(true)}
                aria-invalid={showSalaryError}
                className={`w-full h-14 rounded-2xl border-slate-200 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 font-semibold text-base px-4 bg-white ${
                  showSalaryError ? "border border-red-500" : ""
                }`}
              >
                <option value="">Select your income range</option>
                {salaryRanges.map((range) => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
              {showSalaryError ? (
                <p className="text-sm font-medium text-red-600">Income range is required</p>
              ) : null}
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1 px-1">
                * Used to determine your credit limit eligibility
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Label className="font-bold text-foreground ml-1 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              Residential Address
            </Label>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground" htmlFor="kyc-address-1">
                Address (street, house number, city, town) *
              </Label>
              <Input
                id="kyc-address-1"
                type="text"
                name="addressLine1"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                onBlur={() => {
                  setAddressBlurred(true);
                  setAddressLine1((v) => normalizeCommaAddressPart(v));
                }}
                onPaste={(e) => onAddressPaste(e, 1)}
                placeholder="12 Samora Machel Avenue, 45, Bulawayo, Nkulumane"
                autoComplete="street-address"
                aria-invalid={showAddressError}
                className={`h-12 rounded-2xl border-slate-200 focus:ring-emerald-600 font-medium ${
                  showAddressError ? "border-red-500 focus-visible:ring-red-500" : ""
                }`}
              />
              {showAddressError ? (
                <p className="text-sm font-medium text-red-600">{STRUCTURED_ADDRESS_ERROR}</p>
              ) : null}
              <p className="text-[10px] text-muted-foreground font-medium">
                Four parts separated by commas (at least three commas). You may continue on the optional second line.
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground" htmlFor="kyc-address-2">
                Address line 2 (optional)
              </Label>
              <Input
                id="kyc-address-2"
                type="text"
                name="addressLine2"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                onBlur={() => setAddressLine2((v) => normalizeCommaAddressPart(v))}
                onPaste={(e) => onAddressPaste(e, 2)}
                placeholder="Extra detail or continuation (optional)"
                className="h-12 rounded-2xl border-slate-200 focus:ring-emerald-600 font-medium"
              />
            </div>
          </div>

          <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 mt-6">
            <p className="text-xs text-emerald-800 font-medium leading-relaxed">
              <strong className="font-black">Privacy Note:</strong> Your identification details are encrypted and used
              solely for identity verification and account security purposes.
            </p>
          </div>

          <Button
            type="button"
            onClick={handleComplete}
            disabled={!canSubmit}
            className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black shadow-xl shadow-emerald-100 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Complete Profile Setup
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </Card>
    </div>
    </GoldCoinsAuthBackdrop>
  );
}
