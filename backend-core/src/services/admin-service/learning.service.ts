/**
 * FinEra Learning Hub - Service Layer
 * Context-aware learning engine, recommendations, and progress tracking
 */

import { prisma } from "../../infrastructure/database/index.js";
import type { AccountType } from "@prisma/client";

export interface UserContext {
  userId: string;
  accountType: AccountType;
  disciplineScore?: number;
  missedPayments?: number;
  activeLoans?: number;
  hasActiveLoan?: boolean;
}

/** Get or create user learning profile */
export async function getOrCreateLearningProfile(userId: string, userType?: string) {
  let profile = await prisma.userLearningProfile.findUnique({
    where: { userId },
  });
  if (!profile) {
    profile = await prisma.userLearningProfile.create({
      data: {
        userId,
        userType: userType || "student",
      },
    });
  }
  return profile;
}

/** Get user progress for modules */
export async function getProgress(userId: string) {
  const progress = await prisma.progressTracking.findMany({
    where: { userId },
    include: { module: true },
  });
  return progress;
}

/** Get user's completed module count */
export async function getCompletedModuleCount(userId: string): Promise<number> {
  return prisma.progressTracking.count({
    where: { userId, status: "COMPLETED" },
  });
}

/** Record term interaction (click, hover, ask_ai) - supports term string and contextModuleId */
export async function recordTermInteraction(
  userId: string,
  term: string,
  interactionType: string,
  contextModuleId?: string,
  context?: string
) {
  const slug = term.toLowerCase().replace(/\s+/g, "-");
  const ft = await prisma.financialTerm.findFirst({
    where: {
      OR: [{ slug }, { term: { equals: term, mode: "insensitive" } }],
    },
  });
  return prisma.termInteraction.create({
    data: {
      userId,
      term: ft?.term ?? term,
      termId: ft?.id,
      interactionType,
      contextModuleId: contextModuleId ?? undefined,
      context: context ?? undefined,
    },
  });
}

/** Update progress for a module - supports progress_percentage, time_spent, quiz_scores */
export async function updateProgress(
  userId: string,
  moduleId: string,
  data: {
    status?: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
    progressPercent?: number;
    progressPercentage?: number;
    timeSpentSeconds?: number;
    quizScores?: unknown[];
  }
) {
  const progressPct = data.progressPercent ?? data.progressPercentage ?? 0;
  const isComplete = progressPct >= 100 || data.status === "COMPLETED";

  if (data.timeSpentSeconds !== undefined) {
    const existing = await prisma.progressTracking.findUnique({
      where: { userId_moduleId: { userId, moduleId } },
    });
    const addTime = existing ? existing.timeSpentSeconds + data.timeSpentSeconds : data.timeSpentSeconds;
    data = { ...data, timeSpentSeconds: addTime } as typeof data;
  }

  return prisma.progressTracking.upsert({
    where: { userId_moduleId: { userId, moduleId } },
    create: {
      userId,
      moduleId,
      status: isComplete ? "COMPLETED" : (data.status ?? "IN_PROGRESS"),
      progressPercent: progressPct,
      timeSpentSeconds: data.timeSpentSeconds ?? 0,
      quizScores: data.quizScores ? JSON.parse(JSON.stringify(data.quizScores)) : undefined,
      lastAccessedAt: new Date(),
      completedAt: isComplete ? new Date() : null,
    },
    update: {
      ...(data.status && { status: isComplete ? "COMPLETED" : data.status }),
      ...(progressPct > 0 && { progressPercent: progressPct }),
      ...(data.timeSpentSeconds !== undefined && { timeSpentSeconds: data.timeSpentSeconds }),
      ...(data.quizScores && { quizScores: JSON.parse(JSON.stringify(data.quizScores)) }),
      lastAccessedAt: new Date(),
      ...(isComplete && { completedAt: new Date(), status: "COMPLETED" as const }),
    },
    include: { module: true },
  });
}

/** Get context-aware recommendations for user */
export async function getRecommendations(
  userId: string,
  context: UserContext
): Promise<
  Array<{
    type: "LESSON" | "MICRO_COURSE" | "WARNING" | "NUDGE";
    moduleId?: string;
    moduleSlug?: string;
    title: string;
    message: string;
    reason?: string;
  }>
> {
  const recommendations: Array<{
    type: "LESSON" | "MICRO_COURSE" | "WARNING" | "NUDGE";
    moduleId?: string;
    moduleSlug?: string;
    title: string;
    message: string;
    reason?: string;
  }> = [];

  const completedCount = await getCompletedModuleCount(userId);
  const profile = await getOrCreateLearningProfile(userId);

  // Warning: default risk - also create notification for real-time communication
  if ((context.missedPayments ?? 0) > 0 && context.hasActiveLoan) {
    const mod = await prisma.learningModule.findUnique({
      where: { slug: "understanding-debt-responsibility" },
    });
    recommendations.push({
      type: "WARNING",
      moduleId: mod?.id,
      moduleSlug: "understanding-debt-responsibility",
      title: "You are at risk of default",
      message: "You have missed payments. Complete 'Understanding Debt Responsibility' to learn how to stay on track.",
      reason: "missed_payments",
    });
    // Push notification for real-time user communication
    await prisma.notification.create({
      data: {
        userId,
        type: "DEFAULT_WARNING",
        priority: "HIGH",
        title: "Default risk warning",
        message: "You have missed payments. Visit the Learning Hub to learn how to stay on track.",
        data: { moduleSlug: "understanding-debt-responsibility" },
        actionUrl: "/financialEducation",
      },
    }).catch(() => {});
  }

  // Nudge: low completion
  if (completedCount < 3) {
    recommendations.push({
      type: "NUDGE",
      moduleSlug: "budgeting-basics",
      title: "Start your learning journey",
      message: "Complete 3 modules to unlock a Tier-2 Credit Limit upgrade automatically.",
      reason: "low_completion",
    });
  }

  // Lesson: weak areas
  if (profile.weakKnowledgeAreas.length > 0) {
    const weak = profile.weakKnowledgeAreas[0];
    recommendations.push({
      type: "LESSON",
      title: "Strengthen your knowledge",
      message: `You may want to revisit content related to "${weak}".`,
      reason: "weak_area",
    });
  }

  // Nudge: understanding interest - push notification for real-time communication
  if (context.hasActiveLoan && completedCount < 2) {
    const mod = await prisma.learningModule.findUnique({
      where: { slug: "understanding-debt-responsibility" },
    });
    recommendations.push({
      type: "NUDGE",
      moduleId: mod?.id,
      moduleSlug: "understanding-debt-responsibility",
      title: "Do you understand interest accumulation?",
      message: "Learn how interest affects your loan balance.",
      reason: "active_loan_education",
    });
    await prisma.notification.create({
      data: {
        userId,
        type: "LEARNING_NUDGE",
        priority: "MEDIUM",
        title: "Do you understand interest accumulation?",
        message: "Learn how interest affects your loan balance in the Learning Hub.",
        data: { moduleSlug: "understanding-debt-responsibility" },
        actionUrl: "/financialEducation",
      },
    }).catch(() => {});
  }

  return recommendations.slice(0, 5);
}

/** Log when a recommendation is shown */
export async function logRecommendationShown(
  userId: string,
  type: string,
  moduleId?: string,
  termId?: string,
  context?: string,
  reason?: string
) {
  return prisma.recommendationLog.create({
    data: {
      userId,
      type: type as "LESSON" | "MICRO_COURSE" | "WARNING" | "NUDGE",
      moduleId,
      contentId: moduleId,
      termId,
      context,
      reason,
    },
  });
}
