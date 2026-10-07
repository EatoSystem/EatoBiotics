import { StatusBar } from "expo-status-bar"
import { StyleSheet, Text, View } from "react-native"
import { MEMBER } from "@eatobiotics/vocabulary"

/**
 * P0 scaffold. No Today / Meal / Check-in / Progress screens yet — those
 * wait until the §5.3 demonstration is red-then-green (this PR) and P1
 * lands auth + GET /api/mobile/v1/today.
 *
 * This file is in the claims corpus. A personal per-Biotic bar, band,
 * body-state or "Your Prebiotics" sentence here must fail CI.
 */
export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.mark}>EatoBiotics</Text>
      <Text style={styles.line}>Daily companion for iOS and Android.</Text>
      <Text style={styles.line}>
        {MEMBER} access is read on the server. Nothing is sold in this app.
      </Text>
      <Text style={styles.hold}>Today, meals and check-in land in later phases.</Text>
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
