import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import { Progress } from "@/app/components/ui/progress";
import { 
  BookOpen, 
  GraduationCap, 
  Award, 
  CheckCircle2, 
  PlayCircle, 
  Clock, 
  ArrowRight,
  Trophy,
  Star,
  Target,
  Users,
  Briefcase,
  TrendingUp,
  DollarSign,
  HeartHandshake,
  UserPlus,
  CreditCard,
  Lock,
  Crown,
  BookMarked,
  Lightbulb,
  Wallet,
  PiggyBank,
  ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FinancialEducationProps {
  onBack: () => void;
  onApplyPartner?: () => void;
}

const freeLessons = [
  { title: "Budgeting Basics", duration: "15 min", icon: <Target className="w-5 h-5" />, color: "bg-emerald-50 text-emerald-600" },
  { title: "Building Saving Habits", duration: "20 min", icon: <PiggyBank className="w-5 h-5" />, color: "bg-green-50 text-green-600" },
  { title: "Understanding Debt Responsibility", duration: "25 min", icon: <ShieldCheck className="w-5 h-5" />, color: "bg-red-50 text-red-600" },
  { title: "Smart Spending Behavior", duration: "18 min", icon: <Wallet className="w-5 h-5" />, color: "bg-purple-50 text-purple-600" },
  { title: "Financial Goal Setting", duration: "22 min", icon: <Trophy className="w-5 h-5" />, color: "bg-amber-50 text-amber-600" },
];

const premiumLessons = [
  { title: "Advanced Financial Discipline Programs", duration: "45 min", icon: <Crown className="w-5 h-5" />, color: "bg-emerald-50 text-emerald-600" },
  { title: "Investment Fundamentals", duration: "60 min", icon: <TrendingUp className="w-5 h-5" />, color: "bg-green-50 text-green-600" },
  { title: "Credit Power Strategy", duration: "50 min", icon: <CreditCard className="w-5 h-5" />, color: "bg-emerald-50 text-emerald-600" },
  { title: "Digital Financial Systems", duration: "40 min", icon: <Lightbulb className="w-5 h-5" />, color: "bg-yellow-50 text-yellow-600" },
  { title: "Curated Financial eBooks & Resources", duration: "Self-paced", icon: <BookMarked className="w-5 h-5" />, color: "bg-pink-50 text-pink-600" },
];

export function FinancialEducation({ onBack, onApplyPartner }: FinancialEducationProps) {
  const [activeTab, setActiveTab] = useState<"education" | "partner">("education");
  const [learningTab, setLearningTab] = useState<"free" | "premium">("free");

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
              <GraduationCap className="w-6 h-6 text-emerald-400" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Learning & Growth Hub</span>
          </div>
          <h1 className="text-4xl font-black mb-4 leading-tight">Empower Your Financial Future.</h1>
          
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 w-fit">
            <button 
              onClick={() => setActiveTab("education")}
              className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'education' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-white'}`}
            >
              ACADEMY
            </button>
            <button 
              onClick={() => setActiveTab("partner")}
              className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'partner' ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-500/30' : 'text-slate-400 hover:text-white'}`}
            >
              PARTNER PROGRAM
            </button>
          </div>
        </div>
        
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[140%] bg-emerald-500/20 rounded-full blur-[80px]" />
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "education" ? (
          <motion.div
            key="education"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-2 space-y-8">
              {/* Financial Growth Academy Header */}
              <div className="space-y-6">
                <h2 className="text-3xl font-black text-slate-900">Financial Growth Academy</h2>
                
                {/* Free/Premium Toggle */}
                <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-200 w-fit">
                  <button 
                    onClick={() => setLearningTab("free")}
                    className={`px-8 py-3 rounded-xl text-sm font-black transition-all ${learningTab === 'free' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    FREE LESSONS
                  </button>
                  <button 
                    onClick={() => setLearningTab("premium")}
                    className={`px-8 py-3 rounded-xl text-sm font-black transition-all ${learningTab === 'premium' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    PREMIUM LEARNING
                  </button>
                </div>

                {/* Free Lessons Section */}
                {learningTab === "free" && (
                  <div className="space-y-4">
                    <p className="text-slate-600 font-medium">
                      Build strong financial discipline before accessing advanced financial tools.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {freeLessons.map((m, i) => (
                        <Card key={i} className="p-6 border-slate-100 hover:border-emerald-100 transition-all cursor-pointer group">
                          <div className={`p-3 rounded-2xl w-fit mb-4 ${m.color} group-hover:scale-110 transition-transform`}>
                            {m.icon}
                          </div>
                          <h3 className="font-black text-slate-900 mb-1">{m.title}</h3>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                              <Clock className="w-3 h-3" /> {m.duration}
                            </div>
                            <div className="px-2 py-1 bg-green-50 text-green-600 text-[9px] font-black rounded-full uppercase">
                              Free Access
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Premium Learning Section */}
                {learningTab === "premium" && (
                  <div className="space-y-4">
                    <p className="text-slate-600 font-medium mb-4">
                      Advanced financial intelligence for serious wealth builders.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {premiumLessons.map((m, i) => (
                        <Card key={i} className="p-6 border-emerald-100 bg-gradient-to-br from-white to-emerald-50/30 hover:border-emerald-200 transition-all cursor-pointer group relative overflow-hidden">
                          <div className="absolute top-2 right-2">
                            <Crown className="w-4 h-4 text-amber-500" />
                          </div>
                          <div className={`p-3 rounded-2xl w-fit mb-4 ${m.color} group-hover:scale-110 transition-transform`}>
                            {m.icon}
                          </div>
                          <h3 className="font-black text-slate-900 mb-1 pr-6">{m.title}</h3>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                              <Clock className="w-3 h-3" /> {m.duration}
                            </div>
                            <div className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black rounded-full uppercase flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" /> Premium
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                    
                    {/* Upgrade Button */}
                    <Card className="p-6 bg-gradient-to-r from-emerald-600 to-emerald-700 border-none text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-black text-lg mb-1">Upgrade to Premium</h4>
                          <p className="text-emerald-100 text-xs font-medium">
                            Subscription unlocks exclusive learning materials and advanced financial development tools.
                          </p>
                        </div>
                        <Button className="bg-white text-emerald-600 hover:bg-emerald-50 font-black rounded-xl px-6 whitespace-nowrap">
                          Get Premium
                        </Button>
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Achievements */}
            <div className="space-y-6">
              <Card className="p-6 bg-gradient-to-br from-emerald-600 to-emerald-800 text-white border-none shadow-2xl">
                <Trophy className="w-12 h-12 text-amber-400 mb-4" />
                <h3 className="text-xl font-black mb-2">Academic Rewards</h3>
                <p className="text-emerald-100 text-xs font-medium mb-6 opacity-80">Complete any 3 modules to unlock a Tier-2 Credit Limit upgrade automatically.</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase">
                    <span>Progress</span>
                    <span>1/3 Modules</span>
                  </div>
                  <Progress value={33} className="h-2 bg-white/20" />
                </div>
              </Card>

              <Card className="p-6 border-slate-100">
                <h4 className="font-black text-slate-900 mb-4 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  Unlocked Badges
                </h4>
                <div className="flex flex-wrap gap-2">
                  <div className="p-2 bg-amber-50 rounded-xl border border-amber-100">
                    <Star className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 opacity-30">
                    <Target className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 opacity-30">
                    <Users className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
              </Card>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="partner"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-8 border-none bg-white shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500" />
                <div className="relative z-10">
                  <Users className="w-10 h-10 text-emerald-600 mb-6" />
                  <h3 className="text-xl font-black text-slate-900 mb-2">Become an Agent</h3>
                  <p className="text-slate-500 text-sm font-medium mb-6">Earn commissions by facilitating deposits and withdrawals for your community.</p>
                  <Button 
                    onClick={onApplyPartner}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl"
                  >
                    Start Application
                  </Button>
                </div>
              </Card>

              <Card className="p-8 border-none bg-white shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500" />
                <div className="relative z-10">
                  <DollarSign className="w-10 h-10 text-green-600 mb-6" />
                  <h3 className="text-xl font-black text-slate-900 mb-2">Earnings Calculator</h3>
                  <p className="text-slate-500 text-sm font-medium mb-6">Estimate your monthly revenue based on transaction volume and community size.</p>
                  <Button variant="outline" className="w-full border-slate-200 font-black rounded-xl">Calculate Revenue</Button>
                </div>
              </Card>

              <Card className="p-8 border-none bg-white shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500" />
                <div className="relative z-10">
                  <Briefcase className="w-10 h-10 text-amber-600 mb-6" />
                  <h3 className="text-xl font-black text-slate-900 mb-2">Agent Benefits</h3>
                  <p className="text-slate-500 text-sm font-medium mb-6">Priority support, marketing materials, and certified agent branding for your kiosk.</p>
                  <Button variant="outline" className="w-full border-slate-200 font-black rounded-xl">View Benefits</Button>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="text-2xl font-black text-slate-900">Agent Onboarding Flow</h3>
                <div className="space-y-4">
                  {[
                    { step: 1, title: "KYC Verification", desc: "Upload business license or student ID for vetting." },
                    { step: 2, title: "Training Workshop", desc: "Complete 3 essential modules on secure cash handling." },
                    { step: 3, title: "Float Setup", desc: "Initialize your agent wallet with minimum required capital." },
                    { step: 4, title: "Go Live", desc: "Start appearing on the platform's nearby agent map." }
                  ].map((s, i) => (
                    <div key={i} className="flex gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                      <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black shrink-0">
                        {s.step}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900">{s.title}</h4>
                        <p className="text-slate-500 text-xs font-medium">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Card className="p-8 border-slate-100 bg-slate-50 flex flex-col items-center justify-center text-center">
                <UserPlus className="w-16 h-16 text-emerald-600 mb-4" />
                <h3 className="text-2xl font-black text-slate-900 mb-2">Join 450+ Campus Agents</h3>
                <p className="text-slate-500 font-medium mb-6 max-w-xs">Facilitate academic financial inclusion and earn a steady income while you study or work.</p>
                <Button className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-lg font-black shadow-xl shadow-emerald-100">
                  Join Partner Network
                </Button>
              </Card>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}