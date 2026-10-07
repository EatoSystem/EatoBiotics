import { useState } from "react"
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native"
import { requestMagicLink } from "../auth/magic-link"

export function SignInScreen() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const [error, setError] = useState<string | null>(null)

  async function onSend() {
    setStatus("sending")
    setError(null)
    const result = await requestMagicLink(email)
    if (!result.ok) {
      setStatus("error")
      setError(
        result.reason === "invalid_email"
          ? "Enter a valid email address."
          : "Could not send a sign-in link. Try again.",
      )
      return
    }
    setStatus("sent")
  }

  return (
    <View style={styles.form}>
      <Text style={styles.label}>Email</Text>
      <TextInput
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        keyboardType="email-address"
        onChangeText={setEmail}
        placeholder="you@example.com"
        placeholderTextColor="#8A948E"
        style={styles.input}
        value={email}
      />
      <Pressable
        accessibilityRole="button"
        disabled={status === "sending"}
        onPress={() => void onSend()}
        style={[styles.button, status === "sending" && styles.buttonDisabled]}
      >
        <Text style={styles.buttonText}>
          {status === "sending" ? "Sending…" : "Send sign-in link"}
        </Text>
      </Pressable>
      {status === "sent" ? (
        <Text style={styles.note}>Check your email. Open the link on this device to continue.</Text>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  form: {
    width: "100%",
    marginTop: 16,
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1B3A2F",
  },
  input: {
    borderWidth: 1,
    borderColor: "#C5D0C9",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1B3A2F",
    backgroundColor: "#FFFFFF",
  },
  button: {
    marginTop: 4,
    backgroundColor: "#1B3A2F",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#F7F4EE",
    fontSize: 16,
    fontWeight: "600",
  },
  note: {
    marginTop: 4,
    fontSize: 14,
    color: "#5C6B63",
    textAlign: "center",
  },
  error: {
    marginTop: 4,
    fontSize: 14,
    color: "#8A3B2A",
    textAlign: "center",
  },
})
