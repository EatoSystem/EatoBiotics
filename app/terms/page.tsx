import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Terms of Service — EatoBiotics",
  description: "The terms and conditions governing use of the EatoBiotics platform.",
}

const LAST_UPDATED = "15 May 2025"
const CONTACT_EMAIL = "hello@eatobiotics.com"
const COMPANY_NAME = "EatoBiotics"
const GOVERNING_LAW = "Republic of Ireland"

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background pt-[57px]">
      <div className="mx-auto max-w-3xl px-6 pb-24 pt-12">

        {/* Header */}
        <div className="mb-10">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-orange)" }}>
            Legal
          </p>
          <h1 className="font-serif text-4xl font-bold" style={{ color: "var(--foreground)" }}>
            Terms of Service
          </h1>
          <p className="mt-3 text-sm" style={{ color: "var(--muted-foreground)" }}>
            Last updated: {LAST_UPDATED}
          </p>
          <div className="mt-4 h-1 w-16 rounded-full" style={{ background: "linear-gradient(90deg, var(--icon-yellow), var(--icon-orange))" }} />
        </div>

        {/* Medical disclaimer — most prominent */}
        <div className="mb-8 overflow-hidden rounded-2xl" style={{
          border: "1.5px solid var(--icon-orange)",
          background: "color-mix(in srgb, var(--icon-orange) 8%, var(--background))",
        }}>
          <div className="p-5">
            <p className="mb-1 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-orange)" }}>
              Important — Not Medical Advice
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
              EatoBiotics is a food-tracking and educational tool. The scores, reports, and AI
              recommendations we provide are based on general nutritional research and your
              self-reported food data. They are <strong>not</strong> a substitute for professional
              medical advice, diagnosis, or treatment. Always consult a qualified healthcare
              professional before making significant changes to your diet, especially if you have a
              medical condition.
            </p>
          </div>
        </div>

        <div className="space-y-8 text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>

          {/* Intro */}
          <Section>
            <p>
              These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of the
              {COMPANY_NAME} website and application (&ldquo;the Service&rdquo;). By creating an
              account or using the Service, you agree to these Terms. If you do not agree, do not
              use the Service.
            </p>
          </Section>

          {/* 1 */}
          <Section title="1. The Service">
            <p className="mb-2">EatoBiotics provides:</p>
            <ul className="list-disc space-y-1.5 pl-5">
              {[
                "A gut health assessment that calculates Biotics scores based on your food habits",
                "Meal analysis powered by AI that scores meals across Prebiotic, Probiotic, and Postbiotic dimensions",
                "Weekly food system reports summarising your progress",
                "AI consultation allowing you to ask questions about your food data and reports",
                "Educational content about gut health and nutrition",
              ].map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </Section>

          {/* 2 */}
          <Section title="2. Eligibility">
            <p>
              You must be at least 16 years old to use the Service. By using the Service, you
              confirm that you meet this requirement. If you are under 18, you should use the
              Service with the awareness of a parent or guardian.
            </p>
          </Section>

          {/* 3 */}
          <Section title="3. Your account">
            <p className="mb-2">When you create an account:</p>
            <ul className="list-disc space-y-1.5 pl-5">
              {[
                "You are responsible for keeping your login credentials secure.",
                "You must provide accurate information and keep it up to date.",
                "You may not share your account with others or create accounts on behalf of third parties without authorisation.",
                "You are responsible for all activity that occurs under your account.",
              ].map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </Section>

          {/* 4 */}
          <Section title="4. Subscriptions and payments">
            <SubList items={[
              { label: "Billing", text: "Paid plans are billed monthly or annually in advance via Stripe. Your subscription renews automatically unless cancelled." },
              { label: "Cancellation", text: "You can cancel at any time from your account dashboard. Access continues until the end of the current billing period. No partial refunds are issued for unused time." },
              { label: "Price changes", text: "We will give you at least 30 days notice of any price changes before they affect your subscription." },
              { label: "Refunds", text: "We offer refunds at our discretion for genuine billing errors. If you believe you have been charged incorrectly, contact us within 14 days." },
              { label: "Free tier", text: "The free tier is provided at our discretion and we may change or discontinue it at any time with reasonable notice." },
            ]} />
          </Section>

          {/* 5 */}
          <Section title="5. Acceptable use">
            <p className="mb-2">You agree not to:</p>
            <ul className="list-disc space-y-1.5 pl-5">
              {[
                "Use the Service for any unlawful purpose",
                "Submit false or misleading data to manipulate scores",
                "Attempt to reverse engineer, scrape, or copy any part of the Service",
                "Interfere with or disrupt the Service or its servers",
                "Use automated tools to access the Service in a way that exceeds normal use",
                "Resell, sublicense, or exploit the Service for commercial purposes without our written consent",
              ].map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </Section>

          {/* 6 */}
          <Section title="6. Your content">
            <p className="mb-2">
              When you submit meal descriptions, images, or other content (&ldquo;Your Content&rdquo;):
            </p>
            <ul className="list-disc space-y-1.5 pl-5">
              {[
                "You retain ownership of Your Content.",
                "You grant us a limited licence to process and store Your Content for the purpose of providing the Service to you.",
                "We do not use Your Content to train AI models or share it with third parties beyond what is described in our Privacy Policy.",
                "You are responsible for ensuring Your Content does not violate any third-party rights.",
              ].map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </Section>

          {/* 7 */}
          <Section title="7. AI-generated content">
            <p>
              Meal scores, weekly reports, and consultation responses are generated by artificial
              intelligence and are inherently probabilistic. They may contain errors or
              inconsistencies. You should use this information as one input among many when making
              decisions about your diet — not as a definitive authority. We are not liable for
              decisions made based on AI-generated content.
            </p>
          </Section>

          {/* 8 */}
          <Section title="8. Intellectual property">
            <p>
              All content, design, branding, methodology, and software comprising the Service
              (excluding Your Content) is the intellectual property of {COMPANY_NAME} and is
              protected by copyright and other applicable laws. You may not reproduce, distribute,
              or create derivative works from any part of the Service without our express written
              permission.
            </p>
          </Section>

          {/* 9 */}
          <Section title="9. Disclaimer of warranties">
            <p>
              The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without
              warranties of any kind, either express or implied. We do not guarantee that the
              Service will be uninterrupted, error-free, or that the results obtained from use of
              the Service will be accurate or reliable. Biotics scores are estimates based on
              available nutritional data and your self-reported inputs — they are not clinical
              measurements.
            </p>
          </Section>

          {/* 10 */}
          <Section title="10. Limitation of liability">
            <p>
              To the maximum extent permitted by law, {COMPANY_NAME} shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages arising from your
              use of the Service, including but not limited to health outcomes resulting from
              following recommendations, loss of data, or loss of profits. Our total liability to
              you for any claim arising from use of the Service shall not exceed the amount you
              paid us in the 12 months preceding the claim.
            </p>
          </Section>

          {/* 11 */}
          <Section title="11. Account termination">
            <p className="mb-2">
              You can delete your account at any time from your account dashboard. We may suspend
              or terminate your account if:
            </p>
            <ul className="list-disc space-y-1.5 pl-5">
              {[
                "You breach these Terms",
                "We are required to do so by law",
                "We discontinue the Service (with reasonable notice)",
              ].map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </Section>

          {/* 12 */}
          <Section title="12. Changes to these Terms">
            <p>
              We may update these Terms from time to time. For material changes, we will notify
              you by email at least 14 days before the changes take effect. Continued use of the
              Service after the effective date constitutes acceptance of the updated Terms.
            </p>
          </Section>

          {/* 13 */}
          <Section title="13. Governing law">
            <p>
              These Terms are governed by the laws of the {GOVERNING_LAW}. Any disputes arising
              from these Terms or the Service shall be subject to the exclusive jurisdiction of the
              courts of the {GOVERNING_LAW}.
            </p>
          </Section>

          {/* 14 */}
          <Section title="14. Contact">
            <p>
              If you have any questions about these Terms, contact us at:{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="underline" style={{ color: "var(--icon-orange)" }}>
                {CONTACT_EMAIL}
              </a>
            </p>
          </Section>

        </div>

        {/* Footer nav */}
        <div className="mt-12 flex flex-wrap gap-4 border-t pt-8" style={{ borderColor: "var(--border)" }}>
          <Link href="/privacy" className="text-sm underline" style={{ color: "var(--muted-foreground)" }}>Privacy Policy</Link>
          <Link href="/" className="text-sm underline" style={{ color: "var(--muted-foreground)" }}>Back to home</Link>
        </div>

      </div>
    </div>
  )
}

/* ── Internal layout helpers ── */

function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div>
      {title && (
        <h2 className="mb-3 font-serif text-lg font-bold" style={{ color: "var(--foreground)" }}>{title}</h2>
      )}
      {children}
    </div>
  )
}

function SubList({ items }: { items: { label: string; text: string }[] }) {
  return (
    <div className="space-y-2.5">
      {items.map(({ label, text }) => (
        <div key={label} className="flex gap-2.5">
          <span className="mt-0.5 shrink-0 w-32 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--icon-orange)" }}>{label}</span>
          <span style={{ color: "var(--muted-foreground)" }}>{text}</span>
        </div>
      ))}
    </div>
  )
}
