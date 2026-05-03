import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"
import { getUserMembershipTier } from "@/lib/membership"
import { StoryClient, type GutHealthStory } from "./story-client"

export const metadata: Metadata = {
  title: "Your Gut Health Story | EatoBiotics",
  description: "A personal narrative of your gut health journey — where you started, what the patterns show, and where you're headed.",
}

export default async function StoryPage() {
  const user = await getUser()
  if (!user) redirect("/assessment?signin=1")

  const tier = await getUserMembershipTier(user.id)
  if (tier === "free" || tier === "grow") {
    redirect("/pricing?feature=gut-story")
  }

  const supabase = getSupabase()
  let existingStory: GutHealthStory | null = null

  if (supabase) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("food_system_story")
      .eq("id", user.id)
      .single()

    const storyJson = profile?.food_system_story as {
      story?: Record<string, unknown>
    } | null

    // Only use new-format stories (have sections array)
    if (storyJson?.story?.sections) {
      existingStory = storyJson.story as unknown as GutHealthStory
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        {/* Page header */}
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--icon-teal)" }}>
            Your Story
          </p>
          <h1 className="font-serif text-3xl font-bold text-foreground tracking-tight">
            Your gut health story
          </h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Claude reads your full history — assessment score, 90 days of meals, your biotic patterns — and writes a warm, personal narrative of your gut health journey.
          </p>
        </div>

        <StoryClient tier={tier as "member" | "restore" | "transform"} existingStory={existingStory} />
      </div>
    </div>
  )
}
