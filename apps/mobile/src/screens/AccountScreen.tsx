import { useCallback, useEffect, useState } from "react"
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native"
import { deleteAccount } from "../api/account-delete"
import {
  applyLocalReminder,
  readNotificationConsent,
  type NotificationConsent,
} from "../notifications/local"
import { deviceKv } from "../sync/persist"

type DeleteStage = "closed" | "warning" | "confirm" | "deleting"

export function AccountScreen({
  accessToken,
  onBack,
  onSignOut,
  onDeleted,
}: {
  accessToken: string
  onBack: () => void
  onSignOut: () => void
  onDeleted: () => void
}) {
  const [consent, setConsent] = useState<NotificationConsent>("unset")
  const [reminderBusy, setReminderBusy] = useState(false)
  const [reminderNote, setReminderNote] = useState<string | null>(null)
  const [deleteStage, setDeleteStage] = useState<DeleteStage>("closed")
  const [deleteInput, setDeleteInput] = useState("")
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const loadConsent = useCallback(async () => {
    setConsent(await readNotificationConsent(deviceKv))
  }, [])

  useEffect(() => {
    void loadConsent()
  }, [loadConsent])

  async function onToggleReminder() {
    setReminderBusy(true)
    setReminderNote(null)
    const enabled = consent !== "granted"
    const result = await applyLocalReminder({ kv: deviceKv, enabled })
    await loadConsent()
    setReminderBusy(false)
    if (!result.ok) {
      setReminderNote(
        result.reason === "permission_denied"
          ? "This device did not allow a local reminder."
          : "A local reminder isn't available on this device.",
      )
      return
    }
    setReminderNote(
      result.kind === "scheduled"
        ? "Local reminder on. Nothing is sent as a push."
        : "Local reminder off.",
    )
  }

  async function onConfirmDelete() {
    if (deleteInput !== "DELETE") return
    setDeleteStage("deleting")
    setDeleteError(null)
    const result = await deleteAccount(accessToken)
    if (result.ok) {
      onDeleted()
      return
    }
    if (result.reason === "unauthorised") {
      onSignOut()
      return
    }
    setDeleteError(result.message)
    setDeleteStage("confirm")
  }

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.back}>
        <Text style={styles.backText}>Today</Text>
      </Pressable>
      <Text style={styles.mark}>EatoBiotics</Text>
      <Text style={styles.title}>Account</Text>

      <View style={styles.card}>
        <Text style={styles.kicker}>Privacy</Text>
        <Text style={styles.body}>
          Camera and photos are used only to photograph or choose a meal. This app
          does not use location, contacts, the microphone, or HealthKit.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.kicker}>Local reminder</Text>
        <Text style={styles.body}>
          An optional reminder on this device to check in and log a meal. We do
          not send push notifications.
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ checked: consent === "granted", disabled: reminderBusy }}
          disabled={reminderBusy}
          onPress={() => void onToggleReminder()}
          style={styles.secondary}
        >
          <Text style={styles.secondaryText}>
            {consent === "granted" ? "Turn local reminder off" : "Turn local reminder on"}
          </Text>
        </Pressable>
        {reminderNote ? <Text style={styles.muted}>{reminderNote}</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.kicker}>Your data</Text>
        <Text style={styles.body}>
          A copy of your data is available on the website while you are signed in
          there. This app does not download it.
        </Text>
      </View>

      <View style={[styles.card, deleteStage !== "closed" ? styles.dangerCard : null]}>
        <Text style={styles.kicker}>Delete account</Text>
        {deleteStage === "closed" ? (
          <>
            <Text style={styles.body}>Permanently remove your data from EatoBiotics.</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setDeleteStage("warning")}
              style={styles.dangerButton}
            >
              <Text style={styles.dangerButtonText}>Delete account</Text>
            </Pressable>
          </>
        ) : null}

        {deleteStage === "warning" ? (
          <>
            <Text style={styles.dangerBody}>This will permanently delete:</Text>
            <Text style={styles.body}>Your profile and personal data</Text>
            <Text style={styles.body}>Meal analyses and check-ins</Text>
            <Text style={styles.body}>Assessment history</Text>
            <Text style={styles.dangerBody}>This cannot be undone.</Text>
            <View style={styles.row}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setDeleteStage("closed")}
                style={styles.secondary}
              >
                <Text style={styles.secondaryText}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => setDeleteStage("confirm")}
                style={styles.dangerButton}
              >
                <Text style={styles.dangerButtonText}>I understand</Text>
              </Pressable>
            </View>
          </>
        ) : null}

        {deleteStage === "confirm" ? (
          <>
            <Text style={styles.dangerBody}>Type DELETE to confirm.</Text>
            <TextInput
              autoCapitalize="characters"
              autoCorrect={false}
              onChangeText={setDeleteInput}
              placeholder="DELETE"
              placeholderTextColor="#8A948E"
              style={styles.input}
              value={deleteInput}
            />
            {deleteError ? <Text style={styles.error}>{deleteError}</Text> : null}
            <View style={styles.row}>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setDeleteStage("closed")
                  setDeleteInput("")
                  setDeleteError(null)
                }}
                style={styles.secondary}
              >
                <Text style={styles.secondaryText}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: deleteInput !== "DELETE" }}
                disabled={deleteInput !== "DELETE"}
                onPress={() => void onConfirmDelete()}
                style={[styles.dangerButton, deleteInput !== "DELETE" ? styles.disabled : null]}
              >
                <Text style={styles.dangerButtonText}>Permanently delete</Text>
              </Pressable>
            </View>
          </>
        ) : null}

        {deleteStage === "deleting" ? (
          <Text style={styles.dangerBody}>Deleting your account…</Text>
        ) : null}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 48,
    backgroundColor: "#F7F4EE",
    gap: 14,
  },
  back: {
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
  backText: {
    fontSize: 15,
    color: "#5C6B63",
  },
  mark: {
    fontSize: 16,
    fontWeight: "600",
    color: "#5C6B63",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1B3A2F",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  dangerCard: {
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  kicker: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "#5C6B63",
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
    color: "#1B3A2F",
  },
  dangerBody: {
    fontSize: 16,
    lineHeight: 22,
    color: "#8B3A2F",
    fontWeight: "600",
  },
  muted: {
    fontSize: 13,
    color: "#5C6B63",
  },
  error: {
    fontSize: 13,
    color: "#8B3A2F",
  },
  row: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  secondary: {
    marginTop: 4,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1B3A2F",
    alignSelf: "flex-start",
  },
  secondaryText: {
    color: "#1B3A2F",
    fontWeight: "600",
  },
  dangerButton: {
    marginTop: 4,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: "#8B3A2F",
    alignSelf: "flex-start",
  },
  dangerButtonText: {
    color: "#F7F4EE",
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#FCA5A5",
    backgroundColor: "#FFF5F5",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: "#1B3A2F",
  },
})
