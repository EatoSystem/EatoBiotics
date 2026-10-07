import { useCallback, useEffect, useState } from "react"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { BIOTICS_SCORE, MEAL_BIOTICS_SCORE, MEMBER } from "@eatobiotics/vocabulary"
import type { MobileTodayResponse, RitualDayContract } from "@eatobiotics/contracts"
import { fetchToday } from "../api/today"

const RITUAL_ROWS: { key: keyof RitualDayContract; label: string }[] = [
  { key: "fermented", label: "Fermented food" },
  { key: "plants", label: "5+ plants" },
  { key: "moved", label: "Moved today" },
  { key: "slept", label: "Slept well" },
  { key: "feeling", label: "Feeling good" },
]

export function TodayScreen({
  accessToken,
  onSignOut,
}: {
  accessToken: string
  onSignOut: () => void
}) {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "ready"; data: MobileTodayResponse }
    | { status: "error"; reason: "unauthorised" | "unavailable" | "invalid" }
  >({ status: "loading" })

  const load = useCallback(async () => {
    setState({ status: "loading" })
    const result = await fetchToday(accessToken)
    if (!result.ok) {
      setState({ status: "error", reason: result.reason })
      if (result.reason === "unauthorised") onSignOut()
      return
    }
    setState({ status: "ready", data: result.data })
  }, [accessToken, onSignOut])

  useEffect(() => {
    void load()
  }, [load])

  if (state.status === "loading") {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>Loading today…</Text>
      </View>
    )
  }

  if (state.status === "error") {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Today</Text>
        <Text style={styles.muted}>Today isn't available right now.</Text>
        <Pressable accessibilityRole="button" onPress={() => void load()} style={styles.secondary}>
          <Text style={styles.secondaryText}>Try again</Text>
        </Pressable>
      </View>
    )
  }

  const { data } = state
  const streakLine = data.streak.loggedToday
    ? `Streak ${data.streak.current} · logged today`
    : data.streak.current > 0
      ? `Streak ${data.streak.current}`
      : "No streak yet"

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.mark}>EatoBiotics</Text>
      <Text style={styles.title}>Today</Text>

      {data.bioticsScore != null ? (
        <View style={styles.card}>
          <Text style={styles.kicker}>{BIOTICS_SCORE}</Text>
          <Text style={styles.score}>{data.bioticsScore}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.kicker}>Next</Text>
        <Text style={styles.body}>{data.nextStep.copy}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.kicker}>Streak</Text>
        <Text style={styles.body}>{streakLine}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.kicker}>Today's check-in</Text>
        {data.ritualToday ? (
          RITUAL_ROWS.map((row) => (
            <Text key={row.key} style={styles.ritual}>
              {data.ritualToday?.[row.key] ? "✓" : "○"} {row.label}
            </Text>
          ))
        ) : (
          <Text style={styles.muted}>Nothing checked in yet. Check-in writes land next.</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.kicker}>Recently</Text>
        {data.recentActivity.length === 0 ? (
          <Text style={styles.muted}>Nothing logged this week.</Text>
        ) : (
          data.recentActivity.map((entry, i) => (
            <Text key={`${entry.kind}-${entry.at}-${i}`} style={styles.ritual}>
              {entry.kind === "meal"
                ? `${entry.summary}${
                    entry.mealBioticsScore != null
                      ? ` · ${MEAL_BIOTICS_SCORE} ${entry.mealBioticsScore}`
                      : ""
                  }`
                : entry.summary}
            </Text>
          ))
        )}
      </View>

      <Text style={styles.tier}>
        Access: {data.entitlementTier === "member" ? MEMBER : data.entitlementTier}. Nothing is sold in this app.
      </Text>

      <Pressable accessibilityRole="button" onPress={onSignOut} style={styles.signOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: "#F7F4EE",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 12,
  },
  page: {
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 48,
    backgroundColor: "#F7F4EE",
    gap: 14,
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
    gap: 6,
  },
  kicker: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "#5C6B63",
  },
  score: {
    fontSize: 40,
    fontWeight: "700",
    color: "#1B3A2F",
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
    color: "#1B3A2F",
  },
  ritual: {
    fontSize: 15,
    color: "#1B3A2F",
    paddingVertical: 2,
  },
  muted: {
    fontSize: 15,
    color: "#5C6B63",
    textAlign: "center",
  },
  tier: {
    fontSize: 13,
    color: "#5C6B63",
    marginTop: 8,
  },
  secondary: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1B3A2F",
  },
  secondaryText: {
    color: "#1B3A2F",
    fontWeight: "600",
  },
  signOut: {
    marginTop: 8,
    alignSelf: "flex-start",
    paddingVertical: 10,
  },
  signOutText: {
    fontSize: 15,
    color: "#5C6B63",
  },
})
