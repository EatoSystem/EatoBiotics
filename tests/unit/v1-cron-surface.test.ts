import { describe, it, expect } from "vitest"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import ts from "typescript"

/**
 * What V1 runs on a schedule — V1 scope freeze, step 5.
 *
 * ══ WHY THIS IS PINNED AS A SET ═════════════════════════════════════════════
 *
 * `vercel.json` scheduled nine jobs. Eight of them drove products V1 does not
 * sell, legacy tiers, or the feedback capture step 2 withdrew — two of them
 * emailing customers links into routes step 3 now refuses. Deleting the
 * entries is a one-line change per cron and nothing would notice a later
 * commit putting one back, which is the failure mode this programme keeps
 * finding.
 *
 * So the schedule is asserted as an EXACT SET, failing in both directions: a
 * removed cron reappearing is red, and the retention job disappearing is red.
 * The second direction matters more than it looks — that job is the only
 * thing enforcing the 30-day window on `paid_report_intents`, and losing it
 * silently is how the promise became fictional the first time.
 */

const ROOT = process.cwd()

interface CronEntry {
  path: string
  schedule: string
}

function scheduledCrons(): CronEntry[] {
  const cfg = JSON.parse(readFileSync(join(ROOT, "vercel.json"), "utf8")) as { crons?: CronEntry[] }
  return cfg.crons ?? []
}

/**
 * The V1 scheduled set. ONE job.
 *
 * `/api/feedback/retention` is the only thing enforcing the 30-day window on
 * `paid_report_intents` — health-derived score summaries held between
 * checkout and report generation. Nothing else about V1 requires a machine to
 * wake up on a timer.
 */
const V1_CRONS: Record<string, string> = {
  "/api/feedback/retention": "0 3 * * *",
}

/**
 * Unscheduled in V1, and DORMANT rather than deleted: the route files stay on
 * disk with their CRON_SECRET protection intact, so reinstating one is a
 * `vercel.json` entry and this list.
 */
const UNSCHEDULED: Array<[string, string]> = [
  // Dispositioned as not required for V1. It was briefly kept on the schedule
  // on the grounds that its template links only to /assessment and /pricing —
  // which is the WRONG TEST. A clean template proves an email would not send
  // anyone into a refused route; it says nothing about whether V1 needs the
  // automation to run. Content validity and scheduling necessity are separate
  // questions, and this entry is here so the conflation is not repeated.
  ["/api/email/sequence", "not required for V1 — a V1-safe template is not a V1-required job"],
  ["/api/weekly-checkin", "Transform-only weekly check-ins — a Claude call per member for a tier V1 does not sell"],
  ["/api/email/week-inside", "renders the Living Twin 'This Week' story; links to /account/twin and the non-existent /account/week-story"],
  ["/api/glp1/reminder", "GLP-1 is Post-V1; /account/glp1 refuses"],
  ["/api/stability/reminder", "Stability is Post-V1"],
  ["/api/email/trial-winback", "out of V1 by an earlier decision; the 30-day entitlement itself is untouched"],
  ["/api/email/paid-onboarding", "six CTAs into refused routes; its four emails are a tour of what V1 does not sell"],
  ["/api/feedback/digest", "feedback capture left the V1 surface in step 2 — a weekly Claude synthesis of nothing"],
]

describe("the V1 scheduled set", () => {
  it("is exactly one job — no more, and no fewer", () => {
    const paths = scheduledCrons().map((c) => c.path).sort()
    expect(paths).toEqual(Object.keys(V1_CRONS).sort())
  })

  it("keeps it at its agreed time", () => {
    for (const cron of scheduledCrons()) {
      expect(cron.schedule, `${cron.path} runs at an unexpected time`).toBe(V1_CRONS[cron.path])
    }
  })

  it("the retention sweep is scheduled — losing it is how the promise became fictional", () => {
    const retention = scheduledCrons().find((c) => c.path === "/api/feedback/retention")
    expect(retention, "nothing would enforce the 30-day paid_report_intents window").toBeDefined()
    expect(retention!.schedule).toBe("0 3 * * *")
  })

  it("every scheduled path resolves to a real route handler", () => {
    // A typo schedules nothing, silently, forever.
    for (const cron of scheduledCrons()) {
      const file = join(ROOT, "app", cron.path, "route.ts")
      expect(existsSync(file), `${cron.path} has no route.ts`).toBe(true)
    }
  })

  it("no removed cron is listed", () => {
    const paths = new Set(scheduledCrons().map((c) => c.path))
    const returned = UNSCHEDULED.filter(([p]) => paths.has(p)).map(([p]) => p)
    expect(returned, `back on the schedule without a decision: ${returned.join(", ")}`).toEqual([])
  })
})

describe("the unscheduled jobs are dormant, not deleted", () => {
  it("the list is the real one", () => {
    // Non-vacuity: nine scheduled before this phase, one kept, eight removed.
    expect(UNSCHEDULED).toHaveLength(8)
    expect(Object.keys(V1_CRONS)).toHaveLength(1)
  })

  for (const [path, why] of UNSCHEDULED) {
    it(`${path} still exists on disk (${why})`, () => {
      expect(existsSync(join(ROOT, "app", path, "route.ts")), `${path} was deleted`).toBe(true)
    })
  }

  /**
   * ══ WHY THIS PARSES ═══════════════════════════════════════════════════════
   *
   * An unscheduled route is still a URL. What keeps it shut is
   * `verifyCronRequest`, which fails CLOSED — 503 with no CRON_SECRET
   * configured, 401 with the wrong bearer. Grepping for the identifier would
   * go green on the import line alone, so the call is located in the syntax
   * tree inside each exported handler.
   */
  function handlersGuarded(source: string): { handlers: string[]; guarded: string[] } {
    const sf = ts.createSourceFile("route.ts", source, ts.ScriptTarget.ESNext, true)
    const handlers: string[] = []
    const guarded: string[] = []
    for (const st of sf.statements) {
      if (!ts.isFunctionDeclaration(st) || !st.body || !st.name) continue
      if (!["GET", "POST"].includes(st.name.text)) continue
      handlers.push(st.name.text)
      let calls = false
      ;(function visit(node: ts.Node) {
        if (
          ts.isCallExpression(node) &&
          ts.isIdentifier(node.expression) &&
          node.expression.text === "verifyCronRequest"
        ) {
          calls = true
        }
        ts.forEachChild(node, visit)
      })(st.body)
      if (calls) guarded.push(st.name.text)
    }
    return { handlers, guarded }
  }

  for (const [path] of [...UNSCHEDULED, ...Object.keys(V1_CRONS).map((p) => [p] as [string])]) {
    it(`${path} still fails closed without the cron secret`, () => {
      const src = readFileSync(join(ROOT, "app", path, "route.ts"), "utf8")
      const { handlers, guarded } = handlersGuarded(src)
      expect(handlers.length, `${path} exports no GET or POST`).toBeGreaterThan(0)
      expect(guarded, `${path}: a handler does not call verifyCronRequest`).toEqual(handlers)
    })
  }

  it("the guard would notice a handler that dropped the check", () => {
    const unguarded = `
      export async function GET(req: NextRequest) {
        return NextResponse.json({ ok: true })
      }
    `
    const { handlers, guarded } = handlersGuarded(unguarded)
    expect(handlers).toEqual(["GET"])
    expect(guarded).toEqual([])
  })
})
