import { useCallback, useEffect, useState } from "react"
import { StatusBar } from "expo-status-bar"
import * as Linking from "expo-linking"
import { StyleSheet, Text, View } from "react-native"
import { MEMBER } from "@eatobiotics/vocabulary"
import { completeMagicLink, isAuthCallbackUrl } from "./src/auth/deep-link"
import { getMobileSupabase, readSession, signOut } from "./src/auth/session"
import { AccountScreen } from "./src/screens/AccountScreen"
import { MealScreen } from "./src/screens/MealScreen"
import { ProgressScreen } from "./src/screens/ProgressScreen"
import { SignInScreen } from "./src/screens/SignInScreen"
import { TodayScreen } from "./src/screens/TodayScreen"

/**
 * Companion shell. Signed-in members see Today from GET /api/mobile/v1/today.
 * This week is GET /api/mobile/v1/progress. Signed-out members see the
 * holding copy plus magic-link sign-in.
 *
 * This file is in the claims corpus. A personal per-Biotic bar, band,
 * body-state or "Your Prebiotics" sentence here must fail CI.
 */
export default function App() {
  const [ready, setReady] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [screen, setScreen] = useState<"today" | "meal" | "progress" | "account">("today")

  const hydrate = useCallback(async () => {
    const session = await readSession()
    setAccessToken(session?.access_token ?? null)
    setReady(true)
  }, [])

  useEffect(() => {
    void hydrate()
    const supabase = getMobileSupabase()
    if (!supabase) return
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setAccessToken(session?.access_token ?? null)
    })
    return () => data.subscription.unsubscribe()
  }, [hydrate])

  useEffect(() => {
    async function onUrl(url: string | null) {
      if (!url || !isAuthCallbackUrl(url)) return
      const result = await completeMagicLink(url)
      if (result.ok) await hydrate()
    }
    const sub = Linking.addEventListener("url", (event) => {
      void onUrl(event.url)
    })
    void Linking.getInitialURL().then((url) => void onUrl(url))
    return () => sub.remove()
  }, [hydrate])

  async function onSignOut() {
    await signOut()
    setAccessToken(null)
    setScreen("today")
  }

  if (!ready) {
    return (
      <View style={styles.container}>
        <Text style={styles.mark}>EatoBiotics</Text>
        <StatusBar style="auto" />
      </View>
    )
  }

  if (accessToken && screen === "meal") {
    return (
      <>
        <MealScreen
          accessToken={accessToken}
          onBack={() => setScreen("today")}
          onSignOut={() => void onSignOut()}
        />
        <StatusBar style="auto" />
      </>
    )
  }

  if (accessToken && screen === "progress") {
    return (
      <>
        <ProgressScreen
          accessToken={accessToken}
          onBack={() => setScreen("today")}
          onSignOut={() => void onSignOut()}
        />
        <StatusBar style="auto" />
      </>
    )
  }

  if (accessToken && screen === "account") {
    return (
      <>
        <AccountScreen
          accessToken={accessToken}
          onBack={() => setScreen("today")}
          onSignOut={() => void onSignOut()}
          onDeleted={() => void onSignOut()}
        />
        <StatusBar style="auto" />
      </>
    )
  }

  if (accessToken) {
    return (
      <>
        <TodayScreen
          accessToken={accessToken}
          onLogMeal={() => setScreen("meal")}
          onThisWeek={() => setScreen("progress")}
          onAccount={() => setScreen("account")}
          onSignOut={() => void onSignOut()}
        />
        <StatusBar style="auto" />
      </>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.mark}>EatoBiotics</Text>
      <Text style={styles.line}>Daily companion for iOS and Android.</Text>
      <Text style={styles.line}>
        {MEMBER} access is read on the server. Nothing is sold in this app.
      </Text>
      <Text style={styles.hold}>Today, meals and check-in land in later phases.</Text>
      <SignInScreen />
      <StatusBar style="auto" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F4EE",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 12,
  },
  mark: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1B3A2F",
  },
  line: {
    fontSize: 16,
    textAlign: "center",
    color: "#1B3A2F",
  },
  hold: {
    fontSize: 14,
    textAlign: "center",
    color: "#5C6B63",
    marginTop: 8,
  },
})
