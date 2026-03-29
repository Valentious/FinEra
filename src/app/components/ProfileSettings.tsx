import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Switch } from "@/app/components/ui/switch";
import { 
  User, 
  Shield, 
  Bell, 
  CreditCard, 
  LogOut, 
  Camera, 
  Smartphone, 
  Mail,
  Globe,
  FileCheck,
  FileText,
  Home,
  Briefcase,
  DollarSign,
  Lock,
  Key,
  UserX,
  Gauge,
  History,
  Code,
  Link2,
  ShieldCheck,
  XCircle,
  Wallet,
  Moon,
  Sun,
  HelpCircle,
  Scale,
  MessageCircle,
  MessageSquare,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Upload
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { DateOfBirthField } from "@/app/components/ui/date-of-birth-field";
import { validateDobIso, dobErrorMessage } from "@/lib/dob";
import { apiService } from "@/services/index";
import { useI18n } from "@/app/providers/I18nProvider";
import { isAppLocale } from "@/i18n/locales";

interface ProfileSettingsProps {
  userData: any;
  onUpdate: (data: any) => void;
  onLogout: () => void;
}

type SettingsTab = 
  | 'profile'
  | 'verification'
  | 'security'
  | 'cashier'
  | 'help';

export function ProfileSettings({ userData, onUpdate, onLogout }: ProfileSettingsProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { t, setLocale } = useI18n();
  const [themeReady, setThemeReady] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [language, setLanguage] = useState(userData.preferredLanguage || "en");

  const [profileTitle, setProfileTitle] = useState(userData.title || "Mr");
  const [profileFullName, setProfileFullName] = useState(userData.fullName || "");
  const [profileEmail, setProfileEmail] = useState(userData.email || "");
  const [profilePhone, setProfilePhone] = useState(userData.phoneNumber || userData.mobile || "");
  const [profileCity, setProfileCity] = useState(userData.city || "");
  const [profileDob, setProfileDob] = useState(userData.dateOfBirth || "");
  const [dobError, setDobError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    setProfileTitle(userData.title || "Mr");
    setProfileFullName(userData.fullName || "");
    setProfileEmail(userData.email || "");
    setProfilePhone(userData.phoneNumber || userData.mobile || "");
    setProfileCity(userData.city || "");
    setProfileDob(userData.dateOfBirth || "");
    const pl = userData.preferredLanguage;
    if (pl && isAppLocale(pl)) {
      setLanguage(pl);
      setLocale(pl);
    }
    setDobError("");
  }, [userData.memberId, userData.email, userData.dateOfBirth, userData.phoneNumber, userData.fullName, userData.city, userData.preferredLanguage, userData.title, setLocale]);

  useEffect(() => {
    setThemeReady(true);
  }, []);

  const isDarkTheme = (resolvedTheme ?? theme) === "dark";

  const handleSaveProfile = async () => {
    setDobError("");
    const dobCheck = validateDobIso(profileDob);
    if (!dobCheck.ok) {
      setDobError(dobErrorMessage(dobCheck.error));
      toast.error(dobErrorMessage(dobCheck.error));
      return;
    }
    setSavingProfile(true);
    try {
      const patch = await apiService.updateUserProfile({
        fullName: profileFullName.trim(),
        phoneNumber: profilePhone.trim(),
        dateOfBirth: dobCheck.iso,
        title: profileTitle.trim(),
        preferredLanguage: language,
        city: profileCity.trim(),
      });
      if (isAppLocale(language)) setLocale(language);
      onUpdate({ ...userData, ...patch, title: profileTitle.trim(), preferredLanguage: language, city: profileCity.trim() });
      toast.success(t("profile.updated"));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Update failed";
      toast.error(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCloseAccount = () => {
    toast.error("Account closure requires verification. Contact support.");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-in slide-in-from-bottom-4 duration-500 text-foreground">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground">{t("profile.title")}</h1>
          <p className="text-muted-foreground font-medium">{t("profile.subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Theme: Light / Dark (persisted via next-themes → html.dark) */}
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 shadow-sm">
            <Sun className="h-4 w-4" aria-hidden />
            <Switch
              checked={themeReady && isDarkTheme}
              onCheckedChange={(checked) => {
                setTheme(checked ? "dark" : "light");
                toast.success(checked ? "Dark theme enabled" : "Light theme enabled");
              }}
              disabled={!themeReady}
              aria-label={isDarkTheme ? "Dark theme on" : "Light theme on"}
            />
            <Moon className="h-4 w-4" aria-hidden />
            <span className="hidden text-xs font-bold text-muted-foreground sm:inline">
              {themeReady ? (isDarkTheme ? "Dark" : "Light") : "…"}
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-red-600 hover:bg-red-50 hover:text-red-700" 
            onClick={onLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            {t("nav.signOut")}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <aside className="lg:w-72 space-y-2">
          <nav className="rounded-2xl border border-border bg-card p-3 shadow-sm space-y-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                activeTab === 'profile' 
                  ? 'bg-emerald-50 text-emerald-600 font-bold dark:bg-emerald-950/50 dark:text-emerald-400' 
                  : 'text-muted-foreground hover:bg-muted/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <User className="w-4 h-4" />
                <span className="text-sm">{t("profile.tabProfile")}</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab('verification')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                activeTab === 'verification' 
                  ? 'bg-emerald-50 text-emerald-600 font-bold dark:bg-emerald-950/50 dark:text-emerald-400' 
                  : 'text-muted-foreground hover:bg-muted/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileCheck className="w-4 h-4" />
                <span className="text-sm">{t("profile.tabVerification")}</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                activeTab === 'security' 
                  ? 'bg-emerald-50 text-emerald-600 font-bold dark:bg-emerald-950/50 dark:text-emerald-400' 
                  : 'text-muted-foreground hover:bg-muted/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4" />
                <span className="text-sm">{t("profile.tabSecurity")}</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab('cashier')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                activeTab === 'cashier' 
                  ? 'bg-emerald-50 text-emerald-600 font-bold dark:bg-emerald-950/50 dark:text-emerald-400' 
                  : 'text-muted-foreground hover:bg-muted/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Wallet className="w-4 h-4" />
                <span className="text-sm">Cashier</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab('help')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                activeTab === 'help' 
                  ? 'bg-emerald-50 text-emerald-600 font-bold dark:bg-emerald-950/50 dark:text-emerald-400' 
                  : 'text-muted-foreground hover:bg-muted/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <HelpCircle className="w-4 h-4" />
                <span className="text-sm">Help Centre</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>
          </nav>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 space-y-6">
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Personal Details */}
              <Card className="border-border shadow-lg rounded-2xl">
                <CardHeader className="border-b border-border/60">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 rounded-lg">
                      <User className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Personal Details</CardTitle>
                      <CardDescription>Update your basic information</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {/* Profile Picture */}
                  <div className="flex items-center gap-6">
                    <div className="relative group">
                      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                        <User className="w-10 h-10 text-emerald-600" />
                      </div>
                      <button className="absolute bottom-0 right-0 p-2 bg-emerald-600 text-white rounded-full border-2 border-white shadow-md hover:bg-emerald-700 transition-colors">
                        <Camera className="w-3 h-3" />
                      </button>
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{profileFullName || userData.fullName}</p>
                      <p className="text-xs text-slate-500 uppercase tracking-wider">{userData.accountType} Member</p>
                      <p className="text-xs text-slate-400 mt-1">Acc: {userData.finEraAccountNumbers?.usd ?? userData.accountNumber}</p>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-600">{t("profile.fieldTitle")}</Label>
                      <Input
                        value={profileTitle}
                        onChange={(e) => setProfileTitle(e.target.value)}
                        className="h-11 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-600">{t("profile.fieldFullName")}</Label>
                      <Input
                        value={profileFullName}
                        onChange={(e) => setProfileFullName(e.target.value)}
                        className="h-11 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-600">{t("profile.fieldEmail")}</Label>
                      <Input value={profileEmail} readOnly disabled className="h-11 rounded-xl bg-slate-50 text-slate-600" />
                      <p className="text-[10px] text-slate-500">{t("profile.emailLocked")}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-600">{t("profile.fieldPhone")}</Label>
                      <Input
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        className="h-11 rounded-xl"
                        inputMode="tel"
                        autoComplete="tel"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-600">{t("profile.fieldCity")}</Label>
                      <Input
                        value={profileCity}
                        onChange={(e) => setProfileCity(e.target.value)}
                        className="h-11 rounded-xl"
                        placeholder="e.g. Harare"
                        autoComplete="address-level2"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <DateOfBirthField
                        id="profile-dob"
                        value={profileDob}
                        onChange={(iso) => {
                          setProfileDob(iso);
                          setDobError("");
                        }}
                        locked={userData.dateOfBirthLocked === true}
                        error={dobError}
                        localeMode={language.startsWith("en-US") ? "en-US" : "en-GB"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-600">National ID</Label>
                      <Input 
                        defaultValue={userData.nationalIdNumber} 
                        disabled 
                        className="h-11 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-600">{userData.accountType === 'student' ? 'Student' : userData.accountType === 'staff' ? 'Staff' : 'Alumni'} ID</Label>
                      <Input 
                        defaultValue={userData.studentStaffId} 
                        disabled 
                        className="h-11 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed" 
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/60 flex justify-end">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={savingProfile}
                      className="bg-emerald-600 hover:bg-emerald-700 rounded-xl px-8 font-bold"
                    >
                      {savingProfile ? t("profile.saving") : t("profile.save")}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Languages */}
              <Card className="border-border shadow-lg rounded-2xl">
                <CardHeader className="border-b border-border/60">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 rounded-lg">
                      <Globe className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{t("profile.languagesTitle")}</CardTitle>
                      <CardDescription>{t("profile.languagesDesc")}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-600">{t("profile.displayLanguage")}</Label>
                    <select 
                      value={language}
                      onChange={async (e) => {
                        const lang = e.target.value;
                        setLanguage(lang);
                        if (isAppLocale(lang)) setLocale(lang);
                        try {
                          const patch = await apiService.updateUserProfile({ preferredLanguage: lang });
                          onUpdate({ ...userData, ...patch, preferredLanguage: lang });
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : "Could not save language");
                        }
                      }}
                      className="w-full h-11 rounded-xl border-slate-200 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 px-3"
                    >
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="pt">Português</option>
                      <option value="sw">Kiswahili</option>
                      <option value="sn">ChiShona</option>
                      <option value="nd">isiNdebele</option>
                      <option value="af">Afrikaans</option>
                    </select>
                  </div>
                </CardContent>
              </Card>

              {/* Help Centre & Live Chat */}
              <Card className="border-border shadow-lg rounded-2xl">
                <CardHeader className="border-b border-border/60">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 rounded-lg">
                      <HelpCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Support</CardTitle>
                      <CardDescription>Get help when you need it</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-3">
                  <button 
                    onClick={() => toast.success("Opening Help Centre...")}
                    className="w-full p-4 rounded-xl border-2 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                        <HelpCircle className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-slate-900">Help Centre</p>
                        <p className="text-xs text-slate-500">Browse FAQs and guides</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                  </button>

                  <button 
                    onClick={() => toast.success("Starting live chat...")}
                    className="w-full p-4 rounded-xl border-2 border-green-200 hover:border-green-300 hover:bg-green-50 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                        <MessageSquare className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-slate-900">Live Chat</p>
                        <p className="text-xs text-slate-500">Chat with support now</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-green-600 transition-colors" />
                    </div>
                  </button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* VERIFICATION TAB */}
          {activeTab === 'verification' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card className="border-border shadow-lg rounded-2xl">
                <CardHeader className="border-b border-border/60">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 rounded-lg">
                      <FileCheck className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Identity Verification</CardTitle>
                      <CardDescription>Upload documents to verify your identity</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {/* Proof of Identity */}
                  <div className="p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-emerald-300 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-slate-600" />
                        <div>
                          <p className="text-sm font-bold text-slate-900">Proof of Identity</p>
                          <p className="text-xs text-slate-500">Upload National ID, Passport, or Driver's License</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <Button size="sm" variant="outline" className="rounded-lg">
                          <Upload className="w-4 h-4 mr-2" />
                          Upload
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Proof of Address */}
                  <div className="p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-emerald-300 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Home className="w-5 h-5 text-slate-600" />
                        <div>
                          <p className="text-sm font-bold text-slate-900">Proof of Address</p>
                          <p className="text-xs text-slate-500">Utility bill or bank statement (within 3 months)</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-500" />
                        <Button size="sm" variant="outline" className="rounded-lg">
                          <Upload className="w-4 h-4 mr-2" />
                          Upload
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Proof of Ownership */}
                  <div className="p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-emerald-300 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Briefcase className="w-5 h-5 text-slate-600" />
                        <div>
                          <p className="text-sm font-bold text-slate-900">Proof of Ownership</p>
                          <p className="text-xs text-slate-500">Asset ownership documents (optional)</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="rounded-lg">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload
                      </Button>
                    </div>
                  </div>

                  {/* Proof of Income */}
                  {(userData.accountType === 'staff' || userData.accountType === 'alumni') && (
                    <div className="p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-emerald-300 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <DollarSign className="w-5 h-5 text-slate-600" />
                          <div>
                            <p className="text-sm font-bold text-slate-900">Proof of Income</p>
                            <p className="text-xs text-slate-500">Payslip or employment letter (within 3 months)</p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" className="rounded-lg">
                          <Upload className="w-4 h-4 mr-2" />
                          Upload
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Email and Password */}
              <Card className="border-border shadow-lg rounded-2xl">
                <CardHeader className="border-b border-border/60">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 rounded-lg">
                      <Lock className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Email and Password</CardTitle>
                      <CardDescription>Manage your login credentials</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-3">
                    <Label className="text-xs font-bold text-slate-600">Change Password</Label>
                    <Input type="password" placeholder="Current Password" className="h-11 rounded-xl" />
                    <Input type="password" placeholder="New Password" className="h-11 rounded-xl" />
                    <Input type="password" placeholder="Confirm New Password" className="h-11 rounded-xl" />
                    <Button className="w-full bg-slate-900 hover:bg-slate-800 rounded-xl font-bold">
                      Update Password
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Passkeys */}
              <Card className="border-border shadow-lg rounded-2xl">
                <CardHeader className="border-b border-border/60">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 rounded-lg">
                      <Key className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">Passkeys</CardTitle>
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-black rounded uppercase">New!</span>
                      </div>
                      <CardDescription>Sign in securely without a password</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="p-4 bg-emerald-50 rounded-xl flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-emerald-900">Enable Passkeys</p>
                      <p className="text-xs text-emerald-700 mt-1">Use biometric authentication or security keys to sign in faster and more securely.</p>
                      <Button size="sm" className="mt-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg">
                        Set Up Passkey
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Two-Factor Authentication */}
              <Card className="border-border shadow-lg rounded-2xl">
                <CardHeader className="border-b border-border/60">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 rounded-lg">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Two-Factor Authentication</CardTitle>
                      <CardDescription>Add an extra layer of security</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-slate-600" />
                      <div>
                        <p className="text-sm font-bold">SMS Authentication</p>
                        <p className="text-xs text-slate-500">Receive codes via text message</p>
                      </div>
                    </div>
                    <Switch 
                      checked={twoFactorEnabled}
                      onCheckedChange={(checked) => {
                        setTwoFactorEnabled(checked);
                        toast.success(checked ? "2FA enabled" : "2FA disabled");
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Account Limits */}
              <Card className="border-border shadow-lg rounded-2xl">
                <CardHeader className="border-b border-border/60">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 rounded-lg">
                      <Gauge className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Account Limits</CardTitle>
                      <CardDescription>Set transaction and credit limits</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-600">Daily Cash Out Limit</Label>
                    <Input type="number" defaultValue="500" className="h-11 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-600">Monthly Credit Application Limit</Label>
                    <Input type="number" defaultValue="3" className="h-11 rounded-xl" />
                  </div>
                </CardContent>
              </Card>

              {/* Login History */}
              <Card className="border-border shadow-lg rounded-2xl">
                <CardHeader className="border-b border-border/60">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 rounded-lg">
                      <History className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Login History</CardTitle>
                      <CardDescription>Recent account access activity</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-3">
                  {[
                    { device: "Chrome on Windows", location: "Harare, Zimbabwe", time: "2 hours ago" },
                    { device: "Mobile App on iOS", location: "Bulawayo, Zimbabwe", time: "1 day ago" },
                    { device: "Safari on macOS", location: "Harare, Zimbabwe", time: "3 days ago" },
                  ].map((login, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-4 h-4 text-slate-500" />
                        <div>
                          <p className="text-sm font-bold text-slate-900">{login.device}</p>
                          <p className="text-xs text-slate-500">{login.location} • {login.time}</p>
                        </div>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* API Token */}
              <Card className="border-border shadow-lg rounded-2xl">
                <CardHeader className="border-b border-border/60">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 rounded-lg">
                      <Code className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">API Token</CardTitle>
                      <CardDescription>For developers and integrations</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="p-4 bg-slate-50 rounded-xl font-mono text-xs text-slate-600 flex items-center justify-between">
                    <span>••••••••••••••••••••••••••••</span>
                    <Button size="sm" variant="outline" className="rounded-lg">
                      Regenerate
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Connected Apps */}
              <Card className="border-border shadow-lg rounded-2xl">
                <CardHeader className="border-b border-border/60">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 rounded-lg">
                      <Link2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Connected Apps</CardTitle>
                      <CardDescription>Manage third-party integrations</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-sm text-slate-500 text-center py-8">No connected apps</p>
                </CardContent>
              </Card>

              {/* Self-Exclusion */}
              <Card className="border-red-100 shadow-lg rounded-2xl bg-red-50/30">
                <CardHeader className="border-b border-red-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <UserX className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-red-900">Self-Exclusion</CardTitle>
                      <CardDescription className="text-red-700">Temporarily restrict your account access</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-sm text-slate-600 mb-4">If you need a break from credit services, you can temporarily exclude yourself from applying for new credits.</p>
                  <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-100 rounded-xl">
                    Request Self-Exclusion
                  </Button>
                </CardContent>
              </Card>

              {/* Close Account */}
              <Card className="border-red-100 shadow-lg rounded-2xl bg-red-50/30">
                <CardHeader className="border-b border-red-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <XCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-red-900">Close Your Account</CardTitle>
                      <CardDescription className="text-red-700">Permanently delete your account and data</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-4">
                    <p className="text-sm text-amber-900">
                      <strong>Warning:</strong> This action is irreversible. All your data, wallet balances, and credit history will be permanently deleted.
                    </p>
                  </div>
                  <Button 
                    variant="destructive" 
                    className="bg-red-600 hover:bg-red-700 rounded-xl"
                    onClick={handleCloseAccount}
                  >
                    Close Account
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* CASHIER TAB */}
          {activeTab === 'cashier' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card className="border-border shadow-lg rounded-2xl">
                <CardHeader className="border-b border-border/60">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 rounded-lg">
                      <Wallet className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Payment Methods</CardTitle>
                      <CardDescription>Manage your cash in and cash out options</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between hover:bg-slate-50 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">Ecocash</p>
                        <p className="text-xs text-slate-500">Mobile money</p>
                      </div>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between hover:bg-slate-50 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">InnBucks</p>
                        <p className="text-xs text-slate-500">Mobile money</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="rounded-lg">Add</Button>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between hover:bg-slate-50 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">OneMoney</p>
                        <p className="text-xs text-slate-500">Mobile money</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="rounded-lg">Add</Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* HELP CENTRE TAB */}
          {activeTab === 'help' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card className="border-border shadow-lg rounded-2xl">
                <CardHeader className="border-b border-border/60">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 rounded-lg">
                      <HelpCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Help & Support</CardTitle>
                      <CardDescription>Get assistance and resources</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <button className="w-full p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Scale className="w-5 h-5 text-slate-600" />
                      <div className="text-left">
                        <p className="text-sm font-bold text-slate-900">Responsible Trading</p>
                        <p className="text-xs text-slate-500">Learn about safe credit practices</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button 
                    onClick={() => toast.success("Opening WhatsApp...")}
                    className="w-full p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <MessageCircle className="w-5 h-5 text-green-600" />
                      <div className="text-left">
                        <p className="text-sm font-bold text-slate-900">WhatsApp Support</p>
                        <p className="text-xs text-slate-500">Chat with our support team</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button 
                    onClick={() => toast.success("Starting live chat...")}
                    className="w-full p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-5 h-5 text-emerald-600" />
                      <div className="text-left">
                        <p className="text-sm font-bold text-slate-900">Live Chat</p>
                        <p className="text-xs text-slate-500">Get instant help from our agents</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}