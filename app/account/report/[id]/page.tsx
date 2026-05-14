import { redirect, notFound } from "next/navigation"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"
import type { Metadata } from "next"
import { ReportClient } from "./report-client"
import type { WeeklyReportJson } from "@/app/api/weekly-report/generate/route"

export const metadata: Metadata = {
  title: "The Food System Inside You — EatoBiotics",
  description: "Your weekly gut intelligence report.",
  robots: "noindex",
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function WeeklyReportPage({ params }: Props) {
  const { id } = await params

  const user = await getUser()
  if (!user) redirect("/assessment?signin=1")

  const adminSupabase = getSupabase()
  if (!adminSupabase) notFound()

  const { data: report, error } = await adminSupabase
    .from("weekly_checkins")
    .select("id, content, report_json, week_starting, user_id")
    .eq("id", id)
    .single()

  if (error || !report || (report.user_id as string) !== user.id) notFound()

  /* Fetch user name */
  const { data: profile } = await adminSupabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single()

  return (
    <div className="min-h-screen bg-background pt-[57px]">
      <ReportClient
        reportId={report.id as string}
        weekStarting={report.week_starting as string}
        content={report.content as string}
        reportJson={(report.report_json as WeeklyReportJson) ?? null}
        memberName={(profile?.name as string | null) ?? null}
      />
    </div>
  )
}
