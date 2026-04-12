/**
 * FinEra Learning Hub - Production Learning System
 * API-driven, interactive, context-aware financial education
 */

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import { Progress } from "@/app/components/ui/progress";
import {
  GraduationCap,
  Award,
  CheckCircle2,
  Clock,
  Trophy,
  Star,
  Target,
  Users,
  TrendingUp,
  CreditCard,
  Lock,
  Crown,
  BookMarked,
  Lightbulb,
  Wallet,
  PiggyBank,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { TermHighlight } from "@/app/components/TermHighlight";
import {
  getLearningModules,
  getFinancialTerms,
  getLearningProgress,
  getLearningRecommendations,
  getLearningContent,
  updateLearningProgress,
  updateLearningProgressSpec,
  logRecommendationShown,
  type LearningModule,
  type FinancialTerm,
  type LearningRecommendation,
  type ProgressItem,
} from "@/services/api";
import type { UserData } from "@/services/api";
import { FineraGradientBackdrop } from "@/app/components/FineraGradientBackdrop";

const ICON_MAP: Record<string, React.ReactNode> = {
  Target: <Target className="w-5 h-5" />,
  PiggyBank: <PiggyBank className="w-5 h-5" />,
  ShieldCheck: <ShieldCheck className="w-5 h-5" />,
  Wallet: <Wallet className="w-5 h-5" />,
  Trophy: <Trophy className="w-5 h-5" />,
  Crown: <Crown className="w-5 h-5" />,
  TrendingUp: <TrendingUp className="w-5 h-5" />,
  CreditCard: <CreditCard className="w-5 h-5" />,
  Lightbulb: <Lightbulb className="w-5 h-5" />,
  BookMarked: <BookMarked className="w-5 h-5" />,
};

const COLOR_MAP: Record<string, string> = {
  emerald: "bg-emerald-50 text-emerald-600",
  green: "bg-green-50 text-green-600",
  red: "bg-red-50 text-red-600",
  purple: "bg-purple-50 text-purple-600",
  amber: "bg-amber-50 text-amber-600",
  yellow: "bg-yellow-50 text-yellow-600",
  pink: "bg-pink-50 text-pink-600",
};

interface FinancialEducationProps {
  onBack: () => void;
  userData?: UserData | null;
}

export function FinancialEducation({ onBack, userData }: FinancialEducationProps) {
  const [learningTab, setLearningTab] = useState<"free" | "premium">("free");
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [terms, setTerms] = useState<FinancialTerm[]>([]);
  const [progress, setProgress] = useState<ProgressItem[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [recommendations, setRecommendations] = useState<LearningRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Try combined /content endpoint first (user spec), then fetch terms for tooltips
      try {
        const [content, termsRes] = await Promise.all([
          getLearningContent(),
          getFinancialTerms(),
        ]);
        setModules(content.modules as unknown as LearningModule[]);
        setTerms((termsRes.success && termsRes.data ? termsRes.data : []) as FinancialTerm[]);
        setProgress(content.modules?.map((m) => ({
          id: "",
          moduleId: m.id,
          status: (m.progress?.status === "COMPLETED" ? "COMPLETED" : m.progress?.status === "IN_PROGRESS" ? "IN_PROGRESS" : "NOT_STARTED") as "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED",
          progressPercent: m.progress?.progress_percentage ?? 0,
          timeSpentSeconds: 0,
          completedAt: null,
          module: m as LearningModule,
        })) ?? []);
        setCompletedCount(content.modules?.filter((m) => m.progress?.status === "COMPLETED").length ?? 0);
        setRecommendations(content.recommendations ?? []);
        (content.recommendations ?? []).forEach((r) => logRecommendationShown(r.type, { reason: r.reason, moduleId: r.moduleId }).catch(() => {}));
        return;
      } catch {
        /* fall through to separate calls */
      }
      const [modRes, termsRes, progressRes, recRes] = await Promise.all([
        getLearningModules(),
        getFinancialTerms(),
        getLearningProgress(),
        getLearningRecommendations(),
      ]);
      if (modRes.success && modRes.data) setModules(modRes.data);
      if (termsRes.success && termsRes.data) setTerms(termsRes.data);
      if (progressRes.success && progressRes.data) {
        setProgress(progressRes.data.progress);
        setCompletedCount(progressRes.data.completedCount);
      }
      if (recRes.success && recRes.data) {
        setRecommendations(recRes.data);
        recRes.data.forEach((r) => logRecommendationShown(r.type, { reason: r.reason, moduleId: r.moduleId }).catch(() => {}));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load learning content");
      setModules([]);
      setTerms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStartModule = async (moduleId: string) => {
    try {
      await updateLearningProgress(moduleId, { status: "IN_PROGRESS", progressPercent: 0 });
      fetchData();
    } catch {
      // Ignore
    }
  };

  const handleCompleteModule = async (moduleId: string, timeSpentSeconds: number) => {
    try {
      try {
        await updateLearningProgressSpec(moduleId, {
          progress_percentage: 100,
          time_spent: timeSpentSeconds,
        });
      } catch {
        await updateLearningProgress(moduleId, {
          status: "COMPLETED",
          progressPercent: 100,
          timeSpentSeconds,
        });
      }
      fetchData();
    } catch {
      // Ignore
    }
  };

  const getProgressForModule = (moduleId: string) =>
    progress.find((p) => p.moduleId === moduleId);

  const filteredModules = modules.filter(
    (m) => m.tier === (learningTab === "free" ? "FREE" : "PREMIUM")
  );

  if (loading && modules.length === 0) {
    return (
      <div className="relative isolate flex min-h-[400px] flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl">
        <FineraGradientBackdrop clip="card" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="font-medium text-foreground">Loading Learning Hub...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative isolate min-h-[min(100%,calc(100dvh-6rem))] overflow-x-hidden pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <FineraGradientBackdrop />
      <div className="relative z-10 space-y-8">
      {/* Header — same stack as SplashScreen (intense green bottom-right) */}
      <div className="relative overflow-hidden rounded-3xl p-8 text-white shadow-2xl">
        <FineraGradientBackdrop clip="card" />
        <div className="relative z-10 max-w-2xl">
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-lg border border-white/20 bg-white/10 p-2 backdrop-blur-md">
              <GraduationCap className="h-6 w-6 text-emerald-100" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-white/85">
              Learning & Growth Hub
            </span>
          </div>
          <h1 className="mb-4 text-4xl font-black leading-tight">Empower Your Financial Future.</h1>
        </div>
      </div>

      {error && (
        <Card className="relative overflow-hidden border-white/25 shadow-md">
          <FineraGradientBackdrop clip="panel" />
          <CardContent className="relative z-10 flex items-center justify-between py-4 text-white">
            <span className="text-sm text-white/95">{error}</span>
            <Button
              variant="outline"
              size="sm"
              className="border-white/50 bg-white/15 text-white hover:bg-white/25"
              onClick={fetchData}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Retry
            </Button>
          </CardContent>
        </Card>
      )}

      <AnimatePresence mode="wait">
        <motion.div
            key="education"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-2 space-y-8">
              {/* Recommendations */}
              {recommendations.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-black text-foreground">For You</h3>
                  {recommendations.map((r, i) => (
                    <Card
                      key={i}
                      className={`relative overflow-hidden p-4 ${r.type === "WARNING" ? "border-white/25 text-white" : "border-slate-100"}`}
                    >
                      {r.type === "WARNING" && <FineraGradientBackdrop clip="panel" />}
                      <div className={`flex gap-3 ${r.type === "WARNING" ? "relative z-10" : ""}`}>
                        {r.type === "WARNING" && (
                          <AlertTriangle className="h-5 w-5 shrink-0 text-white/95" />
                        )}
                        <div>
                          <div className={`font-bold ${r.type === "WARNING" ? "text-white" : "text-foreground"}`}>{r.title}</div>
                          <div className={`text-sm ${r.type === "WARNING" ? "text-white/88" : "text-muted-foreground"}`}>{r.message}</div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              <div className="space-y-6">
                <h2 className="text-3xl font-black text-foreground">Financial Growth Academy</h2>

                <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-200 w-fit">
                  <button
                    onClick={() => setLearningTab("free")}
                    className={`px-8 py-3 rounded-xl text-sm font-black transition-all ${
                      learningTab === "free"
                        ? "bg-white text-foreground shadow-md"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    FREE LESSONS
                  </button>
                  <button
                    onClick={() => setLearningTab("premium")}
                    className={`px-8 py-3 rounded-xl text-sm font-black transition-all ${
                      learningTab === "premium"
                        ? "bg-emerald-600 text-white shadow-md"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    PREMIUM LEARNING
                  </button>
                </div>

                {learningTab === "free" && (
                  <div className="space-y-4">
                    <p className="text-muted-foreground font-medium">
                      Build strong financial discipline before accessing advanced financial tools.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredModules.map((m) => {
                        const prog = getProgressForModule(m.id);
                        const isCompleted = prog?.status === "COMPLETED";
                        return (
                          <Card
                            key={m.id}
                            className="p-6 border-slate-100 hover:border-emerald-100 transition-all cursor-pointer group"
                            onClick={() => handleStartModule(m.id)}
                          >
                            <div
                              className={`p-3 rounded-2xl w-fit mb-4 ${
                                COLOR_MAP[m.color || "emerald"] || "bg-emerald-50 text-emerald-600"
                              } group-hover:scale-110 transition-transform`}
                            >
                              {ICON_MAP[m.icon || "Target"] ?? <Target className="w-5 h-5" />}
                            </div>
                            <h3 className="font-black text-foreground mb-1">{m.title}</h3>
                            {m.description && (
                              <div className="text-sm text-muted-foreground mb-3">
                                <TermHighlight terms={terms} context={`module_${m.slug}`}>
                                  {m.description}
                                </TermHighlight>
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase">
                                <Clock className="w-3 h-3" />
                                {m.durationMinutes ? `${m.durationMinutes} min` : "Self-paced"}
                              </div>
                              {isCompleted ? (
                                <div className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black rounded-full uppercase flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Done
                                </div>
                              ) : (
                                <div className="px-2 py-1 bg-green-50 text-green-600 text-[9px] font-black rounded-full uppercase">
                                  Free Access
                                </div>
                              )}
                            </div>
                            {prog && prog.status === "IN_PROGRESS" && (
                              <Progress value={prog.progressPercent} className="mt-2 h-1" />
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                {learningTab === "premium" && (
                  <div className="space-y-4">
                    <p className="text-muted-foreground font-medium mb-4">
                      Advanced financial intelligence for serious wealth builders.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredModules.map((m) => {
                        const prog = getProgressForModule(m.id);
                        const isCompleted = prog?.status === "COMPLETED";
                        return (
                          <Card
                            key={m.id}
                            className="p-6 border-emerald-100 bg-gradient-to-br from-white to-emerald-50/30 hover:border-emerald-200 transition-all cursor-pointer group relative overflow-hidden"
                            onClick={() => handleStartModule(m.id)}
                          >
                            <div className="absolute top-2 right-2">
                              <Crown className="w-4 h-4 text-amber-500" />
                            </div>
                            <div
                              className={`p-3 rounded-2xl w-fit mb-4 ${
                                COLOR_MAP[m.color || "emerald"] || "bg-emerald-50 text-emerald-600"
                              } group-hover:scale-110 transition-transform`}
                            >
                              {ICON_MAP[m.icon || "Crown"] ?? <Crown className="w-5 h-5" />}
                            </div>
                            <h3 className="font-black text-foreground mb-1 pr-6">{m.title}</h3>
                            {m.description && (
                              <div className="text-sm text-muted-foreground mb-3">
                                <TermHighlight terms={terms} context={`module_${m.slug}`}>
                                  {m.description}
                                </TermHighlight>
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase">
                                <Clock className="w-3 h-3" />
                                {m.durationMinutes ? `${m.durationMinutes} min` : "Self-paced"}
                              </div>
                              <div className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black rounded-full uppercase flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" /> Premium
                              </div>
                            </div>
                            {prog && prog.status === "IN_PROGRESS" && (
                              <Progress value={prog.progressPercent} className="mt-2 h-1" />
                            )}
                          </Card>
                        );
                      })}
                    </div>

                    <Card className="p-6 bg-gradient-to-r from-emerald-600 to-emerald-700 border-none text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-black text-lg mb-1">Upgrade to Premium</h4>
                          <p className="text-emerald-100 text-xs font-medium">
                            Subscription unlocks exclusive learning materials and advanced financial
                            development tools.
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

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="relative overflow-hidden border-none p-6 text-white shadow-2xl">
                <FineraGradientBackdrop clip="card" />
                <div className="relative z-10">
                <Trophy className="w-12 h-12 text-amber-400 mb-4" />
                <h3 className="text-xl font-black mb-2">Academic Rewards</h3>
                <p className="text-emerald-100 text-xs font-medium mb-6 opacity-80">
                  Complete any 3 modules to unlock a Tier-2 Credit Limit upgrade automatically.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase">
                    <span>Progress</span>
                    <span>
                      {completedCount}/3 Modules
                    </span>
                  </div>
                  <Progress
                    value={Math.min(100, (completedCount / 3) * 100)}
                    className="h-2 bg-white/20"
                  />
                </div>
                </div>
              </Card>

              <Card className="p-6 border-slate-100">
                <h4 className="font-black text-foreground mb-4 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  Unlocked Badges
                </h4>
                <div className="flex flex-wrap gap-2">
                  {completedCount >= 1 && (
                    <div className="p-2 bg-amber-50 rounded-xl border border-amber-100">
                      <Star className="w-5 h-5 text-amber-600" />
                    </div>
                  )}
                  {completedCount >= 2 && (
                    <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100">
                      <Target className="w-5 h-5 text-emerald-600" />
                    </div>
                  )}
                  {completedCount >= 3 && (
                    <div className="p-2 bg-amber-50 rounded-xl border border-amber-100">
                      <Trophy className="w-5 h-5 text-amber-600" />
                    </div>
                  )}
                  {completedCount < 1 && (
                    <>
                      <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 opacity-30">
                        <Target className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 opacity-30">
                        <Users className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </>
                  )}
                </div>
              </Card>
            </div>
          </motion.div>
      </AnimatePresence>
      </div>
    </div>
  );
}
