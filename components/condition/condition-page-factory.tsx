import type { Metadata } from "next"
import { getCondition, type ConditionKey } from "@/lib/conditions"
import { ConditionHero } from "./condition-hero"
import { ConditionBody } from "./condition-body"
import { ConditionScience } from "./condition-science"
import { ConditionPathway } from "./condition-pathway"
import { ConditionFoodSupport } from "./condition-food-support"
import { ConditionFoods } from "./condition-foods"
import { ConditionCta } from "./condition-cta"
import { ConditionDisclaimer } from "./condition-disclaimer"

/**
 * Factory for the condition-vertical landing pages, mirroring
 * components/book/chapter/chapter-page-factory.tsx: each app/<condition>/
 * page.tsx collapses to generateConditionMetadata(key) + createConditionPage(key),
 * with all copy in lib/conditions.ts and all rendering in the eight shared
 * components in this directory. Section order matches the original pages
 * exactly: Hero → Body → Science → Pathway → FoodSupport → Foods → Cta →
 * Disclaimer, divided by .section-divider.
 */
export function generateConditionMetadata(key: ConditionKey): Metadata {
  const c = getCondition(key)
  return {
    title: c.seo.title,
    description: c.seo.description,
    openGraph: {
      title: c.seo.ogTitle,
      description: c.seo.ogDescription,
    },
  }
}

export function createConditionPage(key: ConditionKey) {
  const condition = getCondition(key)
  return function ConditionPage() {
    return (
      <>
        <ConditionHero condition={condition} />
        <div className="section-divider" />
        <ConditionBody condition={condition} />
        <div className="section-divider" />
        <ConditionScience condition={condition} />
        <div className="section-divider" />
        <ConditionPathway condition={condition} />
        <div className="section-divider" />
        <ConditionFoodSupport condition={condition} />
        <div className="section-divider" />
        <ConditionFoods condition={condition} />
        <div className="section-divider" />
        <ConditionCta condition={condition} />
        <div className="section-divider" />
        <ConditionDisclaimer condition={condition} />
      </>
    )
  }
}
