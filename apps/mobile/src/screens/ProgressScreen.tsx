import { useCallback, useEffect, useState } from "react"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { BIOTICS_SCORE, MEAL_BIOTICS_SCORE, MEMBER } from "@eatobiotics/vocabulary"
import type { MobileProgressResponse } from "@eatobiotics/contracts"
import { fetchProgress } from "../api/progress"

export function ProgressScreen({
  accessToken,
  onBack,
  onSignOut,
}: {
  accessToken: string
  onBack: () => void
  onSignOut: () => void
}) {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "ready"; data: MobileProgressResponse }
    | { status: "error"; reason: "unauthorised" | "unavailable" | "invalid" }
  >({ status: "loading" })

  const load = useCallback(async () => {
    setState({ status: "loading" })
    const result = await fetchProgress(accessToken)
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
        <Text style={styles.muted}>Loading this week…</Text>
      </View>
    )
  }

  if (state.status === "error") {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>This week</Text>
        <Text style={styles.muted}>This week isn't available right now.</Text>
        <Pressable accessibilityRole="button" onPress={() => void load()} style={styles.secondary}>
          <Text style={styles.secondaryText}>Try again</Text>
        </Pressable>
      </View>
    )
  }

  const { data } = state

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.back}>
        <Text style={styles.backText}>Today</Text>
      </Pressable>
      <Text style={styles.mark}>EatoBiotics</Text>
      <Text style={styles.title}>This week</Text>

      {data.bioticsScore != null ? (
        <View style={styles.card}>
          <Text style={styles.kicker}>{BIOTICS_SCORE}</Text>
          <Text style={styles.score}>{data.bioticsScore}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.kicker}>This week</Text>
        <Text style={styles.body}>{data.summary.copy}</Text>
      </View>

      {data.days.map((day) => (
        <View key={day.date} style={styles.card}>
          <Text style={styles.kicker}>{day.label}</Text>
          {day.meals.length === 0 && day.ritualLine == null ? (
            <Text style={styles.muted}>Nothing logged.</Text>
          ) : null}
          {day.meals.map((meal, i) => (
            <Text key={`${meal.at}-${i}`} style={styles.row}>
              {meal.summary}
              {meal.mealBioticsScore != null
                ? ` · ${MEAL_BIOTICS_SCORE} ${meal.mealBioticsScore}`
                : ""}
            </Text>
          ))}
          {day.ritualLine ? <Text style={styles.row}>Check-in: {day.ritualLine}</Text> : null}
        </View>
      ))}

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
  row: {
    fontSize: 15,
    color: "#1B3A2F",
    paddingVertical: 2,
  },
  muted: {
    fontSize: 15,
    color: "#5C6B63",
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
