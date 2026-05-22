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
-- Migration 17: Webhook idempotency + tier reconciliation + hot-column indexes
-- ────────────────────────────────────────────────────────────

-- 17a. Allow the additional tier names the application code uses ('trial', 'member').
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_membership_tier_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_membership_tier_check
  CHECK (membership_tier IN ('free', 'trial', 'member', 'grow', 'restore', 'transform'));

-- 17b. Trial expiry column (read by lib/membership.ts, granted by one-time report webhook).
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS trial_expires_at timestamptz;

-- 17c. Dedup table — Stripe will retry webhooks; this is the lock that stops
-- non-idempotent side effects (welcome emails, analytics) from firing twice.
CREATE TABLE IF NOT EXISTS processed_stripe_events (
  stripe_event_id text        PRIMARY KEY,
  event_type      text        NOT NULL,
  processed_at    timestamptz NOT NULL DEFAULT now()
);

-- 17d. Hot-column indexes — webhook lookups, dashboard daily counts, history pulls.
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id
  ON profiles (stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_email
  ON profiles (email);

CREATE INDEX IF NOT EXISTS idx_analyses_user_id_created_at
  ON analyses (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_consultations_user_id_created_at
  ON consultations (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_deep_assessments_user_id
  ON deep_assessments (user_id) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_subscription_events_user_id_created_at
  ON subscription_events (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_leads_email
  ON leads (email);

-- 17e. Abandoned-cart tracking: 24h recovery email tracker.
-- Distinct from `email_sent` (which marks the immediate results email) so the
-- two drip stages don't collide.
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS abandoned_cart_email_sent_at timestamptz;


-- ────────────────────────────────────────────────────────────
-- Migration 18: Row-Level Security on customer-data tables
-- ────────────────────────────────────────────────────────────
--
-- WHAT THIS CLOSES
-- Without RLS on these tables, anyone holding the public anon key (which is
-- visible in every browser session) can SELECT every row. That exposes
-- stripe_customer_id, email, payment metadata, PDF report contents,
-- referral relationships, mood/digestion journal entries, etc.
--
-- HOW THE APP USES THESE TABLES
-- All sensitive writes and most reads happen through server routes using the
-- SERVICE ROLE key — RLS is bypassed for that key, so server-side flows are
-- unaffected. The policies below restrict what the ANON and AUTHENTICATED
-- keys (i.e. anything the browser holds) can do.

-- ── profiles ──
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'users_read_own_profile'
  ) THEN
    CREATE POLICY "users_read_own_profile"
      ON profiles FOR SELECT TO authenticated
      USING (id = auth.uid());
  END IF;
  -- No INSERT / UPDATE / DELETE policies: profile mutations go through the
  -- server APIs (/api/auth/callback, /api/account/settings, /api/account/delete)
  -- with the service-role key.
END $$;


-- ── leads ──
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'leads' AND policyname = 'users_read_own_leads'
  ) THEN
    -- Leads are linked by user_id after auth, but the row is created BEFORE
    -- sign-up so we also allow lookup by the JWT email claim. This keeps the
    -- "results page after sign-in" flow working without exposing other users.
    CREATE POLICY "users_read_own_leads"
      ON leads FOR SELECT TO authenticated
      USING (
        (user_id IS NOT NULL AND user_id = auth.uid())
        OR (email IS NOT NULL AND email = (auth.jwt() ->> 'email'))
      );
  END IF;
END $$;


-- ── deep_assessments ──
ALTER TABLE deep_assessments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'deep_assessments' AND policyname = 'users_read_own_deep_assessments'
  ) THEN
    CREATE POLICY "users_read_own_deep_assessments"
      ON deep_assessments FOR SELECT TO authenticated
      USING (
        (user_id IS NOT NULL AND user_id = auth.uid())
        OR (email IS NOT NULL AND email = (auth.jwt() ->> 'email'))
      );
  END IF;
END $$;


-- ── referrals ──
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'referrals' AND policyname = 'users_read_own_referrals'
  ) THEN
    -- A user can see referrals they made (matched via their profile.referral_code)
    -- and referrals where they are the referred party (matched via email or user_id).
    CREATE POLICY "users_read_own_referrals"
      ON referrals FOR SELECT TO authenticated
      USING (
        referrer_code IN (SELECT referral_code FROM profiles WHERE id = auth.uid())
        OR referred_id = auth.uid()
        OR (referred_email IS NOT NULL AND referred_email = (auth.jwt() ->> 'email'))
      );
  END IF;
END $$;


-- ── plate_data ──
ALTER TABLE plate_data ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'plate_data' AND policyname = 'users_manage_own_plate_data'
  ) THEN
    CREATE POLICY "users_manage_own_plate_data"
      ON plate_data FOR ALL TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;


-- ── journal_entries ──
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'journal_entries' AND policyname = 'users_manage_own_journal_entries'
  ) THEN
    CREATE POLICY "users_manage_own_journal_entries"
      ON journal_entries FOR ALL TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;


-- ── processed_stripe_events ──
-- Dedup table for the Stripe webhook. Service-role only; no policies grant
-- access to anon or authenticated, so they're locked out entirely.
ALTER TABLE processed_stripe_events ENABLE ROW LEVEL SECURITY;

