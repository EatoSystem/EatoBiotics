-- ============================================================================
-- GO-LIVE migrations — paste into the Supabase SQL editor (or run with psql)
-- before deploying the AI-cost-guard + trial-win-back work.
--
-- Both statements are idempotent (IF NOT EXISTS), so re-running is safe.
-- These are the same definitions as Migrations 22 & 23 in migrations.sql.
-- ============================================================================

-- Migration 22: ai_usage (per-user daily AI usage counters; service-role only)
CREATE TABLE IF NOT EXISTS ai_usage (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date date        NOT NULL,
  feature    text        NOT NULL,
  count      integer     NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, usage_date, feature)
);
CREATE INDEX IF NOT EXISTS ai_usage_user_date_idx ON ai_usage (user_id, usage_date);
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- Migration 23: email_sends (idempotent lifecycle email log; service-role only)
CREATE TABLE IF NOT EXISTS email_sends (
  id       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email    text        NOT NULL,
  kind     text        NOT NULL,
  user_id  uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  sent_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (email, kind)
);
CREATE INDEX IF NOT EXISTS email_sends_email_idx ON email_sends (email);
ALTER TABLE email_sends ENABLE ROW LEVEL SECURITY;
