import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { buildAccountTwin, type AccountTwinInput } from "@/lib/agent-loop/account-twin"
import { twinVisualState } from "@/lib/account/twin-visual"
import { buildTwinLenses } from "@/lib/account/twin-data"
import { twinFigureSrc, twinVideo } from "@/lib/account/twin-figure"
import { TwinDashboard } from "@/components/account/twin/twin-dashboard"

export const metadata: Metadata = {
  title: "Your Food System Preview — EatoBiotics",
  robots: "noindex",
}

/** Sample data for Sarah M. — mirrors the demo dashboard. */
const DEMO_INPUT: AccountTwinInput = {
  score: 62,
  previousScore: 54,
  profileType: "Emerging Balance",
  biotics: { prebiotic: 71, probiotic: 52, postbiotic: 40 },
  streak: 5,
  meals: [
    { name: "Chicken, roasted veg & kefir", score: 81, prebiotic: 75, probiotic: 65, postbiotic: 58, createdAt: new Date(Date.now() - 3 * 3_600_000).toISOString() },
    { name: "Lentil wrap with mixed greens", score: 74, prebiotic: 72, probiotic: 8, postbiotic: 42, createdAt: new Date(Date.now() - 26 * 3_600_000).toISOString() },
    { name: "Greek yoghurt, berries & oats", score: 69, prebiotic: 55, probiotic: 58, postbiotic: 44, createdAt: new Date(Date.now() - 30 * 3_600_000).toISOString() },
    { name: "Mackerel, kimchi & asparagus", score: 71, prebiotic: 72, probiotic: 18, postbiotic: 41, createdAt: new Date(Date.now() - 50 * 3_600_000).toISOString() },
  ],
}

export default async function DemoTwinPage() {
  const { twin, feed } = await buildAccountTwin(DEMO_INPUT)
  const visual = twinVisualState(twin)
  const lenses = buildTwinLenses()

  return (
    <div className="bg-background">
      <div className="border-b px-4 py-2.5" style={{ background: "color-mix(in srgb, var(--icon-teal) 8%, var(--background))", borderColor: "color-mix(in srgb, var(--icon-teal) 20%, transparent)" }}>
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <Link href="/demo/account/member" className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft size={12} /> Account
          </Link>
          <p className="text-xs font-semibold" style={{ color: "var(--icon-teal)" }}>Your Food System preview — sample data for Sarah M.</p>
        </div>
      </div>
      {/* userId=null → Realtime hook no-ops; demo mode adds "Simulate a meal". */}
      <TwinDashboard twin={twin} visual={visual} feed={feed} lenses={lenses} userId={null} figureSrc={twinFigureSrc("female")} video={twinVideo("female")} demo streak={DEMO_INPUT.streak ?? 0} consultHref="/demo/account/consult" />
    </div>
  )
}
