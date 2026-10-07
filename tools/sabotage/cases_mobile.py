# P0 MOBILE COMPANION — Cases 1600+.
#
# The brief's §5.3 demonstration: a per-Biotic score with a bar in React
# Native must fail a test. These cases prove the guard is load-bearing, not
# decorative. When a case slips, strengthen the TEST, never the case.

APP = "apps/mobile/App.tsx"
CORPUS = "tests/unit/customer-surfaces.ts"
CLAIMS = "tests/unit/biotic-claims.test.ts"
RN = "tests/unit/biotic-visual-encoding-rn.test.ts"
P0 = "tests/unit/mobile-p0.test.ts"
TODAY = "packages/contracts/src/mobile-today.ts"
VISUAL = "packages/claims/src/visual-encoding.ts"

CASES = [
    (1600, "a per-Biotic RN bar is introduced into App.tsx", APP,
     '      <Text style={styles.hold}>Today, meals and check-in land in later phases.</Text>',
     '      <Text>Your Prebiotics {twin.biotics.prebiotics.score}/100</Text>\n'
     '      <View style={{ width: `${twin.biotics.prebiotics.score}%`, backgroundColor: "#2DAA6E" }} />\n'
     '      <Text style={styles.hold}>Today, meals and check-in land in later phases.</Text>',
     [RN]),

    (1601, "personal Pre/Pro/Post stats land as Text in App.tsx", APP,
     '<Text style={styles.line}>Daily companion for iOS and Android.</Text>',
     '<Text style={styles.line}>Your Prebiotics score is 71/100</Text>',
     [RN, "tests/unit/biotic-claims.test.ts"]),

    (1602, "the mobile corpus is dropped from GUARDED_SURFACES", CLAIMS,
     "  ...MOBILE_SURFACES,\n]",
     "]",
     ["tests/unit/biotic-claims.test.ts"]),

    (1603, "App.tsx quietly leaves MOBILE_SURFACES", CORPUS,
     '  "apps/mobile/App.tsx",\n',
     "",
     ["tests/unit/biotic-claims.test.ts", P0]),

    (1604, "the RN extent sink loses the transform-array dialect", VISUAL,
     r"|\btransform\s*:\s*\[\s*\{\s*scale\s*:",
     "",
     [RN]),

    (1605, "the today contract grows personal per-Biotic scores", TODAY,
     "  entitlementTier: resolvedTierSchema,\n})",
     "  entitlementTier: resolvedTierSchema,\n"
     "  prebiotic_score: z.number(),\n"
     "  probiotic_score: z.number(),\n"
     "  postbiotic_score: z.number(),\n})",
     [P0]),
]
