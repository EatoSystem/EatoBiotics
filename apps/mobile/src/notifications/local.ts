/**
 * Local reminder scaffolding. Consent lives on the device (the companion
 * equivalent of an opt-out ledger). No APNs, no FCM, no Expo push token,
 * no remote send.
 *
 * expo-notifications is loaded only after the member opts in. If the native
 * module is missing, the toggle fails visibly — it does not fetch a push
 * credential as a fallback.
 */
import type { KvStore } from "../sync/check-in"

export const NOTIFICATION_CONSENT_KEY = "eatobiotics.notifications.consent"

export type NotificationConsent = "granted" | "denied" | "unset"

type NotificationsModule = {
  requestPermissionsAsync: () => Promise<{ granted: boolean; ios?: { status: number } }>
  getPermissionsAsync: () => Promise<{ granted: boolean }>
  scheduleNotificationAsync: (opts: {
    content: { title: string; body: string }
    trigger: { type: "daily"; hour: number; minute: number }
  }) => Promise<string>
  cancelAllScheduledNotificationsAsync: () => Promise<void>
}

const REMINDER_ID_KEY = "eatobiotics.notifications.local-reminder"

async function loadNotifications(): Promise<NotificationsModule | null> {
  try {
    return (await import("expo-notifications")) as unknown as NotificationsModule
  } catch (error) {
    console.error("[mobile-notifications] module unavailable", error)
    return null
  }
}

export async function readNotificationConsent(kv: KvStore): Promise<NotificationConsent> {
  const raw = await kv.getItem(NOTIFICATION_CONSENT_KEY)
  if (raw === "granted" || raw === "denied") return raw
  return "unset"
}

export async function setNotificationConsent(
  kv: KvStore,
  value: Exclude<NotificationConsent, "unset">,
): Promise<void> {
  await kv.setItem(NOTIFICATION_CONSENT_KEY, value)
}

export type LocalReminderResult =
  | { ok: true; kind: "scheduled" | "cancelled" }
  | { ok: false; reason: "unavailable" | "no_consent" | "permission_denied" }

/**
 * Opt-in local daily reminder. Never requests a device push token.
 * Never sends a remote notification.
 */
export async function applyLocalReminder(opts: {
  kv: KvStore
  enabled: boolean
}): Promise<LocalReminderResult> {
  if (!opts.enabled) {
    await setNotificationConsent(opts.kv, "denied")
    const notifications = await loadNotifications()
    if (notifications) {
      try {
        await notifications.cancelAllScheduledNotificationsAsync()
      } catch (error) {
        console.error("[mobile-notifications] cancel failed", error)
      }
    }
    await opts.kv.setItem(REMINDER_ID_KEY, "")
    return { ok: true, kind: "cancelled" }
  }

  const notifications = await loadNotifications()
  if (!notifications) return { ok: false, reason: "unavailable" }

  let permission: { granted: boolean }
  try {
    permission = await notifications.requestPermissionsAsync()
  } catch (error) {
    console.error("[mobile-notifications] permission request failed", error)
    return { ok: false, reason: "unavailable" }
  }
  if (!permission.granted) {
    await setNotificationConsent(opts.kv, "denied")
    return { ok: false, reason: "permission_denied" }
  }

  await setNotificationConsent(opts.kv, "granted")
  try {
    await notifications.cancelAllScheduledNotificationsAsync()
    const id = await notifications.scheduleNotificationAsync({
      content: {
        title: "EatoBiotics",
        body: "Check in and log a meal when you are ready.",
      },
      trigger: { type: "daily", hour: 18, minute: 0 },
    })
    await opts.kv.setItem(REMINDER_ID_KEY, id)
    return { ok: true, kind: "scheduled" }
  } catch (error) {
    console.error("[mobile-notifications] schedule failed", error)
    return { ok: false, reason: "unavailable" }
  }
}
