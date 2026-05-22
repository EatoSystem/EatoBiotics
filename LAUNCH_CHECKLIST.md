# EatoBiotics Launch Checklist

## Password Gate

- During redevelopment, set `DEV_PASSWORD` to enable the temporary site password screen.
- The current temporary fallback password is `Monkstown` so the preview lock remains active during redevelopment.
- Before public launch, remove the temporary fallback from `lib/dev-password-gate.ts`, then remove `DEV_PASSWORD` or set `EATOBIOTICS_PASSWORD_GATE_DISABLED=true`.
- Do not leave the temporary fallback in the launch build.

## MVP Flow

- Complete the free assessment.
- Confirm the free result displays the correct score and 3 Biotics breakdown.
- Start the `EUR 49` Personal Report checkout from the free result page.
- Complete Stripe checkout in test mode.
- Confirm redirect to `/assessment/deep?session_id=...`.
- Complete the deep assessment.
- Confirm the paid report generates and is accessible at `/assessment/report?session_id=...`.
- Refresh the report page and confirm the report remains accessible for the paid session.
