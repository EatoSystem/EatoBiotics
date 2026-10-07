import { useEffect, useRef, useState } from "react"
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native"
import { MEAL_BIOTICS_SCORE } from "@eatobiotics/vocabulary"
import type { AnalyseMealRequest, MealScanSnapshot } from "@eatobiotics/contracts"
import { createMealScanController } from "../sync/meal-scan"
import { deviceKv } from "../sync/persist"

const MEAL_TYPES: AnalyseMealRequest["meal_type"][] = ["Breakfast", "Lunch", "Dinner", "Snack"]

const SYNC_COPY = {
  idle: "Describe the plate or take a photo.",
  queued: "Queued — waiting to send",
  sent: "Sent",
  failed: "Failed — tap to retry",
} as const

type ImagePickerModule = {
  requestCameraPermissionsAsync: () => Promise<{ granted: boolean }>
  requestMediaLibraryPermissionsAsync: () => Promise<{ granted: boolean }>
  launchCameraAsync: (opts: {
    base64: boolean
    quality: number
  }) => Promise<{ canceled: boolean; assets?: { base64?: string | null; mimeType?: string | null }[] }>
  launchImageLibraryAsync: (opts: {
    base64: boolean
    quality: number
  }) => Promise<{ canceled: boolean; assets?: { base64?: string | null; mimeType?: string | null }[] }>
}

async function loadPicker(): Promise<ImagePickerModule | null> {
  try {
    return (await import("expo-image-picker")) as ImagePickerModule
  } catch (error) {
    console.error("[mobile-analyse-meal] camera unavailable", error)
    return null
  }
}

function assetToDataUrl(asset: { base64?: string | null; mimeType?: string | null }): string | undefined {
  if (!asset.base64) return undefined
  return `data:${asset.mimeType ?? "image/jpeg"};base64,${asset.base64}`
}

export function MealScreen({
  accessToken,
  onBack,
  onSignOut,
}: {
  accessToken: string
  onBack: () => void
  onSignOut: () => void
}) {
  const [description, setDescription] = useState("")
  const [image, setImage] = useState<string | undefined>()
  const [mealType, setMealType] = useState<AnalyseMealRequest["meal_type"]>()
  const [scan, setScan] = useState<MealScanSnapshot>({
    status: "idle",
    description: "",
    hasImage: false,
    mealType: undefined,
    view: null,
    error: null,
    reason: null,
  })
  const [pickerError, setPickerError] = useState<string | null>(null)
  const controllerRef = useRef<ReturnType<typeof createMealScanController> | null>(null)

  useEffect(() => {
    const controller = createMealScanController({
      accessToken,
      kv: deviceKv,
    })
    controllerRef.current = controller
    const unsub = controller.subscribe((snap) => {
      setScan(snap)
      if (snap.reason === "unauthorised") onSignOut()
    })
    void controller.hydrate().then((result) => {
      if (result.unauthorised) onSignOut()
    })
    return () => {
      unsub()
      controllerRef.current = null
    }
  }, [accessToken, onSignOut])

  async function pick(from: "camera" | "library") {
    setPickerError(null)
    const picker = await loadPicker()
    if (!picker) {
      setPickerError("Camera isn't available on this device.")
      return
    }
    const perm =
      from === "camera"
        ? await picker.requestCameraPermissionsAsync()
        : await picker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      setPickerError(
        from === "camera"
          ? "Camera permission is needed to photograph a meal."
          : "Photo library permission is needed to choose a meal photo.",
      )
      return
    }
    const result =
      from === "camera"
        ? await picker.launchCameraAsync({ base64: true, quality: 0.6 })
        : await picker.launchImageLibraryAsync({ base64: true, quality: 0.6 })
    if (result.canceled || !result.assets?.[0]) return
    const dataUrl = assetToDataUrl(result.assets[0])
    if (!dataUrl) {
      setPickerError("That photo could not be read. Try another.")
      return
    }
    setImage(dataUrl)
  }

  function onSubmit() {
    void controllerRef.current?.submit({
      description,
      image,
      mealType,
    })
  }

  function onRetry() {
    if (scan.status !== "failed") return
    void controllerRef.current?.retry()
  }

  const view = scan.view

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.back}>
        <Text style={styles.backText}>Today</Text>
      </Pressable>
      <Text style={styles.mark}>EatoBiotics</Text>
      <Text style={styles.title}>Meal</Text>

      <View style={styles.card}>
        <Text style={styles.kicker}>What is on the plate</Text>
        <TextInput
          multiline
          onChangeText={setDescription}
          placeholder="Oats, berries, yoghurt…"
          placeholderTextColor="#8A948E"
          style={styles.input}
          value={description}
        />
        <View style={styles.row}>
          <Pressable accessibilityRole="button" onPress={() => void pick("camera")} style={styles.secondary}>
            <Text style={styles.secondaryText}>Take photo</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => void pick("library")} style={styles.secondary}>
            <Text style={styles.secondaryText}>Choose photo</Text>
          </Pressable>
        </View>
        {image ? <Text style={styles.muted}>Photo attached.</Text> : null}
        {pickerError ? <Text style={styles.error}>{pickerError}</Text> : null}
        <View style={styles.row}>
          {MEAL_TYPES.map((type) => (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: mealType === type }}
              key={type}
              onPress={() => setMealType(type)}
              style={[styles.chip, mealType === type ? styles.chipOn : null]}
            >
              <Text style={styles.chipText}>{type}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={scan.status === "queued"}
          onPress={onSubmit}
          style={styles.button}
        >
          <Text style={styles.buttonText}>
            {scan.status === "queued" ? "Sending…" : "Analyse meal"}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: scan.status !== "failed" }}
          onPress={onRetry}
          style={styles.syncLine}
        >
          <Text style={[styles.syncText, scan.status === "failed" ? styles.syncFailed : null]}>
            {SCAN_STATUS(scan)}
          </Text>
        </Pressable>
        {scan.error ? <Text style={styles.error}>{scan.error}</Text> : null}
      </View>

      {view ? (
        <View style={styles.card}>
          <Text style={styles.kicker}>{MEAL_BIOTICS_SCORE}</Text>
          <Text style={styles.score}>{view.mealBioticsScore}</Text>
          <Text style={styles.body}>{view.mealName}</Text>
          <Text style={styles.muted}>
            {view.calories} kcal · {view.protein} g protein · {view.fibre} g fibre
          </Text>
          <Text style={styles.body}>{view.insight}</Text>
          <Text style={styles.kicker}>On this plate</Text>
          {view.tags.length === 0 ? (
            <Text style={styles.muted}>No extra tags for this plate.</Text>
          ) : (
            view.tags.map((tag) => (
              <Text key={tag} style={styles.tag}>
                {tag}
              </Text>
            ))
          )}
        </View>
      ) : null}
    </ScrollView>
  )
}

function SCAN_STATUS(scan: MealScanSnapshot): string {
  if (scan.status === "idle") return SYNC_COPY.idle
  if (scan.status === "queued") return SYNC_COPY.queued
  if (scan.status === "sent") return SYNC_COPY.sent
  return SYNC_COPY.failed
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
  input: {
    borderWidth: 1,
    borderColor: "#C5D0C9",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1B3A2F",
    minHeight: 88,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  secondary: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1B3A2F",
  },
  secondaryText: {
    color: "#1B3A2F",
    fontWeight: "600",
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#C5D0C9",
  },
  chipOn: {
    borderColor: "#1B3A2F",
    backgroundColor: "#E8F0EC",
  },
  chipText: {
    fontSize: 13,
    color: "#1B3A2F",
  },
  button: {
    marginTop: 4,
    backgroundColor: "#1B3A2F",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "#F7F4EE",
    fontWeight: "700",
    fontSize: 16,
  },
  tag: {
    fontSize: 15,
    color: "#1B3A2F",
    paddingVertical: 2,
  },
  syncLine: {
    marginTop: 4,
    alignSelf: "flex-start",
  },
  syncText: {
    fontSize: 13,
    color: "#5C6B63",
  },
  syncFailed: {
    color: "#8B3A2F",
  },
  muted: {
    fontSize: 15,
    color: "#5C6B63",
  },
  error: {
    fontSize: 14,
    color: "#8B3A2F",
  },
})
