-- Proposed migration: founding_applications (Founding 100 flow)
-- STATUS: DRAFTED — NOT APPLIED. A human applies this; see the PR runbook.
--
-- Public application intake for the Founding 100 soft-open. Service-role-only
-- access (RLS enabled with zero policies). Admin UI lists, admits (sets
-- status + token), and rejects/waitlists. The unlock route verifies the token
-- and sets the preview-gate cookie.
--
-- Cap is 100 ADMITTED (not 100 applications). Closed state comes from a COUNT(*)
-- on status='admitted'.
--
-- Idempotency is enforced at the application layer via an UPSERT on email. This
-- unique key exists to support that and to prevent duplicate rows if routes
-- change over time.
CREATE TABLE IF NOT EXISTS founding_applications (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email                 text NOT NULL UNIQUE,
  name                  text,
  why                   text NOT NULL,
  focus                 text,
  referral              text,
  consented             boolean NOT NULL DEFAULT false,
  status                text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','admitted','rejected','waitlist')),
  admit_token           text UNIQUE, -- set on admit; used by unlock route
  admitted_at           timestamptz,
  admitted_by           text,        -- admin identifier (email/handle)
  invited_email_sent_at timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE founding_applications ENABLE ROW LEVEL SECURITY; -- zero policies (service-role only)

-- Count admitted quickly for the cap check.
CREATE INDEX IF NOT EXISTS idx_founding_status ON founding_applications (status);

