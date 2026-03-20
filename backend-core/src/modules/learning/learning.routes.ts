/**
 * FinEra Learning Hub - API Routes
 * JWT-protected endpoints for learning content, progress, terms, and recommendations
 */

import { Router } from "express";
import { prisma } from "../../infrastructure/database/index.js";
import { authMiddleware } from "../../middlewares/auth.js";
import * as learningService from "./learning.service.js";

const router = Router();

router.use(authMiddleware);

/** GET /learning/modules - List all published modules (free + premium) */
router.get("/modules", async (req, res, next) => {
  try {
    const tier = req.query.tier as string | undefined;
    const where: Record<string, unknown> = { status: "PUBLISHED" };
    if (tier === "FREE" || tier === "PREMIUM") where.tier = tier;

    const modules = await prisma.learningModule.findMany({
      where,
      orderBy: { orderIndex: "asc" },
    });
    res.json({ success: true, data: modules });
  } catch (e) {
    next(e);
  }
});

/** GET /learning/terms - List all financial terms for tooltips */
router.get("/terms", async (_req, res, next) => {
  try {
    const terms = await prisma.financialTerm.findMany({
      orderBy: { term: "asc" },
    });
    res.json({ success: true, data: terms });
  } catch (e) {
    next(e);
  }
});

/** GET /learning/terms/:slug - Get single term by slug */
router.get("/terms/:slug", async (req, res, next) => {
  try {
    const term = await prisma.financialTerm.findUnique({
      where: { slug: req.params.slug },
    });
    if (!term) {
      res.status(404).json({ success: false, message: "Term not found" });
      return;
    }
    res.json({ success: true, data: term });
  } catch (e) {
    next(e);
  }
});

/** POST /learning/terms/interact - Record term interaction (click/hover/ask_ai) */
router.post("/terms/interact", async (req, res, next) => {
  try {
    const { termSlug, term, interactionType, context, contextModuleId } = req.body as {
      termSlug?: string;
      term?: string;
      interactionType: string;
      context?: string;
      contextModuleId?: string;
    };
    const termKey = term ?? termSlug;
    if (!termKey || !interactionType) {
      res.status(400).json({ success: false, message: "term/termSlug and interactionType required" });
      return;
    }
    const result = await learningService.recordTermInteraction(
      req.user!.id,
      termKey,
      interactionType,
      contextModuleId,
      context
    );
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
});

/** POST /learning/term-interaction - Alias for user spec (term, interaction_type, context_module_id) */
router.post("/term-interaction", async (req, res, next) => {
  try {
    const { term, interaction_type, context_module_id } = req.body as {
      term: string;
      interaction_type: string;
      context_module_id?: string;
    };
    if (!term || !interaction_type) {
      res.status(400).json({ success: false, message: "term and interaction_type required" });
      return;
    }
    const result = await learningService.recordTermInteraction(
      req.user!.id,
      term,
      interaction_type,
      context_module_id
    );
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
});

/** GET /learning/term/:term - Get term definition with contextual relevance (user spec) */
router.get("/term/:term", async (req, res, next) => {
  try {
    const termKey = req.params.term.toLowerCase().replace(/\s+/g, "-");
    const term = await prisma.financialTerm.findFirst({
      where: {
        OR: [{ slug: termKey }, { term: { equals: req.params.term, mode: "insensitive" } }],
      },
    });
    const profile = await prisma.userLearningProfile.findUnique({
      where: { userId: req.user!.id },
      select: { riskLevel: true, financialDisciplineScore: true },
    });
    const contextual =
      profile?.riskLevel === "high" || profile?.riskLevel === "critical"
        ? "Your current credit utilization suggests focusing on improving this metric."
        : "You're maintaining good credit practices. Keep it up!";
    if (!term) {
      res.json({
        simple: "Financial term related to your learning journey",
        advanced: "This term appears in your current learning context",
        example: "Understanding this concept helps in making better financial decisions",
        contextual,
      });
      return;
    }
    res.json({
      simple: term.simpleDefinition,
      advanced: term.advancedDefinition ?? term.simpleDefinition,
      example: term.example ?? "Understanding this concept helps in making better financial decisions",
      contextual,
    });
  } catch (e) {
    next(e);
  }
});

/** GET /learning/progress - Get user's progress across all modules */
router.get("/progress", async (req, res, next) => {
  try {
    const progress = await learningService.getProgress(req.user!.id);
    const completedCount = progress.filter((p) => p.status === "COMPLETED").length;
    res.json({
      success: true,
      data: { progress, completedCount, totalModules: 10 },
    });
  } catch (e) {
    next(e);
  }
});

/** PUT /learning/progress/:moduleId - Update progress for a module */
router.put("/progress/:moduleId", async (req, res, next) => {
  try {
    const { status, progressPercent, timeSpentSeconds } = req.body as {
      status?: string;
      progressPercent?: number;
      timeSpentSeconds?: number;
    };
    const result = await learningService.updateProgress(req.user!.id, req.params.moduleId, {
      status: status as "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | undefined,
      progressPercent,
      timeSpentSeconds,
    });
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
});

/** GET /learning/recommendations - Context-aware recommendations */
router.get("/recommendations", async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { accountType: true },
    });
    const creditProfile = await prisma.creditProfile.findUnique({
      where: { userId: req.user!.id },
      select: { financialDisciplineScore: true },
    });
    const loans = await prisma.loan.count({
      where: { userId: req.user!.id, status: { in: ["ACTIVE", "PENDING"] } },
    });
    const repayments = await prisma.repayment.count({
      where: { userId: req.user!.id, status: "DEFAULTED" },
    });

    const context: learningService.UserContext = {
      userId: req.user!.id,
      accountType: user!.accountType,
      disciplineScore: creditProfile?.financialDisciplineScore,
      missedPayments: repayments,
      activeLoans: loans,
      hasActiveLoan: loans > 0,
    };

    const recommendations = await learningService.getRecommendations(req.user!.id, context);
    res.json({ success: true, data: recommendations });
  } catch (e) {
    next(e);
  }
});

/** POST /learning/recommendations/log - Log recommendation shown */
router.post("/recommendations/log", async (req, res, next) => {
  try {
    const { type, moduleId, termId, context, reason } = req.body as {
      type: string;
      moduleId?: string;
      termId?: string;
      context?: string;
      reason?: string;
    };
    if (!type) {
      res.status(400).json({ success: false, message: "type required" });
      return;
    }
    const result = await learningService.logRecommendationShown(
      req.user!.id,
      type,
      moduleId,
      termId,
      context,
      reason
    );
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
});

/** GET /learning/profile - Get user learning profile */
router.get("/profile", async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { accountType: true },
    });
    const profile = await learningService.getOrCreateLearningProfile(
      req.user!.id,
      user?.accountType?.toLowerCase()
    );
    res.json(profile);
  } catch (e) {
    next(e);
  }
});

/** GET /learning/content - Combined endpoint: modules + progress + recommendations (user spec) */
router.get("/content", async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { accountType: true },
    });
    const profile = await learningService.getOrCreateLearningProfile(
      req.user!.id,
      user?.accountType?.toLowerCase()
    );
    const creditProfile = await prisma.creditProfile.findUnique({
      where: { userId: req.user!.id },
      select: { financialDisciplineScore: true },
    });
    const disciplineScore = Number(creditProfile?.financialDisciplineScore ?? profile.financialDisciplineScore ?? 0);

    const modules = await prisma.learningModule.findMany({
      where: { status: "PUBLISHED", isActive: true },
      orderBy: [{ difficultyLevel: "asc" }, { orderIndex: "asc" }],
      take: 10,
    });

    const progress = await prisma.progressTracking.findMany({
      where: { userId: req.user!.id },
      include: { module: true },
    });

    const modulesWithProgress = modules.map((m) => {
      const p = progress.find((p) => p.moduleId === m.id);
      return {
        ...m,
        progress: {
          status: p?.status ?? "NOT_STARTED",
          progress_percentage: p?.progressPercent ?? 0,
          progressPercent: p?.progressPercent ?? 0,
        },
      };
    });

    const context: learningService.UserContext = {
      userId: req.user!.id,
      accountType: user!.accountType,
      disciplineScore,
      hasActiveLoan: (await prisma.loan.count({ where: { userId: req.user!.id, status: { in: ["ACTIVE", "PENDING"] } } })) > 0,
    };
    const recommendations = await learningService.getRecommendations(req.user!.id, context);

    res.json({
      modules: modulesWithProgress,
      profile: {
        ...profile,
        financial_discipline_score: Number(profile.financialDisciplineScore),
        learning_streak_days: profile.learningStreakDays,
        last_active_at: profile.lastActiveAt,
      },
      recommendations,
      financialTerms: (await prisma.financialTerm.findMany({ orderBy: { term: "asc" } })).map((t) => t.term),
    });
  } catch (e) {
    next(e);
  }
});

/** POST /learning/progress - Update progress (user spec: module_id, progress_percentage, time_spent, quiz_scores) */
router.post("/progress", async (req, res, next) => {
  try {
    const { module_id, progress_percentage, time_spent, quiz_scores } = req.body as {
      module_id: string;
      progress_percentage?: number;
      time_spent?: number;
      quiz_scores?: unknown[];
    };
    if (!module_id) {
      res.status(400).json({ success: false, message: "module_id required" });
      return;
    }
    const result = await learningService.updateProgress(req.user!.id, module_id, {
      progressPercent: progress_percentage ?? 0,
      progressPercentage: progress_percentage ?? 0,
      timeSpentSeconds: time_spent ?? 0,
      quizScores: quiz_scores,
      status: (progress_percentage ?? 0) >= 100 ? "COMPLETED" : "IN_PROGRESS",
    });
    res.json(result);
  } catch (e) {
    next(e);
  }
});

export default router;
