-- ============================================================
-- EatoBiotics Membership Subscription Migrations
-- Run these in order in the Supabase SQL editor.
-- Each statement uses IF NOT EXISTS / IF EXISTS guards
-- so they are safe to re-run.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- Migration 1: Add subscription columns to profiles
-- ────────────────────────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS membership_tier text NOT NULL DEFAULT 'free'
    CHECK (membership_tier IN ('free', 'grow', 'restore', 'transform')),

  ADD COLUMN IF NOT EXISTS membership_status text NOT NULL DEFAULT 'inactive'
    CHECK (membership_status IN ('active', 'inactive', 'cancelled', 'past_due')),

  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS membership_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS membership_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_founding_member boolean NOT NULL DEFAULT false;


-- ────────────────────────────────────────────────────────────
-- Migration 2: subscription_events table
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS subscription_events (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type       text        NOT NULL,
  from_tier        text,
  to_tier          text,
  stripe_event_id  text        NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'subscription_events'
      AND policyname = 'users_read_own_subscription_events'
  ) THEN
    CREATE POLICY "users_read_own_subscription_events"
      ON subscription_events FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

INSERT INTO storage.buckets (id, name, public)
VALUES ('plate-recipes', 'plate-recipes', true)
ON CONFLICT (id) DO NOTHING;


-- ────────────────────────────────────────────────────────────
-- Migration 3: analyses table (server-side daily count tracking)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS analyses (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at               timestamptz NOT NULL DEFAULT now(),
  biotics_score            integer,
  meal_description         text,
  tier_at_time_of_analysis text
);

ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'analyses'
      AND policyname = 'users_read_own_analyses'
  ) THEN
    CREATE POLICY "users_read_own_analyses"
      ON analyses FOR SELECT TO authenticated
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'analyses'
      AND policyname = 'users_insert_own_analyses'
  ) THEN
    CREATE POLICY "users_insert_own_analyses"
      ON analyses FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────
-- Migration 4: weekly_checkins table (Transform members)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS weekly_checkins (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  content             text        NOT NULL,
  biotics_score_start integer,
  biotics_score_end   integer,
  created_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE weekly_checkins ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'weekly_checkins'
      AND policyname = 'users_read_own_checkins'
  ) THEN
    CREATE POLICY "users_read_own_checkins"
      ON weekly_checkins FOR SELECT TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────
-- Migration 5: consultations table (Transform members)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS consultations (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  message_count integer     NOT NULL DEFAULT 0,
  tokens_used   integer,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'consultations'
      AND policyname = 'users_read_own_consultations'
  ) THEN
    CREATE POLICY "users_read_own_consultations"
      ON consultations FOR SELECT TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────
-- Migration 6: health_goals column on profiles
-- ────────────────────────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS health_goals text[] DEFAULT '{}';


-- ────────────────────────────────────────────────────────────
-- Migration 7: extend analyses table with pillar scores + full output
-- ────────────────────────────────────────────────────────────

ALTER TABLE analyses
  ADD COLUMN IF NOT EXISTS prebiotic_score  integer,
  ADD COLUMN IF NOT EXISTS probiotic_score  integer,
  ADD COLUMN IF NOT EXISTS postbiotic_score integer,
  ADD COLUMN IF NOT EXISTS analysis_output  jsonb;


-- ────────────────────────────────────────────────────────────
-- Migration 8: extend consultations table for session tracking
-- ────────────────────────────────────────────────────────────

ALTER TABLE consultations
  ADD COLUMN IF NOT EXISTS session_id  uuid        DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS started_at  timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS ended_at    timestamptz,
  ADD COLUMN IF NOT EXISTS turn_count  integer     DEFAULT 0,
  ADD COLUMN IF NOT EXISTS date        date        DEFAULT current_date,
  ADD COLUMN IF NOT EXISTS summary     text;


-- ────────────────────────────────────────────────────────────
-- Migration 9: week_starting column on weekly_checkins
-- ────────────────────────────────────────────────────────────

ALTER TABLE weekly_checkins
  ADD COLUMN IF NOT EXISTS week_starting date;


-- ────────────────────────────────────────────────────────────
-- Migration 10: monthly_gut_plans table (Restore+ members)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS monthly_gut_plans (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  content       text        NOT NULL,
  month         date        NOT NULL,
  pillar_scores jsonb,
  health_goals  text[],
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE monthly_gut_plans ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'monthly_gut_plans'
      AND policyname = 'users_read_own_plans'
  ) THEN
    CREATE POLICY "users_read_own_plans"
      ON monthly_gut_plans FOR SELECT TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────
-- Migration 11: Add messages JSONB to consultations (Part B)
-- ────────────────────────────────────────────────────────────

ALTER TABLE consultations
  ADD COLUMN IF NOT EXISTS messages jsonb;


-- ────────────────────────────────────────────────────────────
-- Migration 12: meal_plans table (Part E)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS meal_plans (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_starting     date        NOT NULL,
  content           text,
  meals             jsonb,
  shopping_list     jsonb,
  biotics_score_avg integer,
  created_at        timestamptz DEFAULT now(),
  UNIQUE (user_id, week_starting)
);

ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'meal_plans'
      AND policyname = 'users_manage_own_meal_plans'
  ) THEN
    CREATE POLICY "users_manage_own_meal_plans"
      ON meal_plans FOR ALL TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────
-- Migration 13: food_protocols table (Part F)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS food_protocols (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  condition           text        NOT NULL,
  protocol            text,
  foods_to_prioritise jsonb,
  foods_to_reduce     jsonb,
  phase               text        DEFAULT 'initial',
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),
  UNIQUE (user_id, condition)
);

ALTER TABLE food_protocols ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'food_protocols'
      AND policyname = 'users_manage_own_food_protocols'
  ) THEN
    CREATE POLICY "users_manage_own_food_protocols"
      ON food_protocols FOR ALL TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────
-- Migration 14: monthly_reviews table (Part G)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS monthly_reviews (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month       date        NOT NULL,
  content     text,
  score_start integer,
  score_end   integer,
  top_wins    jsonb,
  focus_areas jsonb,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (user_id, month)
);

ALTER TABLE monthly_reviews ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'monthly_reviews'
      AND policyname = 'users_read_own_monthly_reviews'
  ) THEN
    CREATE POLICY "users_read_own_monthly_reviews"
      ON monthly_reviews FOR SELECT TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────
-- Migration 15: food_system_story JSONB on profiles (Part J)
-- ────────────────────────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS food_system_story jsonb;


-- Migration 16: Plate Builder generated recipes

CREATE TABLE IF NOT EXISTS plate_recipes (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              text        NOT NULL UNIQUE,
  plate_type        text        NOT NULL,
  plate_name        text        NOT NULL,
  name              text        NOT NULL,
  description       text        NOT NULL,
  image_url         text,
  goal              text,
  flavour           text,
  dietary_style     text,
  time              jsonb       NOT NULL DEFAULT '{}'::jsonb,
  score             jsonb       NOT NULL DEFAULT '{}'::jsonb,
  nutrition         jsonb       NOT NULL DEFAULT '{}'::jsonb,
  ingredients       jsonb       NOT NULL DEFAULT '[]'::jsonb,
  method            jsonb       NOT NULL DEFAULT '[]'::jsonb,
  shopping_sections jsonb       NOT NULL DEFAULT '[]'::jsonb,
  weekly_role       text,
  disclaimer        text,
  image_generated   boolean     NOT NULL DEFAULT false,
  image_options     jsonb       NOT NULL DEFAULT '[]'::jsonb,
  image_model       text,
  image_prompt      text,
  reference_style_used boolean   NOT NULL DEFAULT false,
  is_published      boolean     NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE plate_recipes
  ADD COLUMN IF NOT EXISTS image_generated boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS image_options jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS image_model text,
  ADD COLUMN IF NOT EXISTS image_prompt text,
  ADD COLUMN IF NOT EXISTS reference_style_used boolean NOT NULL DEFAULT false;

ALTER TABLE plate_recipes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'plate_recipes'
      AND policyname = 'public_read_published_plate_recipes'
  ) THEN
    CREATE POLICY "public_read_published_plate_recipes"
      ON plate_recipes FOR SELECT TO anon, authenticated
      USING (is_published = true);
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────
-- Migration 17: stripe_processed_events (Stripe webhook idempotency)
-- ────────────────────────────────────────────────────────────
-- Records every Stripe event.id the webhook has successfully handled so
-- redelivered/retried events are skipped instead of double-applied.

CREATE TABLE IF NOT EXISTS stripe_processed_events (
  event_id     text        PRIMARY KEY,
  event_type   text,
  processed_at timestamptz NOT NULL DEFAULT now()
);

-- RLS on with no policies: only the service-role webhook client can touch it;
-- anon/authenticated have no access.
ALTER TABLE stripe_processed_events ENABLE ROW LEVEL SECURITY;


-- ────────────────────────────────────────────────────────────
-- Migration 18: household_members (Family Mode — member sub-profiles)
-- ────────────────────────────────────────────────────────────
-- Lightweight family members owned by one account holder. No separate logins;
-- the account holder manages the household. The family food-system score is
-- the average of each member's latest_score (plus the owner's own score).

CREATE TABLE IF NOT EXISTS household_members (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         text        NOT NULL,
  age_band     text,       -- e.g. "child" | "teen" | "adult" | age bracket
  relationship text,       -- e.g. "child" | "partner" | "parent" | "self"
  latest_score integer,    -- most recent food-system score (0–100), nullable
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS household_members_owner_idx ON household_members (owner_id);

ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;

-- Account holders can fully manage only their own household members.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'household_members'
      AND policyname = 'owners_manage_household_members'
  ) THEN
    CREATE POLICY "owners_manage_household_members"
      ON household_members FOR ALL
      TO authenticated
      USING (owner_id = auth.uid())
      WITH CHECK (owner_id = auth.uid());
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────
-- Migration 19: glp1_logs (GLP-1 Companion — protein/muscle tracker)
-- ────────────────────────────────────────────────────────────
-- One row per user per day. Tracks protein intake against the muscle-
-- preservation target (see lib/glp1.ts), body weight, and whether a
-- resistance-training session was done. Gated to the Restore tier+
-- (the in-app GLP-1 Companion). Educational tracking — not medical data.

CREATE TABLE IF NOT EXISTS glp1_logs (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date        date        NOT NULL,
  protein_grams   integer,    -- protein actually eaten that day (g)
  protein_target  integer,    -- the day's target at time of logging (g)
  weight_kg       numeric(5,1),
  strength_session boolean    NOT NULL DEFAULT false,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, log_date)
);

CREATE INDEX IF NOT EXISTS glp1_logs_user_date_idx ON glp1_logs (user_id, log_date DESC);

ALTER TABLE glp1_logs ENABLE ROW LEVEL SECURITY;

-- Users can fully manage only their own GLP-1 logs.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'glp1_logs'
      AND policyname = 'users_manage_own_glp1_logs'
  ) THEN
    CREATE POLICY "users_manage_own_glp1_logs"
      ON glp1_logs FOR ALL
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────
-- Migration 20: glp1_profile (GLP-1 Companion — onboarding/setup)
-- ────────────────────────────────────────────────────────────
-- One row per user, captured on first run of the GLP-1 Companion: which
-- medication they're on, their starting weight, and (optionally) a goal
-- weight + start date. Used to personalise the tracker target and to anchor
-- the weight-trend baseline. Educational setup — not medical data.

CREATE TABLE IF NOT EXISTS glp1_profile (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  medication      text,       -- ozempic | wegovy | mounjaro | other | not_started
  start_weight_kg numeric(5,1),
  goal_weight_kg  numeric(5,1),
  started_at      date,       -- when they started the medication / tracking
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE glp1_profile ENABLE ROW LEVEL SECURITY;

-- Users can fully manage only their own GLP-1 profile.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'glp1_profile'
      AND policyname = 'users_manage_own_glp1_profile'
  ) THEN
    CREATE POLICY "users_manage_own_glp1_profile"
      ON glp1_profile FOR ALL
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────
-- Migration 21: glp1_logs.side_effects (GLP-1 Companion — symptom tracking)
-- ────────────────────────────────────────────────────────────
-- Optional per-day side-effect tags (e.g. nausea, fullness, constipation,
-- fatigue) for the in-app tracker's analytics. Additive column; nullable.

ALTER TABLE glp1_logs ADD COLUMN IF NOT EXISTS side_effects text[];


-- ────────────────────────────────────────────────────────────
-- Migration 22: ai_usage (per-user daily AI usage counters)
-- ────────────────────────────────────────────────────────────
-- One row per user per day per AI feature (meal_plan, report_chat, …) used by
-- lib/ai-guard.ts to enforce daily caps on Claude-backed endpoints and bound
-- worst-case AI spend. Service-role access only (RLS on, no policies).

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


-- ────────────────────────────────────────────────────────────
-- Migration 23: email_sends (idempotent lifecycle email log)
-- ────────────────────────────────────────────────────────────
-- One row per (email, kind) so lifecycle crons (trial win-back, etc.) send a
-- given email at most once per recipient. Service-role only (RLS on, no
-- policies).

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


-- ────────────────────────────────────────────────────────────
-- Migration 24: stability_assessments + stability_logs (Stability module)
-- ────────────────────────────────────────────────────────────
-- Cross-device persistence for the EatoBiotics Stability™ tool. The Stability
-- data structures are stored as jsonb (they mirror the localStorage shapes in
-- lib/stability/*), so the client sync layer (lib/stability/storage.ts) can
-- round-trip them unchanged. RLS-scoped to the owner.

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

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stability_assessments' AND policyname = 'users_manage_own_stability_assessments') THEN
    CREATE POLICY "users_manage_own_stability_assessments" ON stability_assessments
      FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS stability_logs (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date   date        NOT NULL,
  data       jsonb       NOT NULL,   -- full StabilityDailyLog (sleep, food, events, summary)
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, log_date)
);

CREATE INDEX IF NOT EXISTS stability_logs_user_date_idx ON stability_logs (user_id, log_date DESC);

ALTER TABLE stability_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stability_logs' AND policyname = 'users_manage_own_stability_logs') THEN
    CREATE POLICY "users_manage_own_stability_logs" ON stability_logs
      FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────
-- Migration 25: assessment_journeys (foundation→add-on journey persistence)
-- ────────────────────────────────────────────────────────────
-- Cross-device persistence for the foundation-first assessment journey
-- (lib/assessment/journey.ts + registry.ts). `journey` mirrors the localStorage
-- journey store; `summaries` is a map of assessmentKey → normalised
-- AssessmentSummary — enough to render the combined report on any device without
-- round-tripping the six raw assessment localStorage shapes. RLS-scoped to the
-- owner; one row per user.

CREATE TABLE IF NOT EXISTS assessment_journeys (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  journey    jsonb       NOT NULL,
  summaries  jsonb       NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE assessment_journeys ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'assessment_journeys' AND policyname = 'users_manage_own_assessment_journeys') THEN
    CREATE POLICY "users_manage_own_assessment_journeys" ON assessment_journeys
      FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────
-- Migration 26: leads waitlist segmentation columns
-- ────────────────────────────────────────────────────────────
-- The pre-launch "Discover Your Food System Type" flow (components/waitlist/
-- discover-flow.tsx → app/api/waitlist/route.ts) captures a little segmentation
-- context alongside the quick-quiz profile. profile_type / overall_score /
-- sub_scores already exist on leads; these four nullable columns store the
-- unscored context so the launch report and audience segments can use it.
-- ADD-only and idempotent.

ALTER TABLE leads ADD COLUMN IF NOT EXISTS country        text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS diet           text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS main_goal      text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS food_challenge text;


-- ────────────────────────────────────────────────────────────
-- Migration 27: widen leads.assessment_type CHECK
-- ────────────────────────────────────────────────────────────
-- The live DB constraint only allowed 'gut' | 'mind', which silently rejected
-- waitlist (and family) lead upserts — the documented set is
-- gut | mind | family | waitlist. Widen to match. Strictly more permissive;
-- no existing rows affected.

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


-- ────────────────────────────────────────────────────────────
-- Migration 29: leads share/referral columns (waitlist growth engine)
-- ────────────────────────────────────────────────────────────
-- Powers the shareable mini-report page (/discover/[code]), the OG share card,
-- and skip-the-line referrals. share_code is the public code on the result page;
-- referred_by is the referrer's share_code; referral_count drives waitlist
-- position + invite-to-unlock. ADD-only and idempotent.

ALTER TABLE leads ADD COLUMN IF NOT EXISTS share_code     text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS referred_by    text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS referral_count integer NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX IF NOT EXISTS leads_share_code_key ON leads (share_code) WHERE share_code IS NOT NULL;


-- ────────────────────────────────────────────────────────────
-- Migration 30: leads.reward_code (invite-to-unlock founding-member reward)
-- ────────────────────────────────────────────────────────────
-- Stores the single founding-member coupon minted once a lead crosses the
-- referral unlock threshold (see app/api/waitlist/status). ADD-only, idempotent.

ALTER TABLE leads ADD COLUMN IF NOT EXISTS reward_code text;


-- ────────────────────────────────────────────────────────────
-- Migration 31: leads UTM attribution columns (waitlist ad tracking)
-- ────────────────────────────────────────────────────────────
-- First-touch campaign attribution for waitlist signups (captured from the
-- /enter URL by the Discover flow). ADD-only and idempotent.

ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_source   text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_medium   text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_campaign text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_content  text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_term     text;


-- ────────────────────────────────────────────────────────────
-- Migration 32: email_optouts (central email unsubscribe ledger)
-- ────────────────────────────────────────────────────────────
-- One row per opted-out address. Standalone (not a column on leads/profiles)
-- because lifecycle email goes to both tables — a single lookup covers all
-- senders. Service-role only; RLS on with no policies (no client access).

CREATE TABLE IF NOT EXISTS email_optouts (
  email      text        PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  source     text
);
ALTER TABLE email_optouts ENABLE ROW LEVEL SECURITY;


-- ────────────────────────────────────────────────────────────
-- Migration 33: deep_assessments per-step status tracking
-- ────────────────────────────────────────────────────────────
-- The paid-report pipeline (generate report → PDF → upload → email) previously
-- only had a single `status` column, so a row could be marked "complete" even if
-- the PDF upload or the email send failed — a paying customer could silently get
-- nothing. These per-step columns make each stage's outcome (and error) visible
-- in the DB so the flow is diagnosable and retry-safe. ADD-only, idempotent.
--   report_status: pending | generating | generated | failed
--   pdf_status:    pending | generated | uploaded | upload_failed | failed
--   email_status:  pending | sent | failed
ALTER TABLE deep_assessments ADD COLUMN IF NOT EXISTS report_status text;
ALTER TABLE deep_assessments ADD COLUMN IF NOT EXISTS pdf_status    text;
ALTER TABLE deep_assessments ADD COLUMN IF NOT EXISTS email_status  text;
ALTER TABLE deep_assessments ADD COLUMN IF NOT EXISTS report_error  text;
ALTER TABLE deep_assessments ADD COLUMN IF NOT EXISTS pdf_error     text;
ALTER TABLE deep_assessments ADD COLUMN IF NOT EXISTS email_error   text;


-- ────────────────────────────────────────────────────────────
-- Migration 34: enable Supabase Realtime on `analyses` (Living Twin)
-- ────────────────────────────────────────────────────────────
-- The account Living Twin (/account/twin) subscribes to INSERTs on the member's
-- own `analyses` rows so it updates live across devices as meals are logged. RLS
-- already scopes `analyses` to `user_id = auth.uid()`, so the per-user Realtime
-- subscription is safe. Idempotent: only adds the table if not already published.
-- (The app degrades gracefully — a visibilitychange refresh keeps it live on the
-- same device even if this isn't applied.)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'analyses'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.analyses;
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────
-- Migration 35: profiles.sex (Living Twin figure personalisation)
-- ────────────────────────────────────────────────────────────
-- The account Living Twin figure is male/female to match the customer. Nullable
-- (values 'male' | 'female', else null → the generic couple figure). ADD-only,
-- idempotent. Set via My Account settings + onboarding.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sex text;


-- ────────────────────────────────────────────────────────────
-- Migration 36: twin_state (ritual + milestone sync across devices)
-- ────────────────────────────────────────────────────────────
-- The Digital Twin's Daily Ritual ticks and milestone seen-set are
-- localStorage-first for instant taps; this table lets signed-in members keep
-- them across devices. One row per user; the app merge-writes (union of
-- milestone ids, per-day ritual merge) via /api/twin-state. Idempotent.
CREATE TABLE IF NOT EXISTS twin_state (
  user_id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  rituals         jsonb NOT NULL DEFAULT '{}'::jsonb,   -- { "YYYY-MM-DD": {fermented,plants,feeling} }
  milestones_seen text[] NOT NULL DEFAULT '{}',
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE twin_state ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'twin_state' AND policyname = 'twin_state_own') THEN
    CREATE POLICY twin_state_own ON twin_state
      FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────
-- Migration 37: EatoBiotics Content Studio (/cms) — Phase 1 core tables
-- ────────────────────────────────────────────────────────────
-- Private CMS foundation: canonical content records with a full editorial
-- lifecycle, append-only version history, reusable tags, and an append-only
-- audit log. CMS access is via the admin cookie + service-role server routes
-- only (the admin is not a Supabase user), so every table follows the
-- service-role-only pattern: RLS ENABLED with ZERO policies (like ai_usage /
-- email_sends / stripe_processed_events) — no anonymous or customer access.
-- The editorial workflow `status` and the product-availability classification
-- `availability_status` are deliberately separate columns. Idempotent.
CREATE TABLE IF NOT EXISTS cms_content (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title               text NOT NULL,
  slug                text NOT NULL UNIQUE,
  content_type        text NOT NULL CHECK (content_type IN (
    'book','book_chapter','chapter_extract','article','website_page','newsletter',
    'substack_post','social_post','social_thread','social_carousel','image','video',
    'audio','advertisement','campaign_brief','press_release','research_summary',
    'country_adaptation')),
  summary             text,
  body                text,                    -- Markdown/MDX (matches the site's content pipeline)
  status              text NOT NULL DEFAULT 'idea' CHECK (status IN (
    'idea','outline','draft','in_review','changes_requested','approved','scheduled',
    'publishing','published','failed','cancelled','archived')),
  availability_status text NOT NULL DEFAULT 'our_direction' CHECK (availability_status IN (
    'available_now','needs_manual_verification','in_development','our_direction','future')),
  brand               text,                    -- EatoBiotics | EatoSystem | EatoBetics | EatoSports
  audience            text,
  pathway             text,
  foundation          text,
  country_code        text,
  region              text,
  food_culture        text,
  language_code       text,
  source_content_id   uuid REFERENCES cms_content(id) ON DELETE SET NULL,
  campaign_id         uuid,                    -- FK added when cms_campaigns lands (later migration)
  book_id             uuid,                    -- FK added when cms_books lands (later migration)
  chapter_id          uuid,                    -- FK added when cms_chapters lands (later migration)
  created_by          text NOT NULL DEFAULT 'admin',  -- shared-password admin: no per-user identity yet
  updated_by          text NOT NULL DEFAULT 'admin',
  approved_by         text,
  scheduled_at        timestamptz,
  published_at        timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  archived_at         timestamptz
);

CREATE INDEX IF NOT EXISTS idx_cms_content_status       ON cms_content (status);
CREATE INDEX IF NOT EXISTS idx_cms_content_content_type ON cms_content (content_type);
CREATE INDEX IF NOT EXISTS idx_cms_content_updated_at   ON cms_content (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_cms_content_source       ON cms_content (source_content_id) WHERE source_content_id IS NOT NULL;

ALTER TABLE cms_content ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS cms_content_versions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id     uuid NOT NULL REFERENCES cms_content(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  title          text NOT NULL,
  summary        text,
  body           text,
  metadata_json  jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by     text NOT NULL DEFAULT 'admin',
  created_at     timestamptz NOT NULL DEFAULT now(),
  change_note    text,
  UNIQUE (content_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_cms_content_versions_content ON cms_content_versions (content_id, version_number DESC);

ALTER TABLE cms_content_versions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS cms_tags (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cms_tags ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS cms_content_tags (
  content_id uuid NOT NULL REFERENCES cms_content(id) ON DELETE CASCADE,
  tag_id     uuid NOT NULL REFERENCES cms_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (content_id, tag_id)
);

ALTER TABLE cms_content_tags ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS cms_audit_log (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id  text NOT NULL DEFAULT 'admin',
  action         text NOT NULL,
  entity_type    text NOT NULL,
  entity_id      uuid,
  metadata_json  jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cms_audit_log_created_at ON cms_audit_log (created_at DESC);

ALTER TABLE cms_audit_log ENABLE ROW LEVEL SECURITY;


-- ────────────────────────────────────────────────────────────
-- Migration 38: Content Studio Phase 2A — media library
-- ────────────────────────────────────────────────────────────
-- Private asset storage for the CMS: a private `cms-media` bucket plus the
-- cms_media catalogue and cms_content_media relationship table. Same
-- service-role-only model as Migration 37 (RLS ENABLED, ZERO policies) — the
-- CMS admin is not a Supabase user; all access is via the admin cookie +
-- service-role server routes. Assets are served through short-TTL signed URLs
-- (the app/api/account/pdf-url pattern) and are ARCHIVED, never hard-deleted,
-- so anything referenced by published content always resolves. Idempotent.
INSERT INTO storage.buckets (id, name, public)
VALUES ('cms-media', 'cms-media', false)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS cms_media (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename           text NOT NULL,
  storage_bucket     text NOT NULL DEFAULT 'cms-media',
  storage_path       text NOT NULL,               -- server-derived key, never a client path
  media_type         text NOT NULL CHECK (media_type IN ('image','video','audio','document')),
  mime_type          text NOT NULL,
  width              integer,
  height             integer,
  duration_seconds   numeric(10,2),
  file_size          bigint,
  alt_text           text,
  caption            text,
  generation_prompt  text,
  source             text,                         -- e.g. 'upload' | 'ai' | provider name
  copyright_owner    text,
  licence            text,
  usage_restrictions text,
  status             text NOT NULL DEFAULT 'ready' CHECK (status IN ('ready','archived')),
  created_by         text NOT NULL DEFAULT 'admin',
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  archived_at        timestamptz,
  UNIQUE (storage_bucket, storage_path)
);

CREATE INDEX IF NOT EXISTS idx_cms_media_media_type ON cms_media (media_type);
CREATE INDEX IF NOT EXISTS idx_cms_media_status     ON cms_media (status);
CREATE INDEX IF NOT EXISTS idx_cms_media_created_at ON cms_media (created_at DESC);

ALTER TABLE cms_media ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS cms_content_media (
  content_id uuid NOT NULL REFERENCES cms_content(id) ON DELETE CASCADE,
  media_id   uuid NOT NULL REFERENCES cms_media(id) ON DELETE CASCADE,
  role       text NOT NULL DEFAULT 'inline' CHECK (role IN (
    'hero','thumbnail','inline','social','advert','video','audio','document')),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (content_id, media_id, role)
);

CREATE INDEX IF NOT EXISTS idx_cms_content_media_media ON cms_content_media (media_id);

ALTER TABLE cms_content_media ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────
-- Migration 39: Content Studio Phase 2B — books & chapters
-- ────────────────────────────────────────────────────────────
-- Books and chapters are cms_content rows (content_type 'book' / 'book_chapter')
-- so they inherit the full editorial lifecycle, version history, and audit
-- trail for free. cms_books and cms_chapters are thin structural tables — the
-- type-safe FK targets the cms_content.book_id / chapter_id columns have
-- carried since Migration 37 ("FK added when cms_books/cms_chapters lands").
-- Chapter ordering is a plain chapter_number on each chapter's own row (not an
-- array on the book) so reordering never requires array surgery; there is
-- deliberately no DB-level UNIQUE(book_id, chapter_number) — enforcing that
-- with a non-deferrable constraint risks transient-violation failures on a
-- two-step swap, so uniqueness stays a soft UI/API convention. Same
-- service-role-only pattern as Migrations 37/38: RLS ENABLED, ZERO policies.
-- Idempotent.
CREATE TABLE IF NOT EXISTS cms_books (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL UNIQUE REFERENCES cms_content(id) ON DELETE CASCADE,
  subtitle   text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cms_books_content ON cms_books (content_id);

ALTER TABLE cms_books ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS cms_chapters (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id            uuid NOT NULL REFERENCES cms_books(id) ON DELETE CASCADE,
  content_id         uuid NOT NULL UNIQUE REFERENCES cms_content(id) ON DELETE CASCADE,
  chapter_number     integer NOT NULL,
  part               text,
  part_title         text,
  publication_target text[] NOT NULL DEFAULT '{}'::text[] CHECK (
    publication_target <@ ARRAY['website','substack','reedsy','print','pdf']::text[]),
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cms_chapters_book_order ON cms_chapters (book_id, chapter_number);
CREATE INDEX IF NOT EXISTS idx_cms_chapters_content    ON cms_chapters (content_id);

ALTER TABLE cms_chapters ENABLE ROW LEVEL SECURITY;

-- Attach the FK constraints Migration 37 reserved book_id/chapter_id for, now
-- that their target tables exist. Postgres has no ADD CONSTRAINT IF NOT
-- EXISTS, so guard idempotency via pg_constraint.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cms_content_book_id_fkey') THEN
    ALTER TABLE cms_content
      ADD CONSTRAINT cms_content_book_id_fkey
      FOREIGN KEY (book_id) REFERENCES cms_books(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cms_content_chapter_id_fkey') THEN
    ALTER TABLE cms_content
      ADD CONSTRAINT cms_content_chapter_id_fkey
      FOREIGN KEY (chapter_id) REFERENCES cms_chapters(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_cms_content_book_id    ON cms_content (book_id)    WHERE book_id    IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cms_content_chapter_id ON cms_content (chapter_id) WHERE chapter_id IS NOT NULL;


-- ────────────────────────────────────────────────────────────
-- Migration 40: Content Studio Phase 2B — chapter integrity
-- ────────────────────────────────────────────────────────────
-- Two integrity guarantees for the books & chapters surface (Migration 39):
--
-- 1. ATOMIC REORDER. Moving a chapter up/down swaps two chapters'
--    chapter_number values. The old flow was two independent client PATCHes —
--    if the second failed, the book was left with a duplicate/gap. This
--    function does the swap in a single transaction (its body), so it is all-
--    or-nothing: a failure rolls back and the ordering is unchanged. It swaps
--    through a temporary sentinel (chapter_number = -(id-derived)) so the
--    operation stays valid even if a future UNIQUE(book_id, chapter_number)
--    constraint is added, and locks both rows FOR UPDATE so concurrent swaps
--    serialise. The API route (/api/cms/books/[id]/chapters/reorder) picks the
--    two ids among the book's ACTIVE chapters and calls this once.
--
-- 2. ACTIVE-ONLY UNIQUENESS stays an application concern, deliberately. A
--    partial UNIQUE(book_id, chapter_number) can't be expressed at the DB level
--    here because "active" means the chapter's cms_content.status <> 'archived'
--    — a column on a DIFFERENT table — and an archived chapter's number must be
--    reusable. The books/chapters routes enforce it against active chapters
--    only (see lib/cms/chapter-order.ts activeChapterNumbers).
--
-- NON-CASCADING BOOK ARCHIVE (unchanged, documented): archiving a book
-- (DELETE /api/cms/books/[id]) archives only the book's own cms_content row.
-- Its chapters are intentionally left as-is — there is no cascade-archive of
-- chapters. This is a deliberate limitation, not an oversight.
--
-- SECURITY INVOKER (default): the CMS calls this via the service-role client,
-- which bypasses RLS anyway; no anon/customer path can reach it. Idempotent.
CREATE OR REPLACE FUNCTION cms_swap_chapter_order(a_id uuid, b_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  a_num  integer;
  b_num  integer;
  a_book uuid;
  b_book uuid;
BEGIN
  IF a_id = b_id THEN
    RETURN;
  END IF;

  SELECT chapter_number, book_id INTO a_num, a_book FROM cms_chapters WHERE id = a_id FOR UPDATE;
  SELECT chapter_number, book_id INTO b_num, b_book FROM cms_chapters WHERE id = b_id FOR UPDATE;

  IF a_num IS NULL OR b_num IS NULL THEN
    RAISE EXCEPTION 'cms_swap_chapter_order: chapter not found';
  END IF;
  IF a_book IS DISTINCT FROM b_book THEN
    RAISE EXCEPTION 'cms_swap_chapter_order: chapters belong to different books';
  END IF;

  -- Sentinel then swap — safe under a future unique constraint, atomic here.
  UPDATE cms_chapters SET chapter_number = -1, updated_at = now() WHERE id = a_id;
  UPDATE cms_chapters SET chapter_number = a_num, updated_at = now() WHERE id = b_id;
  UPDATE cms_chapters SET chapter_number = b_num, updated_at = now() WHERE id = a_id;
END;
$$;
