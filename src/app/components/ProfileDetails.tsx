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
  const [currentStep, setCurrentStep] = useState(1);
  const [accountSubtype, setAccountSubtype] = useState<"Current" | "Savings" | "Other">("Current");
  const [title, setTitle] = useState("");
  const [nationalIdNumber, setNationalIdNumber] = useState("");
  const [studentStaffId, setStudentStaffId] = useState("");
  const [salaryRange, setSalaryRange] = useState("");
  const [gender, setGender] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");

  const [businessName, setBusinessName] = useState("");
  const [businessRegistrationNumber, setBusinessRegistrationNumber] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [businessCategory, setBusinessCategory] = useState<"SME" | "Corporate" | "">("");
  const [tradingSince, setTradingSince] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessPhoneNumber, setBusinessPhoneNumber] = useState("");
  const [dateOfIncorporation, setDateOfIncorporation] = useState("");
  const [constitution, setConstitution] = useState("");
  const [representativeName, setRepresentativeName] = useState("");
  const [representativeIdNumber, setRepresentativeIdNumber] = useState("");
  const [representativeRole, setRepresentativeRole] = useState("");
  const [representativeGender, setRepresentativeGender] = useState("");
  const [representativeAddress, setRepresentativeAddress] = useState("");
  const [representativePhone, setRepresentativePhone] = useState("");
  const [representativeEmail, setRepresentativeEmail] = useState("");
  const [representativeContact, setRepresentativeContact] = useState("");
  const [complianceEmail, setComplianceEmail] = useState("");

  const [nextOfKinName, setNextOfKinName] = useState("");
  const [nextOfKinAddress, setNextOfKinAddress] = useState("");
  const [nextOfKinPhone, setNextOfKinPhone] = useState("");
  const [occupation, setOccupation] = useState("");
  const [employerName, setEmployerName] = useState("");
  const [employmentSector, setEmploymentSector] = useState("");
  const [employerContact, setEmployerContact] = useState("");
  const [dateOfEmployment, setDateOfEmployment] = useState("");
  const [grossMonthlyIncome, setGrossMonthlyIncome] = useState("");
  const [otherIncome, setOtherIncome] = useState("");

  const [nationalBlurred, setNationalBlurred] = useState(false);
  const [studentBlurred, setStudentBlurred] = useState(false);
  const [addressBlurred, setAddressBlurred] = useState(false);
  const [salaryBlurred, setSalaryBlurred] = useState(false);
  const [titleBlurred, setTitleBlurred] = useState(false);
  const [businessNameBlurred, setBusinessNameBlurred] = useState(false);
  const [representativeBlurred, setRepresentativeBlurred] = useState(false);
  const [complianceBlurred, setComplianceBlurred] = useState(false);
  const [nextOfKinBlurred, setNextOfKinBlurred] = useState(false);
  const [employerBlurred, setEmployerBlurred] = useState(false);

  const isBusinessAccount = accountType === "alumni";
  const isStaffAccount = accountType === "staff";

  const nationalOk = isNationalIdValid(nationalIdNumber);
  const studentOk = accountType === "student" ? isStudentIdValid(studentStaffId) : true;
  const addressResult = useMemo(
    () => validateStructuredResidentialAddress(addressLine1, addressLine2),
    [addressLine1, addressLine2]
  );
  const addressOk = addressResult.ok;
  // Income range is optional in this flow; do not block progression.
  const salaryOk = true;
  const titleOk = title.trim().length > 0;
  const businessNameOk = !isBusinessAccount || businessName.trim().length > 0;
  const representativeNameOk = !isBusinessAccount || representativeName.trim().length > 0;
  const representativeRoleOk = !isBusinessAccount || representativeRole.trim().length > 0;
  const representativeContactOk = !isBusinessAccount || representativeContact.trim().length > 0;
  const complianceEmailOk = !isBusinessAccount || complianceEmail.trim().length > 0;
  const nextOfKinNameOk = !isStaffAccount || nextOfKinName.trim().length > 0;
  const nextOfKinAddressOk = !isStaffAccount || nextOfKinAddress.trim().length > 0;
  const nextOfKinPhoneOk = !isStaffAccount || nextOfKinPhone.trim().length > 0;
  const occupationOk = !isStaffAccount || occupation.trim().length > 0;
  const employerNameOk = !isStaffAccount || employerName.trim().length > 0;
  const employmentSectorOk = !isStaffAccount || employmentSector.trim().length > 0;
  const employerContactOk = !isStaffAccount || employerContact.trim().length > 0;
  const dateOfEmploymentOk = !isStaffAccount || dateOfEmployment.trim().length > 0;

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
  const showBusinessNameError = isBusinessAccount && businessNameBlurred && !businessNameOk;
  const showRepresentativeError = isBusinessAccount && representativeBlurred && (!representativeNameOk || !representativeRoleOk || !representativeContactOk);
  const showComplianceError = isBusinessAccount && complianceBlurred && !complianceEmailOk;
  const showNextOfKinError = isStaffAccount && nextOfKinBlurred && (!nextOfKinNameOk || !nextOfKinAddressOk || !nextOfKinPhoneOk);
  const showEmployerError =
    isStaffAccount &&
    employerBlurred &&
    (!occupationOk || !employerNameOk || !employerContactOk || !employmentSectorOk || !dateOfEmploymentOk);

  // Business onboarding: allow progression even when fields are partial.
  const stepOneValid = true;
  const stepTwoValid = true;

  const canSubmit =
    (isBusinessAccount || titleOk) &&
    (isBusinessAccount || nationalOk) &&
    (isBusinessAccount || studentOk) &&
    (isBusinessAccount || addressOk) &&
    (isBusinessAccount || salaryOk) &&
    (!isBusinessAccount || stepTwoValid) &&
    (!isStaffAccount ||
      (nextOfKinNameOk &&
        nextOfKinAddressOk &&
        nextOfKinPhoneOk &&
        occupationOk &&
        employerNameOk &&
        employerContactOk &&
        employmentSectorOk &&
        dateOfEmploymentOk));

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

  const handleNextStep = () => {
    setBusinessNameBlurred(true);
    setTitleBlurred(true);
    setNationalBlurred(true);
    if (!stepOneValid) return;
    setCurrentStep(2);
  };

  const handleComplete = () => {
    setTitleBlurred(true);
    setNationalBlurred(true);
    if (accountType === "student") setStudentBlurred(true);
    setAddressBlurred(true);
    if (accountType === "staff" || accountType === "alumni") setSalaryBlurred(true);
    if (isBusinessAccount) {
      setRepresentativeBlurred(true);
      setComplianceBlurred(true);
    }
    if (isStaffAccount) {
      setNextOfKinBlurred(true);
      setEmployerBlurred(true);
    }
    if (!canSubmit) return;

    const addr = validateStructuredResidentialAddress(addressLine1, addressLine2);
    if (!addr.ok) return;

    const payload: CompleteProfilePayload = {
      title: title.trim(),
      nationalIdNumber: normalizeNationalIdForSubmit(nationalIdNumber),
      studentStaffId: accountType === "student" ? extractStudentIdContent(studentStaffId) : "",
      salaryRange: accountType === "student" ? null : String(Math.max(totalIncome, 0) || salaryRange || ""),
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

  const totalIncome = useMemo(() => {
    const gross = Number(grossMonthlyIncome || 0);
    const other = Number(otherIncome || 0);
    return (Number.isFinite(gross) ? gross : 0) + (Number.isFinite(other) ? other : 0);
  }, [grossMonthlyIncome, otherIncome]);

  const studentIdErrorMessage = accountType === "student" ? STUDENT_ID_ERROR : "";
  const heading = isBusinessAccount
    ? currentStep === 1
      ? "Create Business Profile"
      : "Complete Business Profile"
    : "Complete your profile";
  const subHeading = isBusinessAccount
    ? currentStep === 1
      ? "Start with business identity details"
      : "Finish with representative and compliance information"
    : "Identity verification details";

  return (
    <GoldCoinsAuthBackdrop>
      <div className="mx-auto w-full max-w-md space-y-6 animate-in fade-in duration-500">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-amber-300 ring-1 ring-white/15 backdrop-blur-sm">
            <Icon className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white drop-shadow-sm">{heading}</h2>
          <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-slate-300">{subHeading}</p>
          {isBusinessAccount ? (
            <p className="mt-2 text-xs text-slate-300">Page {currentStep} of 2</p>
          ) : null}
        </div>

        <Card className="rounded-3xl border border-white/25 bg-white/[0.98] p-6 shadow-2xl shadow-black/45 backdrop-blur-sm">
          <div className="space-y-6">
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

              {!isBusinessAccount ? (
                <div className="space-y-5 rounded-3xl border border-slate-200/80 bg-slate-50 p-4">
                  <p className="text-sm font-bold uppercase tracking-[0.24em] text-slate-500">Personal Details</p>
                  <div className="space-y-2">
                    <Label className="font-bold text-foreground ml-1">Type of Account</Label>
                    <select
                      value={accountSubtype}
                      onChange={(e) => setAccountSubtype(e.target.value as "Current" | "Savings" | "Other")}
                      className="w-full h-14 rounded-2xl border-slate-200 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 font-semibold text-base px-4 bg-white"
                    >
                      <option value="Current">Current</option>
                      <option value="Savings">Savings</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <Input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    placeholder="Date of birth"
                    className="h-14 rounded-2xl border-slate-200 focus:ring-emerald-600 font-semibold text-base"
                  />
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full h-14 rounded-2xl border-slate-200 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 font-semibold text-base px-4 bg-white"
                  >
                    <option value="">Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                  <select
                    value={maritalStatus}
                    onChange={(e) => setMaritalStatus(e.target.value)}
                    className="w-full h-14 rounded-2xl border-slate-200 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 font-semibold text-base px-4 bg-white"
                  >
                    <option value="">Marital Status</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widow">Widow</option>
                  </select>
                  <Input
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="Mobile number"
                    className="h-14 rounded-2xl border-slate-200 focus:ring-emerald-600 font-semibold text-base"
                  />
                </div>
              ) : null}

              {isBusinessAccount && currentStep === 1 ? (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label className="font-bold text-foreground ml-1">Type of Account</Label>
                    <select
                      value={accountSubtype}
                      onChange={(e) => setAccountSubtype(e.target.value as "Current" | "Savings" | "Other")}
                      className="w-full h-14 rounded-2xl border-slate-200 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 font-semibold text-base px-4 bg-white"
                    >
                      <option value="Current">Current</option>
                      <option value="Savings">Savings</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-foreground ml-1">Trade Name</Label>
                    <Input
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      onBlur={() => setBusinessNameBlurred(true)}
                      placeholder="Example Enterprises (Pvt) Ltd"
                      className={`h-14 rounded-2xl border-slate-200 focus:ring-emerald-600 font-semibold text-base ${
                        showBusinessNameError ? "border-red-500 focus-visible:ring-red-500" : ""
                      }`}
                    />
                    {showBusinessNameError ? (
                      <p className="text-sm font-medium text-red-600">Business name is required</p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold text-foreground ml-1">Registration Number</Label>
                    <Input
                      value={businessRegistrationNumber}
                      onChange={(e) => setBusinessRegistrationNumber(e.target.value)}
                      placeholder="BRN 12345678"
                      className="h-14 rounded-2xl border-slate-200 focus:ring-emerald-600 font-semibold text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold text-foreground ml-1">Trading Since</Label>
                    <Input
                      type="date"
                      value={tradingSince}
                      onChange={(e) => setTradingSince(e.target.value)}
                      className="h-14 rounded-2xl border-slate-200 focus:ring-emerald-600 font-semibold text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold text-foreground ml-1">Business Type</Label>
                    <Input
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      placeholder="e.g. Trading, Logistics, Services"
                      className="h-14 rounded-2xl border-slate-200 focus:ring-emerald-600 font-semibold text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold text-foreground ml-1">Business Type Category</Label>
                    <select
                      value={businessCategory}
                      onChange={(e) => setBusinessCategory(e.target.value as "SME" | "Corporate" | "")}
                      className="w-full h-14 rounded-2xl border-slate-200 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 font-semibold text-base px-4 bg-white"
                    >
                      <option value="">Select category</option>
                      <option value="SME">SME</option>
                      <option value="Corporate">Corporate</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold text-foreground ml-1">Business Address</Label>
                    <Input
                      value={businessAddress}
                      onChange={(e) => setBusinessAddress(e.target.value)}
                      placeholder="Business address"
                      className="h-14 rounded-2xl border-slate-200 focus:ring-emerald-600 font-semibold text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold text-foreground ml-1">Business Email</Label>
                    <Input
                      type="email"
                      value={businessEmail}
                      onChange={(e) => setBusinessEmail(e.target.value)}
                      placeholder="business@company.com"
                      className="h-14 rounded-2xl border-slate-200 focus:ring-emerald-600 font-semibold text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold text-foreground ml-1">Business Phone Number</Label>
                    <Input
                      value={businessPhoneNumber}
                      onChange={(e) => setBusinessPhoneNumber(e.target.value)}
                      placeholder="+263 ..."
                      className="h-14 rounded-2xl border-slate-200 focus:ring-emerald-600 font-semibold text-base"
                    />
                  </div>
                </div>
              ) : null}

              {!isBusinessAccount || currentStep === 2 ? (
                <div className="space-y-5">
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

                  {accountType === "student" ? (
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
                  ) : null}

                  {isStaffAccount ? (
                    <div className="space-y-6 rounded-3xl border border-slate-200/80 bg-slate-50 p-4">
                      <p className="text-sm font-bold uppercase tracking-[0.24em] text-slate-500">Next of Kin</p>
                      <div className="space-y-4">
                        <Input
                          value={nextOfKinName}
                          onChange={(e) => setNextOfKinName(e.target.value)}
                          onBlur={() => setNextOfKinBlurred(true)}
                          placeholder="Next of kin full name"
                          className={`h-14 rounded-2xl border-slate-200 focus:ring-emerald-600 font-semibold text-base ${
                            showNextOfKinError ? "border-red-500 focus-visible:ring-red-500" : ""
                          }`}
                        />
                        <Input
                          value={nextOfKinAddress}
                          onChange={(e) => setNextOfKinAddress(e.target.value)}
                          onBlur={() => setNextOfKinBlurred(true)}
                          placeholder="Next of kin address"
                          className={`h-14 rounded-2xl border-slate-200 focus:ring-emerald-600 font-semibold text-base ${
                            showNextOfKinError ? "border-red-500 focus-visible:ring-red-500" : ""
                          }`}
                        />
                        <Input
                          value={nextOfKinPhone}
                          onChange={(e) => setNextOfKinPhone(e.target.value)}
                          onBlur={() => setNextOfKinBlurred(true)}
                          placeholder="Contact phone"
                          className={`h-14 rounded-2xl border-slate-200 focus:ring-emerald-600 font-semibold text-base ${
                            showNextOfKinError ? "border-red-500 focus-visible:ring-red-500" : ""
                          }`}
                        />
                        {showNextOfKinError ? (
                          <p className="text-sm font-medium text-red-600">Please provide next of kin name, address and phone</p>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  {isStaffAccount ? (
                    <div className="space-y-6 rounded-3xl border border-slate-200/80 bg-slate-50 p-4">
                      <p className="text-sm font-bold uppercase tracking-[0.24em] text-slate-500">Employment Details</p>
                      <div className="space-y-4">
                        <Input
                          value={employerName}
                          onChange={(e) => setEmployerName(e.target.value)}
                          onBlur={() => setEmployerBlurred(true)}
                          placeholder="Employer / organization name"
                          className={`h-14 rounded-2xl border-slate-200 focus:ring-emerald-600 font-semibold text-base ${
                            showEmployerError ? "border-red-500 focus-visible:ring-red-500" : ""
                          }`}
                        />
                        <Input
                          value={occupation}
                          onChange={(e) => setOccupation(e.target.value)}
                          onBlur={() => setEmployerBlurred(true)}
                          placeholder="Occupation"
                          className={`h-14 rounded-2xl border-slate-200 focus:ring-emerald-600 font-semibold text-base ${
                            showEmployerError ? "border-red-500 focus-visible:ring-red-500" : ""
                          }`}
                        />
                        <Input
                          value={employerContact}
                          onChange={(e) => setEmployerContact(e.target.value)}
                          onBlur={() => setEmployerBlurred(true)}
                          placeholder="Employer telephone number"
                          className={`h-14 rounded-2xl border-slate-200 focus:ring-emerald-600 font-semibold text-base ${
                            showEmployerError ? "border-red-500 focus-visible:ring-red-500" : ""
                          }`}
                        />
                        <select
                          value={employmentSector}
                          onChange={(e) => setEmploymentSector(e.target.value)}
                          onBlur={() => setEmployerBlurred(true)}
                          className={`w-full h-14 rounded-2xl border-slate-200 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 font-semibold text-base px-4 bg-white ${
                            showEmployerError ? "border border-red-500" : ""
                          }`}
                        >
                          <option value="">Employment sector</option>
                          <option value="Financial Service">Financial Service</option>
                          <option value="Manufacturing">Manufacturing</option>
                          <option value="Mining">Mining</option>
                          <option value="Construction">Construction</option>
                          <option value="Agriculture">Agriculture</option>
                          <option value="Retail">Retail</option>
                          <option value="Security office">Security office</option>
                          <option value="Other">Other</option>
                        </select>
                        <Input
                          type="date"
                          value={dateOfEmployment}
                          onChange={(e) => setDateOfEmployment(e.target.value)}
                          onBlur={() => setEmployerBlurred(true)}
                          placeholder="Date of employment"
                          className={`h-14 rounded-2xl border-slate-200 focus:ring-emerald-600 font-semibold text-base ${
                            showEmployerError ? "border-red-500 focus-visible:ring-red-500" : ""
                          }`}
                        />
                        <Input
                          type="number"
                          value={grossMonthlyIncome}
                          onChange={(e) => setGrossMonthlyIncome(e.target.value)}
                          placeholder="Gross monthly income"
                          className="h-14 rounded-2xl border-slate-200 focus:ring-emerald-600 font-semibold text-base"
                        />
                        <Input
                          type="number"
                          value={otherIncome}
                          onChange={(e) => setOtherIncome(e.target.value)}
                          placeholder="Other income"
                          className="h-14 rounded-2xl border-slate-200 focus:ring-emerald-600 font-semibold text-base"
                        />
                        {showEmployerError ? (
                          <p className="text-sm font-medium text-red-600">Please complete employment details</p>
                        ) : null}
                        <div className="rounded-2xl bg-white p-4 border border-slate-200">
                          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Total Income</p>
                          <p className="mt-2 text-lg font-black text-foreground">${totalIncome.toLocaleString()} / month</p>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {isBusinessAccount && currentStep === 2 ? (
                    <div className="space-y-6 rounded-3xl border border-slate-200/80 bg-slate-50 p-4">
                      <p className="text-sm font-bold uppercase tracking-[0.24em] text-slate-500">Representative & Compliance</p>
                      <div className="space-y-4">
                        <Input
                          value={representativeName}
                          onChange={(e) => setRepresentativeName(e.target.value)}
                          onBlur={() => setRepresentativeBlurred(true)}
                          placeholder="Representative name and surname"
                          className={`h-14 rounded-2xl border-slate-200 focus:ring-emerald-600 font-semibold text-base ${
                            showRepresentativeError ? "border-red-500 focus-visible:ring-red-500" : ""
                          }`}
                        />
                        <Input
                          value={representativeIdNumber}
                          onChange={(e) => setRepresentativeIdNumber(e.target.value)}
                          onBlur={() => setRepresentativeBlurred(true)}
                          placeholder="Representative ID number"
                          className={`h-14 rounded-2xl border-slate-200 focus:ring-emerald-600 font-semibold text-base ${
                            showRepresentativeError ? "border-red-500 focus-visible:ring-red-500" : ""
                          }`}
                        />
                        <Input
                          value={representativeRole}
                          onChange={(e) => setRepresentativeRole(e.target.value)}
                          onBlur={() => setRepresentativeBlurred(true)}
                          placeholder="Position"
                          className={`h-14 rounded-2xl border-slate-200 focus:ring-emerald-600 font-semibold text-base ${
                            showRepresentativeError ? "border-red-500 focus-visible:ring-red-500" : ""
                          }`}
                        />
                        <select
                          value={representativeGender}
                          onChange={(e) => setRepresentativeGender(e.target.value)}
                          className="w-full h-14 rounded-2xl border-slate-200 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 font-semibold text-base px-4 bg-white"
                        >
                          <option value="">Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                        <Input
                          value={representativeAddress}
                          onChange={(e) => setRepresentativeAddress(e.target.value)}
                          onBlur={() => setRepresentativeBlurred(true)}
                          placeholder="Representative address"
                          className={`h-14 rounded-2xl border-slate-200 focus:ring-emerald-600 font-semibold text-base ${
                            showRepresentativeError ? "border-red-500 focus-visible:ring-red-500" : ""
                          }`}
                        />
                        <Input
                          value={representativePhone}
                          onChange={(e) => setRepresentativePhone(e.target.value)}
                          onBlur={() => setRepresentativeBlurred(true)}
                          placeholder="Representative phone number"
                          className={`h-14 rounded-2xl border-slate-200 focus:ring-emerald-600 font-semibold text-base ${
                            showRepresentativeError ? "border-red-500 focus-visible:ring-red-500" : ""
                          }`}
                        />
                        <Input
                          type="email"
                          value={representativeEmail}
                          onChange={(e) => setRepresentativeEmail(e.target.value)}
                          onBlur={() => setRepresentativeBlurred(true)}
                          placeholder="Representative email (OTP verification remains active)"
                          className={`h-14 rounded-2xl border-slate-200 focus:ring-emerald-600 font-semibold text-base ${
                            showRepresentativeError ? "border-red-500 focus-visible:ring-red-500" : ""
                          }`}
                        />
                        <Input
                          value={representativeContact}
                          onChange={(e) => setRepresentativeContact(e.target.value)}
                          onBlur={() => setRepresentativeBlurred(true)}
                          placeholder="Alternative representative contact"
                          className={`h-14 rounded-2xl border-slate-200 focus:ring-emerald-600 font-semibold text-base ${
                            showRepresentativeError ? "border-red-500 focus-visible:ring-red-500" : ""
                          }`}
                        />
                        <Input
                          value={complianceEmail}
                          onChange={(e) => setComplianceEmail(e.target.value)}
                          onBlur={() => setComplianceBlurred(true)}
                          placeholder="Compliance contact email"
                          className={`h-14 rounded-2xl border-slate-200 focus:ring-emerald-600 font-semibold text-base ${
                            showComplianceError ? "border-red-500 focus-visible:ring-red-500" : ""
                          }`}
                        />
                        <Input
                          value={constitution}
                          onChange={(e) => setConstitution(e.target.value)}
                          onBlur={() => setComplianceBlurred(true)}
                          placeholder="Constitution"
                          className={`h-14 rounded-2xl border-slate-200 focus:ring-emerald-600 font-semibold text-base ${
                            showComplianceError ? "border-red-500 focus-visible:ring-red-500" : ""
                          }`}
                        />
                        <Input
                          type="date"
                          value={dateOfIncorporation}
                          onChange={(e) => setDateOfIncorporation(e.target.value)}
                          onBlur={() => setComplianceBlurred(true)}
                          placeholder="Date of incorporation"
                          className={`h-14 rounded-2xl border-slate-200 focus:ring-emerald-600 font-semibold text-base ${
                            showComplianceError ? "border-red-500 focus-visible:ring-red-500" : ""
                          }`}
                        />
                        {showComplianceError ? (
                          <p className="text-sm font-medium text-red-600">Compliance contact email is required</p>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  {(!isBusinessAccount || currentStep === 2) && (
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
                  )}
                </div>
              ) : null}
            </div>

            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 mt-2">
              <p className="text-xs text-emerald-800 font-medium leading-relaxed">
                <strong className="font-black">Privacy Note:</strong> Your identification details are encrypted and used
                solely for identity verification and account security purposes.
              </p>
            </div>

            {isBusinessAccount && currentStep === 1 ? (
              <Button
                type="button"
                onClick={handleNextStep}
                disabled={!stepOneValid}
                className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black shadow-xl shadow-emerald-100 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to Representative & Compliance
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleComplete}
                disabled={!canSubmit}
                className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black shadow-xl shadow-emerald-100 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Complete Profile Setup
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            )}

            {isBusinessAccount && currentStep === 2 ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCurrentStep(1)}
                className="w-full h-14 border border-slate-200 text-slate-700 rounded-2xl font-semibold mt-3"
              >
                Back to Business Identity
              </Button>
            ) : null}
          </div>
        </Card>
      </div>
    </GoldCoinsAuthBackdrop>
  );
}
