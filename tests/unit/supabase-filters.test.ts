import { describe, it, expect } from "vitest"
import { pgQuote, ownerOrFilter } from "@/lib/supabase-filters"

describe("pgQuote", () => {
  it("wraps a plain value in double quotes", () => {
    expect(pgQuote("user@example.com")).toBe('"user@example.com"')
  })

  it("escapes embedded double quotes and backslashes", () => {
    expect(pgQuote('a"b')).toBe('"a\\"b"')
    expect(pgQuote("a\\b")).toBe('"a\\\\b"')
  })

  it("neutralises PostgREST-reserved characters by quoting them", () => {
    // A comma in an unquoted value would inject a new OR condition; quoting it
    // keeps it part of the literal value.
    const malicious = "x,user_id.eq.00000000-0000-0000-0000-000000000000"
    expect(pgQuote(malicious)).toBe(`"${malicious}"`)
  })
})

describe("ownerOrFilter", () => {
  it("includes both user_id and email when an email is given", () => {
    expect(ownerOrFilter("uid-1", "a@b.com")).toBe(
      'user_id.eq."uid-1",email.eq."a@b.com"'
    )
  })

  it("includes only user_id when email is missing", () => {
    expect(ownerOrFilter("uid-1")).toBe('user_id.eq."uid-1"')
    expect(ownerOrFilter("uid-1", null)).toBe('user_id.eq."uid-1"')
    expect(ownerOrFilter("uid-1", "")).toBe('user_id.eq."uid-1"')
  })
})
