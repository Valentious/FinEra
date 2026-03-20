-- FinEra Learning Hub - Schema Alignment with User Spec
-- This file documents the schema. Prisma manages the actual schema.
-- Run: npx prisma db push (or migrate) for schema changes.

-- users_learning_profiles (UserLearningProfile in Prisma)
-- Fields: user_id, user_type, financial_discipline_score, risk_level, learning_streak_days, last_active_at

-- learning_modules (LearningModule in Prisma)
-- Fields: module_code, title, description, difficulty_level, category, estimated_duration_minutes, prerequisites, content, is_active

-- term_interactions (TermInteraction in Prisma)
-- Fields: user_id, term (string), interaction_type, context_module_id, metadata

-- progress_tracking (ProgressTracking in Prisma)
-- Fields: user_id, module_id, status, progress_percentage, time_spent_seconds, quiz_scores, last_accessed_at, completed_at

-- recommendations_log (RecommendationLog in Prisma)
-- Fields: user_id, recommendation_type, content_id, reason, priority, is_actioned, actioned_at, expires_at
