-- ============================================================================
-- ONE-TIME MIGRATION — paste this whole file into Supabase Studio → SQL Editor
-- ============================================================================
--
-- WHEN TO RUN
-- Once, before merging the customer-experience hardening PR (#21).
-- Idempotent — safe to re-run; everything uses IF NOT EXISTS / IF NOT EXISTS-style
-- guards. If a statement fails partway, fix the cause and run again.
--
-- WHAT IT DOES (concise)
--   • Migration 17 — plumbing for new features
--     - Allows 'trial' and 'member' membership_tier values
--     - Adds profiles.trial_expires_at (powers the trial countdown banner)
--     - Adds processed_stripe_events (webhook dedup — stops double-processing)
--     - Adds leads.abandoned_cart_email_sent_at (recovery email dedup)
--     - Adds 7 indexes on hot columns (webhook lookups, dashboard daily counts)
--
--   • Migration 18 — Row-Level Security on sensitive tables
--     - profiles, leads, deep_assessments, referrals, plate_data, journal_entries
--       all become "your own row only" for anyone using the browser anon key.
--     - Service-role (server APIs) still has full access — nothing in the app
--       breaks.
--     - Closes the biggest remaining security gap before going public.
--
-- HOW TO RUN
--   1. Open Supabase Studio for your project
--   2. Left sidebar → SQL Editor → New query
--   3. Paste the entire contents of this file
--   4. Click Run
--   5. Expect "Success. No rows returned." (or similar)
--
-- This file is a copy of the same blocks at the bottom of `migrations.sql`
-- (lines 398–586). Either source produces identical results.
-- ============================================================================


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
END $$;


-- ── leads ──
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'leads' AND policyname = 'users_read_own_leads'
  ) THEN
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


-- ────────────────────────────────────────────────────────────
-- Migration 19: user_recipes (personal cookbook)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_recipes (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug         text        NOT NULL,
  plate_id     text        NOT NULL CHECK (plate_id IN ('foundation', 'function', 'diversity', 'restoration')),
  name         text        NOT NULL,
  description  text,
  image_url    text,
  recipe_json  jsonb       NOT NULL,
  is_favorite  boolean     NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_recipes_user_id_created_at
  ON user_recipes (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_recipes_user_id_favorite
  ON user_recipes (user_id) WHERE is_favorite = true;

ALTER TABLE user_recipes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_recipes' AND policyname = 'users_manage_own_recipes'
  ) THEN
    CREATE POLICY "users_manage_own_recipes"
      ON user_recipes FOR ALL TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;
