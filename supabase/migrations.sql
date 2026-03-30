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
