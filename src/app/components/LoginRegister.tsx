import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { motion } from "motion/react";
import { LogIn, UserPlus, Mail, Lock, User, ShieldCheck, Phone, ArrowLeft } from "lucide-react";

interface LoginRegisterProps {
  onLogin: (email: string) => void;
  onRegister: (data: any) => void;
  onBack?: () => void;
}

export function LoginRegister({ onLogin, onRegister, onBack }: LoginRegisterProps) {
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({ 
    fullName: "", 
    phoneNumber: "",
    email: "", 
    password: "", 
    confirmPassword: "" 
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(loginData.email);
  };

  const passwordsMatch = registerData.password === registerData.confirmPassword;
  const showPasswordMismatch = registerData.confirmPassword.length > 0 && !passwordsMatch;

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (registerData.password !== registerData.confirmPassword) {
      return; // Validation prevents submission
    }
    const { confirmPassword, ...dataToSubmit } = registerData;
    onRegister(dataToSubmit);
  };

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
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">FinEra INCLUSIVE CREDIT</h1>
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
                          className="pl-10 h-12 rounded-lg border-slate-200 focus:ring-indigo-500"
                          value={loginData.email}
                          onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                          required 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <Button variant="link" className="px-0 h-auto text-xs text-indigo-600">Forgot password?</Button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                          id="password" 
                          type="password" 
                          className="pl-10 h-12 rounded-lg border-slate-200 focus:ring-indigo-500"
                          value={loginData.password}
                          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          required 
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold text-lg transition-all active:scale-[0.98]">
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
                      <Label htmlFor="reg-phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                          id="reg-phone" 
                          type="tel" 
                          placeholder="123-456-7890" 
                          className="pl-10 h-12 rounded-lg"
                          value={registerData.phoneNumber}
                          onChange={(e) => setRegisterData({ ...registerData, phoneNumber: e.target.value })}
                          required 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-email">University Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                          id="reg-email" 
                          type="email" 
                          placeholder="j.doe@campus.edu" 
                          className="pl-10 h-12 rounded-lg"
                          value={registerData.email}
                          onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                          required 
                        />
                      </div>
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
                      className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold text-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
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
          By continuing, you agree to our <span className="text-indigo-600 font-medium">Terms of Service</span> and <span className="text-indigo-600 font-medium">Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
}