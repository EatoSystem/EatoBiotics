# EatoBiotics Launch Checklist

## Password Gate

- During redevelopment, set `EATOBIOTICS_PASSWORD_GATE=true` and set a strong `DEV_PASSWORD`.
- Before public launch, set `EATOBIOTICS_PASSWORD_GATE=false` or remove the variable.
- Never deploy with `EATOBIOTICS_PASSWORD_GATE=true` unless `DEV_PASSWORD` is set.

## MVP Flow

- Complete the free assessment.
- Confirm the free result displays the correct score and 3 Biotics breakdown.
- Start the `EUR 49` Personal Report checkout from the free result page.
- Complete Stripe checkout in test mode.
- Confirm redirect to `/assessment/deep?session_id=...`.
- Complete the deep assessment.
- Confirm the paid report generates and is accessible at `/assessment/report?session_id=...`.
- Refresh the report page and confirm the report remains accessible for the paid session.
