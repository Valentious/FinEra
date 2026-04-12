import { useState, useMemo } from "react";
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
  Building2,
  Search
} from "lucide-react";
import { toast } from "sonner";
import { COUNTRIES, getCitiesByCountry, getInstitutionsByCountryAndType, searchInstitutions } from "@/data/locations";
import { ADDRESS } from "@/lib/validation";

interface ProfileDetailsProps {
  accountType: 'student' | 'staff' | 'alumni';
  onComplete: (data: any) => void | Promise<void>;
}

export function ProfileDetails({ accountType, onComplete }: ProfileDetailsProps) {
  const [title, setTitle] = useState("");
  const [nationalIdNumber, setNationalIdNumber] = useState("");
  const [studentStaffId, setStudentStaffId] = useState("");
  const [salaryRange, setSalaryRange] = useState("");
  const [countryId, setCountryId] = useState("");
  const [cityId, setCityId] = useState("");
  const [institutionId, setInstitutionId] = useState("");
  const [institutionName, setInstitutionName] = useState("");
  const [institutionSearch, setInstitutionSearch] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");

  const cities = useMemo(() => getCitiesByCountry(countryId), [countryId]);
  const institutions = useMemo(
    () => searchInstitutions(countryId, accountType, institutionSearch),
    [countryId, accountType, institutionSearch]
  );

  const handleComplete = () => {
    if (!title) {
      toast.error("Title is required");
      return;
    }

    if (!nationalIdNumber.trim()) {
      toast.error("National ID Number is required");
      return;
    }
    
    if (!studentStaffId.trim()) {
      const idType = accountType === 'student' ? 'Student ID' : accountType === 'staff' ? 'Staff ID' : 'Employer ID';
      toast.error(`${idType} is required`);
      return;
    }

    if (!countryId) {
      toast.error("Please select your country");
      return;
    }

    if (!cityId) {
      toast.error("Please select your city");
      return;
    }

    if (!institutionId || !institutionName) {
      toast.error("Please select your institution/organization");
      return;
    }

    // Validate salary range for staff and employer
    if ((accountType === 'staff' || accountType === 'alumni') && !salaryRange) {
      toast.error("Salary range is required");
      return;
    }

    const addressError = ADDRESS.validateAddressLine1(addressLine1);
    if (addressError) {
      toast.error(addressError);
      return;
    }

    onComplete({ 
      title,
      nationalIdNumber: nationalIdNumber.trim(), 
      studentStaffId: studentStaffId.trim(),
      salaryRange: salaryRange || null,
      countryId,
      cityId,
      institutionId,
      institutionName,
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2.trim() || undefined,
    });
  };

  const handleCountryChange = (id: string) => {
    setCountryId(id);
    setCityId("");
    setInstitutionId("");
    setInstitutionName("");
  };

  const handleCityChange = (id: string) => {
    setCityId(id);
    setInstitutionId("");
    setInstitutionName("");
  };

  const handleInstitutionSelect = (id: string, name: string) => {
    setInstitutionId(id);
    setInstitutionName(name);
  };

  const getIdLabel = () => {
    switch (accountType) {
      case 'student':
        return 'Student ID Number';
      case 'staff':
        return 'Staff ID Number';
      case 'alumni':
        return 'Employer ID Number';
    }
  };

  const getIdPlaceholder = () => {
    switch (accountType) {
      case 'student':
        return 'e.g., STU123456';
      case 'staff':
        return 'e.g., STF123456';
      case 'alumni':
        return 'e.g., EMP123456';
    }
  };

  const getIcon = () => {
    switch (accountType) {
      case 'student':
        return GraduationCap;
      case 'staff':
        return Briefcase;
      case 'alumni':
        return Users;
    }
  };

  const getTitleOptions = () => {
    switch (accountType) {
      case 'student':
        return [
          { value: "Mr", label: "Mr" },
          { value: "Mrs", label: "Mrs" },
          { value: "Miss", label: "Miss" },
          { value: "Ms", label: "Ms" },
          { value: "Mx", label: "Mx" },
        ];
      case 'staff':
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
      case 'alumni':
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

  return (
    <div className="max-w-md mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Icon className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-foreground">Complete Your Profile</h2>
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest text-[10px] mt-1">
          Identity Verification Details
        </p>
      </div>

      <Card className="border-slate-100 shadow-xl shadow-slate-200/50 rounded-3xl p-6">
        <div className="space-y-5">
          {/* Step 1: Country Selection */}
          <div className="space-y-2">
            <Label className="font-bold text-foreground ml-1 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              Country
            </Label>
            <select
              value={countryId}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="w-full h-14 rounded-2xl border-slate-200 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 font-semibold text-base px-4 bg-white"
            >
              <option value="">Select your country</option>
              {COUNTRIES.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Step 2: City Selection */}
          {countryId && (
            <div className="space-y-2">
              <Label className="font-bold text-foreground ml-1 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                City
              </Label>
              <select
                value={cityId}
                onChange={(e) => handleCityChange(e.target.value)}
                className="w-full h-14 rounded-2xl border-slate-200 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 font-semibold text-base px-4 bg-white"
              >
                <option value="">Select your city</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Step 3: Institution Selection */}
          {countryId && (
            <div className="space-y-2">
              <Label className="font-bold text-foreground ml-1 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                {accountType === 'staff' ? 'Organization (Universities, Companies, Government)' : 'University / Polytechnic'}
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search institutions..."
                  value={institutionSearch}
                  onChange={(e) => setInstitutionSearch(e.target.value)}
                  className="pl-10 h-12 rounded-2xl border-slate-200 mb-2"
                />
              </div>
              <select
                value={institutionId}
                onChange={(e) => {
                  const opt = e.target.options[e.target.selectedIndex];
                  handleInstitutionSelect(opt.value, opt.text);
                }}
                className="w-full h-14 rounded-2xl border-slate-200 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 font-semibold text-base px-4 bg-white"
              >
                <option value="">Select institution</option>
                {institutions.map((i) => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
              {institutions.length === 0 && countryId && (
                <p className="text-xs text-muted-foreground">No institutions found. Try a different search.</p>
              )}
            </div>
          )}

          {/* Title Selection */}
          <div className="space-y-2">
            <Label className="font-bold text-foreground ml-1 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" />
              Title
            </Label>
            <select
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-14 rounded-2xl border-slate-200 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 font-semibold text-base px-4 bg-white"
            >
              <option value="">Select your title</option>
              {titleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1 px-1">
              * Your preferred title for official correspondence
            </p>
          </div>

          {/* National ID Number */}
          <div className="space-y-2">
            <Label className="font-bold text-foreground ml-1 flex items-center gap-2">
              <UserSquare2 className="w-4 h-4 text-emerald-600" />
              National ID Number
            </Label>
            <Input 
              placeholder="XX-XXXXXX-X-XX" 
              value={nationalIdNumber}
              onChange={(e) => setNationalIdNumber(e.target.value)}
              className="h-14 rounded-2xl border-slate-200 focus:ring-emerald-600 font-semibold text-base"
              maxLength={50}
            />
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1 px-1">
              * Your official government-issued ID number
            </p>
          </div>

          {/* Student / Staff / Employer–Alumni ID */}
          <div className="space-y-2">
            <Label className="font-bold text-foreground ml-1 flex items-center gap-2">
              <Icon className="w-4 h-4 text-emerald-600" />
              {getIdLabel()}
            </Label>
            <Input 
              placeholder={getIdPlaceholder()}
              value={studentStaffId}
              onChange={(e) => setStudentStaffId(e.target.value)}
              className="h-14 rounded-2xl border-slate-200 focus:ring-emerald-600 font-semibold text-base"
              maxLength={50}
            />
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1 px-1">
              * Your university/institution identification number
            </p>
          </div>

          {/* Salary Range (Staff & Employer only) */}
          {(accountType === 'staff' || accountType === 'alumni') && (
            <div className="space-y-2">
              <Label className="font-bold text-foreground ml-1 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Monthly Salary Range
              </Label>
              <select
                value={salaryRange}
                onChange={(e) => setSalaryRange(e.target.value)}
                className="w-full h-14 rounded-2xl border-slate-200 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 font-semibold text-base px-4 bg-white"
              >
                <option value="">Select your salary range</option>
                {salaryRanges.map((range) => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1 px-1">
                * Used to determine your credit limit eligibility
              </p>
            </div>
          )}

          {/* Residential Address */}
          <div className="space-y-3">
            <Label className="font-bold text-foreground ml-1 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              Residential Address
            </Label>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Address Line 1 *</Label>
              <Input
                type="text"
                name="addressLine1"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                required
                placeholder="Street address, building, house number"
                className="h-12 rounded-2xl border-slate-200 focus:ring-emerald-600 font-medium"
              />
              <p className="text-[10px] text-muted-foreground font-medium">Street and number</p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Address Line 2 (optional)</Label>
              <Input
                type="text"
                name="addressLine2"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                placeholder="Apartment, suite, unit, etc (optional)"
                className="h-12 rounded-2xl border-slate-200 focus:ring-emerald-600 font-medium"
              />
              <p className="text-[10px] text-muted-foreground font-medium">Apartment, suite, unit (optional)</p>
            </div>
          </div>

          {/* Info Box */}
          <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 mt-6">
            <p className="text-xs text-emerald-800 font-medium leading-relaxed">
              <strong className="font-black">Privacy Note:</strong> Your identification details are encrypted and used solely for identity verification and account security purposes.
            </p>
          </div>

          {/* Submit Button */}
          <Button 
            onClick={handleComplete}
            className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black shadow-xl shadow-emerald-100 mt-6"
          >
            Complete Profile Setup
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </Card>
    </div>
  );
}

