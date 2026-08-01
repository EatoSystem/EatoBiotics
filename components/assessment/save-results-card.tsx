"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { TriangleAlert, Mail } from "lucide-react"

type SendStatus = "sending" | "sent" | "failed"

/**
 * Sends the branded magic / sign-in link (so the user can reach /account to
 * save their results) and surfaces the REAL send status. Owning the send here
 * — rather than firing it blind from the assessment client — means a failure
 * (Supabase generateLink error, Resend send error, network) is shown to the
 * user instead of a permanent, false "we've sent it".
 *
 * `/api/auth/send-magic-link` returns HTTP 200 with:
 *   { ok: true }                 → sent
 *   { ok: true, skipped: true }  → generateLink/config failure (no email sent)
 *   { ok: false, reason }        → Resend send failure
 */
export function SaveResultsCard({
  email,
  name,
  accentVar = "--icon-green",
}: {
  email?: string
  name?: string
  accentVar?: string
}) {
  const [status, setStatus] = useState<SendStatus>("sending")
  const firedRef = useRef(false)

  const send = useCallback(() => {
    if (!email) return
    setStatus("sending")
    fetch("/api/auth/send-magic-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name }),
    })
      .then(async (res) => {
        const data = (await res.json().catch(() => null)) as
          | { ok?: boolean; skipped?: boolean }
          | null
        if (res.ok && data?.ok && !data.skipped) setStatus("sent")
        else setStatus("failed")
      })
      .catch(() => setStatus("failed"))
  }, [email, name])

  useEffect(() => {
    if (!email || firedRef.current) return
    firedRef.current = true
    send()
  }, [email, send])

  if (!email) return null

  return (
    <div className="rounded-2xl border bg-card p-6 text-center space-y-3">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center mx-auto"
        style={{ backgroundColor: `color-mix(in srgb, var(${accentVar}) 10%, transparent)` }}
      >
        <span style={{ color: `var(${accentVar}-text)` }}>
          {status === "failed" ? (
            <TriangleAlert size={19} aria-hidden strokeWidth={2} />
          ) : (
            <Mail size={19} aria-hidden strokeWidth={2} />
          )}
        </span>
      </div>

      {status === "failed" ? (
        <>
          <h3 className="font-semibold text-base">We couldn&apos;t send your sign-in link</h3>
          <p className="text-sm text-muted-foreground">
            We hit a problem sending the link to{" "}
            <span className="font-semibold text-foreground">{email}</span>. It can take a few
            minutes to arrive — if it doesn&apos;t,{" "}
            <button
              onClick={send}
              className="underline font-medium text-foreground hover:opacity-80 transition-opacity"
            >
              try again
            </button>{" "}
            or email{" "}
            <a href="mailto:hello@eatobiotics.com" className="underline hover:text-foreground">
              hello@eatobiotics.com
            </a>
            .
          </p>
        </>
      ) : (
        <>
          <h3 className="font-semibold text-base">Your sign-in link is on its way</h3>
          {status === "sent" ? (
            <p className="text-sm text-muted-foreground">
              We&apos;ve sent a sign-in link to{" "}
              <span className="font-semibold text-foreground">{email}</span> — check your inbox to
              save these results and access your account.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Sending a sign-in link to{" "}
              <span className="font-semibold text-foreground">{email}</span>…
            </p>
          )}
          {status === "sent" && (
            <p className="text-xs text-muted-foreground/60">
              Can&apos;t find it? Check your spam folder or{" "}
              <button
                onClick={send}
                className="underline hover:text-foreground transition-colors"
              >
                resend the link
              </button>
              .
            </p>
          )}
        </>
      )}
    </div>
  )
}
