import { Hero } from "@/components/home/hero"
import { TheThreeBiotics } from "@/components/home/the-three-biotics"
import { LatestFromSubstack } from "@/components/home/latest-from-substack"

export default function Home() {
  return (
    <>
      <Hero />
      <TheThreeBiotics />
      <LatestFromSubstack />
    </>
  )
}
