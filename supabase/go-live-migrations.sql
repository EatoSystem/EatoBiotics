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

-- Migration 24: Stability module persistence (RLS-scoped to the owner)
CREATE TABLE IF NOT EXISTS stability_assessments (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  answers    jsonb       NOT NULL,
  flags      jsonb       NOT NULL,
  score      jsonb       NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE stability_assessments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='stability_assessments' AND policyname='users_manage_own_stability_assessments') THEN
    CREATE POLICY "users_manage_own_stability_assessments" ON stability_assessments
      FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS stability_logs (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date   date        NOT NULL,
  data       jsonb       NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, log_date)
);
CREATE INDEX IF NOT EXISTS stability_logs_user_date_idx ON stability_logs (user_id, log_date DESC);
ALTER TABLE stability_logs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='stability_logs' AND policyname='users_manage_own_stability_logs') THEN
    CREATE POLICY "users_manage_own_stability_logs" ON stability_logs
      FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;


-- Migration 25: assessment_journeys (foundation→add-on journey persistence)
CREATE TABLE IF NOT EXISTS assessment_journeys (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  journey    jsonb       NOT NULL,
  summaries  jsonb       NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE assessment_journeys ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='assessment_journeys' AND policyname='users_manage_own_assessment_journeys') THEN
    CREATE POLICY "users_manage_own_assessment_journeys" ON assessment_journeys
      FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;
