import { useState, useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { PhoneInputField } from "@/app/components/PhoneInputField";
import { motion } from "motion/react";
import { LogIn, UserPlus, Mail, Lock, User, ArrowLeft, MapPin, Building2 } from "lucide-react";
import { validateInstitutionalEmail, validateStudentEmail } from "@/lib/validation";
import { FinEraShieldIcon } from "@/app/components/FinEraShieldIcon";
import { FinEraLogoText } from "@/app/components/FinEraLogoText";
import { getRegistrationData } from "@/services/api";
import { COUNTRIES, getCitiesByCountry, getInstitutionsByCountryAndType } from "@/data/locations";

interface LoginRegisterProps {
  onLogin: (email: string, password?: string) => void;
  onRegister: (data: any) => void;
  onBack?: () => void;
  /** Pre-selected account type from AccountTypeSelection - affects email label & validation */
  accountType?: 'student' | 'staff' | 'alumni';
}

export function LoginRegister({ onLogin, onRegister, onBack, accountType = 'student' }: LoginRegisterProps) {
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({ 
    fullName: "", 
    dateOfBirth: "",
    phoneNumber: "",
    email: "", 
    password: "", 
    confirmPassword: "",
    countryId: "",
    cityId: "",
    institutionId: "",
  });
  const [dobError, setDobError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [countries, setCountries] = useState<{ id: string; name: string; code: string }[]>([]);
  const [cities, setCities] = useState<{ id: string; name: string; countryId: string }[]>([]);
  const [institutions, setInstitutions] = useState<{ id: string; name: string; type: string; cityId: string }[]>([]);
  const [refLoading, setRefLoading] = useState(true);

  useEffect(() => {
    const fetchRegistrationData = async () => {
      try {
        setRefLoading(true);
        const data = await getRegistrationData();
        setCountries(data.countries.length > 0 ? data.countries : COUNTRIES);
        setCities(data.cities ?? []);
        setInstitutions(data.institutions ?? []);
      } catch {
        setCountries(COUNTRIES);
        setCities([]);
        setInstitutions([]);
      } finally {
        setRefLoading(false);
      }
    };
    fetchRegistrationData();
  }, []);

  const citiesForCountry = useMemo(() => {
    if (cities.length > 0) return cities;
    return getCitiesByCountry(registerData.countryId);
  }, [cities, registerData.countryId]);

  const institutionsForCountry = useMemo(() => {
    let list = institutions.length > 0
      ? institutions.filter((i) => {
          const city = citiesForCountry.find((c) => c.id === i.cityId);
          return city != null;
        })
      : getInstitutionsByCountryAndType(registerData.countryId, accountType);
    if (accountType !== "staff") {
      list = list.filter((i) => i.type === "university" || i.type === "polytechnic");
    }
    if (registerData.cityId) {
      return list.filter((i) => i.cityId === registerData.cityId);
    }
    return list;
  }, [institutions, registerData.countryId, registerData.cityId, accountType, citiesForCountry]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(loginData.email, loginData.password);
  };

  const passwordsMatch = registerData.password === registerData.confirmPassword;
  const showPasswordMismatch = registerData.confirmPassword.length > 0 && !passwordsMatch;

  const getDobMinMax = () => {
    const today = new Date();
    const maxD = new Date(today);
    maxD.setFullYear(maxD.getFullYear() - 16);
    const minD = new Date(today);
    minD.setFullYear(minD.getFullYear() - 120);
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return { min: fmt(minD), max: fmt(maxD) };
  };

  const validateAge = (dob: string): boolean => {
    if (!dob) return false;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age >= 16;
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (registerData.password !== registerData.confirmPassword) return;
    if (!registerData.dateOfBirth) {
      setDobError("Date of birth is required");
      return;
    }
    if (!validateAge(registerData.dateOfBirth)) {
      setDobError("You must be at least 16 years old to register");
      return;
    }
    if (!registerData.countryId) {
      setEmailError("Please select your country");
      return;
    }
    if (!registerData.cityId) {
      setEmailError("Please select your city");
      return;
    }
    if (!registerData.institutionId) {
      setEmailError("Please select your institution");
      return;
    }
    setDobError("");
    setEmailError("");
    const isStudent = accountType === 'student';
    const isValidEmail = isStudent
      ? validateStudentEmail(registerData.email)
      : validateInstitutionalEmail(registerData.email);
    if (!isValidEmail) {
      setEmailError(isStudent
        ? "Please use a valid University/College student email (e.g. @university.edu, .ac.zw)"
        : "Please use a valid Institutional email (e.g. .edu, .ac.*, .gov, organisation domains)");
      return;
    }
    const country = countries.find((c) => c.id === registerData.countryId);
    const city = citiesForCountry.find((c) => c.id === registerData.cityId);
    const institution = institutionsForCountry.find((i) => i.id === registerData.institutionId);
    const { confirmPassword, countryId, cityId, institutionId, ...rest } = registerData;
    onRegister({
      ...rest,
      country: country?.code || "ZW",
      city: city?.name || "",
      institution: institution?.name || "",
    });
  };

  const handleCountryChange = (id: string) => {
    setRegisterData({ ...registerData, countryId: id, cityId: "", institutionId: "" });
  };

  const handleCityChange = (id: string) => {
    setRegisterData({ ...registerData, cityId: id, institutionId: "" });
  };

  const emailLabel = accountType === 'student'
    ? "University/College Student Email"
    : "Institutional Email";
  const emailPlaceholder = accountType === 'student'
    ? "student@university.edu"
    : "name@institution.edu";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        {onBack && (
          <div className="flex justify-start mb-4">
            <Button
              variant="ghost"
              onClick={onBack}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Account Type
            </Button>
          </div>
        )}

        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-4">
            <FinEraShieldIcon size={48} className="rounded-xl" />
            <div className="hero-header flex flex-col items-center justify-center text-center">
              <FinEraLogoText variant="light" size="md" />
              <p className="inclusive-text text-xs font-semibold text-slate-600 tracking-[0.2em] uppercase mt-1 mb-0">INCLUSIVE FINANCIAL ECOSYSTEM</p>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 bg-slate-100 p-1 rounded-xl">
              <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <LogIn className="w-4 h-4 mr-2" />
                Login
              </TabsTrigger>
              <TabsTrigger value="register" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <UserPlus className="w-4 h-4 mr-2" />
                Register
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card className="border-slate-200 shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
                <CardHeader className="space-y-1 pt-8">
                  <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
                  <CardDescription className="text-center">
                    Enter your credentials to access your account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pb-8 px-8">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                          id="email" 
                          placeholder="name@university.edu" 
                          className="pl-10 h-12 rounded-lg border-slate-200 focus:ring-emerald-500"
                          value={loginData.email}
                          onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                          required 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <Button variant="link" className="px-0 h-auto text-xs text-emerald-600">Forgot password?</Button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                          id="password" 
                          type="password" 
                          className="pl-10 h-12 rounded-lg border-slate-200 focus:ring-emerald-500"
                          value={loginData.password}
                          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          required 
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full h-12 bg-primary hover:bg-emerald-700 rounded-xl font-semibold text-lg text-primary-foreground transition-all active:scale-[0.98]">
                      Sign In
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card className="border-slate-200 shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
                <CardHeader className="space-y-1 pt-8">
                  <CardTitle className="text-2xl font-bold text-center">Create account</CardTitle>
                  <CardDescription className="text-center">
                    Join the academic financial community
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pb-8 px-8">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reg-name">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                          id="reg-name" 
                          placeholder="John Doe" 
                          className="pl-10 h-12 rounded-lg"
                          value={registerData.fullName}
                          onChange={(e) => setRegisterData({ ...registerData, fullName: e.target.value })}
                          required 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-dob">Date of Birth</Label>
                      <Input
                        id="reg-dob"
                        name="dateOfBirth"
                        type="date"
                        value={registerData.dateOfBirth}
                        onChange={(e) => {
                          setRegisterData({ ...registerData, dateOfBirth: e.target.value });
                          setDobError("");
                        }}
                        required
                        {...getDobMinMax()}
                        className={`h-12 rounded-lg cursor-pointer ${dobError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                        aria-invalid={!!dobError}
                      />
                      {dobError && (
                        <p className="text-sm text-red-600 font-medium">{dobError}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-phone">Phone Number</Label>
                      <PhoneInputField
                        id="reg-phone"
                        value={registerData.phoneNumber}
                        onChange={(value) => setRegisterData({ ...registerData, phoneNumber: value })}
                        placeholder="Enter phone number"
                        required
                        inputClassName="!border-slate-200 focus:!ring-emerald-500 focus:!border-emerald-500"
                        buttonClassName="!border-slate-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Country
                      </Label>
                      <Select
                        value={registerData.countryId}
                        onValueChange={handleCountryChange}
                        disabled={refLoading}
                      >
                        <SelectTrigger className="h-12 rounded-lg border-slate-200">
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        City
                      </Label>
                      <Select
                        value={registerData.cityId}
                        onValueChange={handleCityChange}
                        disabled={!registerData.countryId || refLoading}
                      >
                        <SelectTrigger className="h-12 rounded-lg border-slate-200">
                          <SelectValue placeholder="Select city" />
                        </SelectTrigger>
                        <SelectContent>
                          {citiesForCountry.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Institution
                      </Label>
                      <Select
                        value={registerData.institutionId}
                        onValueChange={(id) => setRegisterData({ ...registerData, institutionId: id })}
                        disabled={!registerData.cityId || refLoading}
                      >
                        <SelectTrigger className="h-12 rounded-lg border-slate-200">
                          <SelectValue placeholder="Select institution" />
                        </SelectTrigger>
                        <SelectContent>
                          {institutionsForCountry.map((i) => (
                            <SelectItem key={i.id} value={i.id}>
                              {i.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-email">{emailLabel}</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                          id="reg-email" 
                          type="email" 
                          placeholder={emailPlaceholder} 
                          className={`pl-10 h-12 rounded-lg ${emailError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                          value={registerData.email}
                          onChange={(e) => {
                            setRegisterData({ ...registerData, email: e.target.value });
                            setEmailError("");
                          }}
                          required 
                        />
                      </div>
                      {emailError && <p className="text-sm text-red-600 font-medium">{emailError}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-password">Create Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                          id="reg-password" 
                          type="password" 
                          className="pl-10 h-12 rounded-lg"
                          value={registerData.password}
                          onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                          required 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-confirm-password">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                          id="reg-confirm-password" 
                          type="password" 
                          className={`pl-10 h-12 rounded-lg ${showPasswordMismatch ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                          value={registerData.confirmPassword}
                          onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                          required 
                        />
                      </div>
                      {showPasswordMismatch && (
                        <p className="text-sm text-red-600 font-medium">Passwords do not match</p>
                      )}
                    </div>
                    <Button 
                      type="submit" 
                      disabled={showPasswordMismatch}
                      className="w-full h-12 bg-primary hover:bg-emerald-700 rounded-xl font-semibold text-lg text-primary-foreground transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Create Account
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>

        <p className="mt-8 text-center text-sm text-slate-500">
          By continuing, you agree to our <span className="text-emerald-600 font-medium">Terms of Service</span> and <span className="text-emerald-600 font-medium">Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
}