import type { Metadata } from "next"
import { MyPlateClient } from "./myplate-client"

export const metadata: Metadata = {
  title: "My Plate",
  description:
    "Build your EatoBiotics plate, track your 30 plants, and calculate your daily Biotics Score.",
  openGraph: {
    title: "My Plate | EatoBiotics",
    description:
      "Build your EatoBiotics plate, track your 30 plants, and calculate your daily Biotics Score.",
  },
}

export default function MyPlatePage() {
  return <MyPlateClient />
}
