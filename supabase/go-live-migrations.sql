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


-- Migration 26: leads waitlist segmentation columns (ADD-only, idempotent)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS country        text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS diet           text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS main_goal      text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS food_challenge text;


-- Migration 27: widen leads.assessment_type CHECK (allow family + waitlist)
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_assessment_type_check;
ALTER TABLE leads ADD CONSTRAINT leads_assessment_type_check
  CHECK (assessment_type = ANY (ARRAY['gut'::text, 'mind'::text, 'family'::text, 'waitlist'::text]));


-- ────────────────────────────────────────────────────────────
-- Migration 28: RLS consolidation + initplan perf + meal_scans tightening
-- ────────────────────────────────────────────────────────────
-- Collapses the 3 layered generations of RLS policies into one optimized policy
-- per table (the old public-role ALL/SELECT twins are dropped), wraps every
-- auth.uid()/auth.jwt() call in a scalar subselect so it is evaluated once per
-- query (not per row), drops the public WITH CHECK(true) meal_scans INSERT
-- (server inserts via the service role, which bypasses RLS), and adds covering
-- indexes for previously-unindexed foreign keys. Non-regressive: no client code
-- writes these tables; all writes go through the service role.

-- Own-row FOR ALL (authenticated)
DROP POLICY IF EXISTS "Users see own profile" ON profiles;
DROP POLICY IF EXISTS "profiles: own row" ON profiles;
DROP POLICY IF EXISTS "users_read_own_profile" ON profiles;
CREATE POLICY "profiles_own" ON profiles FOR ALL TO authenticated
  USING ((select auth.uid()) = id) WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users see own plate" ON plate_data;
DROP POLICY IF EXISTS "plate_data: own row" ON plate_data;
DROP POLICY IF EXISTS "users_manage_own_plate_data" ON plate_data;
CREATE POLICY "plate_data_own" ON plate_data FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users see own journal" ON journal_entries;
DROP POLICY IF EXISTS "journal_entries: own rows" ON journal_entries;
DROP POLICY IF EXISTS "users_manage_own_journal_entries" ON journal_entries;
CREATE POLICY "journal_entries_own" ON journal_entries FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "analyses: own rows" ON analyses;
DROP POLICY IF EXISTS "users_insert_own_analyses" ON analyses;
DROP POLICY IF EXISTS "users_read_own_analyses" ON analyses;
CREATE POLICY "analyses_own" ON analyses FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "consultations: own rows" ON consultations;
DROP POLICY IF EXISTS "users_read_own_consultations" ON consultations;
CREATE POLICY "consultations_own" ON consultations FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "subscription_events: own rows" ON subscription_events;
DROP POLICY IF EXISTS "users_read_own_subscription_events" ON subscription_events;
CREATE POLICY "subscription_events_own" ON subscription_events FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "weekly_checkins: own rows" ON weekly_checkins;
DROP POLICY IF EXISTS "users_read_own_checkins" ON weekly_checkins;
CREATE POLICY "weekly_checkins_own" ON weekly_checkins FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "users_manage_own_meal_plans" ON meal_plans;
CREATE POLICY "meal_plans_own" ON meal_plans FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "users_manage_own_food_protocols" ON food_protocols;
CREATE POLICY "food_protocols_own" ON food_protocols FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

-- SELECT-only (authenticated), richer email/JWT fallbacks, fully wrapped
DROP POLICY IF EXISTS "leads: own row" ON leads;
DROP POLICY IF EXISTS "users_read_own_leads" ON leads;
CREATE POLICY "leads_own_read" ON leads FOR SELECT TO authenticated
  USING (((user_id IS NOT NULL) AND (user_id = (select auth.uid())))
      OR ((email IS NOT NULL) AND (email = ((select auth.jwt()) ->> 'email'::text))));

DROP POLICY IF EXISTS "deep_assessments: own rows" ON deep_assessments;
DROP POLICY IF EXISTS "users_read_own_deep_assessments" ON deep_assessments;
CREATE POLICY "deep_assessments_own_read" ON deep_assessments FOR SELECT TO authenticated
  USING (((user_id IS NOT NULL) AND (user_id = (select auth.uid())))
      OR ((email IS NOT NULL) AND (email = ((select auth.jwt()) ->> 'email'::text))));

DROP POLICY IF EXISTS "Users see own referrals" ON referrals;
DROP POLICY IF EXISTS "users_read_own_referrals" ON referrals;
CREATE POLICY "referrals_own_read" ON referrals FOR SELECT TO authenticated
  USING ((referrer_code IN (SELECT profiles.referral_code FROM profiles WHERE (profiles.id = (select auth.uid()))))
      OR (referred_id = (select auth.uid()))
      OR ((referred_email IS NOT NULL) AND (referred_email = ((select auth.jwt()) ->> 'email'::text))));

DROP POLICY IF EXISTS "users_read_own_plans" ON monthly_gut_plans;
CREATE POLICY "monthly_gut_plans_own_read" ON monthly_gut_plans FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "users_read_own_monthly_reviews" ON monthly_reviews;
CREATE POLICY "monthly_reviews_own_read" ON monthly_reviews FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

-- food_intelligence_reports: public -> authenticated, wrapped
DROP POLICY IF EXISTS "Users can read own food intelligence reports" ON food_intelligence_reports;
DROP POLICY IF EXISTS "Users can insert own food intelligence reports" ON food_intelligence_reports;
CREATE POLICY "fir_own_read" ON food_intelligence_reports FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);
CREATE POLICY "fir_own_insert" ON food_intelligence_reports FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- meal_scans: drop the public WITH CHECK(true) INSERT (service role still inserts)
DROP POLICY IF EXISTS "meal_scans_insert" ON meal_scans;

-- Re-wrap policies on the Migration 17-25 tables (they used bare auth.uid())
DROP POLICY IF EXISTS "owners_manage_household_members" ON household_members;
CREATE POLICY "owners_manage_household_members" ON household_members FOR ALL TO authenticated
  USING (owner_id = (select auth.uid())) WITH CHECK (owner_id = (select auth.uid()));

DROP POLICY IF EXISTS "users_manage_own_glp1_logs" ON glp1_logs;
CREATE POLICY "users_manage_own_glp1_logs" ON glp1_logs FOR ALL TO authenticated
  USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "users_manage_own_glp1_profile" ON glp1_profile;
CREATE POLICY "users_manage_own_glp1_profile" ON glp1_profile FOR ALL TO authenticated
  USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "users_manage_own_stability_assessments" ON stability_assessments;
CREATE POLICY "users_manage_own_stability_assessments" ON stability_assessments FOR ALL TO authenticated
  USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "users_manage_own_stability_logs" ON stability_logs;
CREATE POLICY "users_manage_own_stability_logs" ON stability_logs FOR ALL TO authenticated
  USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "users_manage_own_assessment_journeys" ON assessment_journeys;
CREATE POLICY "users_manage_own_assessment_journeys" ON assessment_journeys FOR ALL TO authenticated
  USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

-- Covering indexes for unindexed foreign keys
CREATE INDEX IF NOT EXISTS idx_monthly_gut_plans_user_id ON monthly_gut_plans (user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals (referred_id);
CREATE INDEX IF NOT EXISTS idx_weekly_checkins_user_id ON weekly_checkins (user_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_user_id ON email_sends (user_id);


-- Migration 29: leads share/referral columns (ADD-only, idempotent)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS share_code     text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS referred_by    text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS referral_count integer NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX IF NOT EXISTS leads_share_code_key ON leads (share_code) WHERE share_code IS NOT NULL;


-- Migration 30: leads.reward_code (invite-to-unlock reward; ADD-only, idempotent)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS reward_code text;


-- Migration 31: leads UTM attribution columns (ADD-only, idempotent)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_source   text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_medium   text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_campaign text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_content  text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_term     text;


-- Migration 32: email_optouts (central unsubscribe ledger; service-role only)
CREATE TABLE IF NOT EXISTS email_optouts (
  email      text        PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  source     text
);
ALTER TABLE email_optouts ENABLE ROW LEVEL SECURITY;


-- Migration 33: deep_assessments per-step status tracking (ADD-only, idempotent)
-- Makes each stage of the paid-report pipeline (report → PDF → upload → email)
-- visible in the DB so a failed PDF/email is never hidden behind status='complete'.
ALTER TABLE deep_assessments ADD COLUMN IF NOT EXISTS report_status text;
ALTER TABLE deep_assessments ADD COLUMN IF NOT EXISTS pdf_status    text;
ALTER TABLE deep_assessments ADD COLUMN IF NOT EXISTS email_status  text;
ALTER TABLE deep_assessments ADD COLUMN IF NOT EXISTS report_error  text;
ALTER TABLE deep_assessments ADD COLUMN IF NOT EXISTS pdf_error     text;
ALTER TABLE deep_assessments ADD COLUMN IF NOT EXISTS email_error   text;
