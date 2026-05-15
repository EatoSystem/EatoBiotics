import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Privacy Policy — EatoBiotics",
  description: "How EatoBiotics collects, uses, and protects your personal data.",
}

const LAST_UPDATED = "15 May 2025"
const CONTACT_EMAIL = "hello@eatobiotics.com"
const COMPANY_NAME = "EatoBiotics"
const COMPANY_JURISDICTION = "Republic of Ireland"

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background pt-[57px]">
      <div className="mx-auto max-w-3xl px-6 pb-24 pt-12">

        {/* Header */}
        <div className="mb-10">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>
            Legal
          </p>
          <h1 className="font-serif text-4xl font-bold" style={{ color: "var(--foreground)" }}>
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm" style={{ color: "var(--muted-foreground)" }}>
            Last updated: {LAST_UPDATED}
          </p>
          <div className="mt-4 h-1 w-16 rounded-full" style={{ background: "linear-gradient(90deg, var(--icon-green), var(--icon-teal))" }} />
        </div>

        <div className="space-y-8 text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>

          {/* Intro */}
          <Section>
            <p>
              {COMPANY_NAME} (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is committed to protecting your personal data. This Privacy
              Policy explains what information we collect, how we use it, who we share it with, and
              what rights you have over it. It applies to all users of the EatoBiotics website and
              application (&ldquo;the Service&rdquo;).
            </p>
            <p className="mt-3">
              We are based in the {COMPANY_JURISDICTION} and this policy is written in compliance
              with the EU General Data Protection Regulation (GDPR) and the Irish Data Protection
              Acts 1988–2018.
            </p>
          </Section>

          {/* 1 */}
          <Section title="1. Who we are">
            <p>
              The data controller for your personal data is {COMPANY_NAME}, operating the website
              and application at eatobiotics.com. If you have any questions about how we handle
              your data, you can contact us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="underline" style={{ color: "var(--icon-green)" }}>
                {CONTACT_EMAIL}
              </a>.
            </p>
          </Section>

          {/* 2 */}
          <Section title="2. What data we collect">
            <p className="mb-3">We collect the following categories of personal data:</p>
            <SubList items={[
              { label: "Account data", text: "Your name, email address, and age bracket, provided when you create an account or complete the gut health assessment." },
              { label: "Dietary data", text: "Meal descriptions and food photographs you submit for analysis. This is used to generate your Biotics scores and weekly reports." },
              { label: "Health & lifestyle data", text: "Your gut health assessment responses including scores for diversity, feeding, consistency, and general wellbeing. We treat this as sensitive personal data and handle it with additional care." },
              { label: "Payment data", text: "Subscription and payment information processed by Stripe. We do not store your card details — Stripe handles payment processing and is PCI-DSS compliant." },
              { label: "Usage data", text: "How you interact with the Service — pages visited, features used, and session information — collected through analytics tools." },
              { label: "Communications", text: "Any messages you send us directly, including support requests or feedback." },
            ]} />
          </Section>

          {/* 3 */}
          <Section title="3. Why we collect it (legal basis)">
            <p className="mb-3">We process your data on the following legal bases:</p>
            <SubList items={[
              { label: "Contract performance", text: "To provide the Service you sign up for — including meal analysis, Biotics scoring, weekly reports, and AI consultation." },
              { label: "Legitimate interests", text: "To improve the Service, prevent fraud, maintain security, and send you service-related communications." },
              { label: "Consent", text: "For marketing emails and non-essential cookies. You can withdraw consent at any time." },
              { label: "Legal obligation", text: "To comply with financial regulations and respond to lawful requests from authorities." },
            ]} />
          </Section>

          {/* 4 */}
          <Section title="4. How we use your data">
            <p className="mb-2">Specifically, we use your data to:</p>
            <ul className="list-disc space-y-1.5 pl-5">
              {[
                "Create and manage your account",
                "Analyse your meals and calculate your Biotics scores (Prebiotic, Probiotic, Postbiotic)",
                "Generate personalised weekly food system reports",
                "Power AI consultation features that answer questions about your food data",
                "Send you weekly report notifications and account-related emails",
                "Process your subscription payments",
                "Improve and develop the Service based on usage patterns",
                "Comply with legal and regulatory requirements",
              ].map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </Section>

          {/* 5 */}
          <Section title="5. Third parties we share data with">
            <p className="mb-3">
              We do not sell your personal data. We share it only with the following trusted service
              providers, under strict data processing agreements:
            </p>
            <SubList items={[
              { label: "Supabase", text: "Our database and authentication provider. Your account data, scores, and meal records are stored on Supabase servers hosted in the EU." },
              { label: "Anthropic (Claude AI)", text: "We send meal descriptions and report context to Anthropic's Claude API to generate analysis and personalised recommendations. Data sent is limited to what is necessary for the analysis. Anthropic's data usage policy applies." },
              { label: "Stripe", text: "Our payment processor. Handles all subscription billing. Subject to Stripe's own Privacy Policy." },
              { label: "Resend", text: "Our email delivery provider. Used to send account, report, and notification emails." },
              { label: "Vercel", text: "Our hosting provider. The application runs on Vercel's infrastructure." },
            ]} />
          </Section>

          {/* 6 */}
          <Section title="6. How long we keep your data">
            <p className="mb-2">We retain your data for as long as your account is active or as needed to provide the Service. Specifically:</p>
            <SubList items={[
              { label: "Account & health data", text: "Retained while your account is active. Deleted within 30 days of a verified account deletion request." },
              { label: "Payment records", text: "Retained for 7 years to comply with financial and tax regulations, even after account deletion." },
              { label: "Usage/analytics data", text: "Retained in anonymised or aggregated form for up to 2 years." },
              { label: "Backups", text: "Database backups are retained for up to 30 days, after which deleted records are fully purged." },
            ]} />
          </Section>

          {/* 7 */}
          <Section title="7. Your rights under GDPR">
            <p className="mb-3">As a user in the EU/EEA, you have the following rights:</p>
            <SubList items={[
              { label: "Access", text: "Request a copy of all personal data we hold about you. You can also download this directly from your account dashboard." },
              { label: "Rectification", text: "Ask us to correct inaccurate or incomplete data." },
              { label: "Erasure", text: "Ask us to delete your data. You can do this directly in your account under My Account → Delete Account." },
              { label: "Portability", text: "Receive your data in a machine-readable format (JSON). Available directly from your account dashboard." },
              { label: "Restriction", text: "Ask us to stop processing your data in certain circumstances." },
              { label: "Object", text: "Object to processing based on legitimate interests." },
              { label: "Withdraw consent", text: "Where we rely on consent, you can withdraw it at any time without affecting prior processing." },
            ]} />
            <p className="mt-4">
              To exercise any of these rights, email us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="underline" style={{ color: "var(--icon-green)" }}>
                {CONTACT_EMAIL}
              </a>. We will respond within 30 days. You also have the right to lodge a complaint
              with the Data Protection Commission (Ireland) at{" "}
              <a href="https://www.dataprotection.ie" target="_blank" rel="noopener noreferrer"
                className="underline" style={{ color: "var(--icon-green)" }}>
                dataprotection.ie
              </a>.
            </p>
          </Section>

          {/* 8 */}
          <Section title="8. Cookies">
            <p className="mb-2">We use the following types of cookies:</p>
            <SubList items={[
              { label: "Essential cookies", text: "Required for authentication and to keep you logged in. Cannot be disabled." },
              { label: "Analytics cookies", text: "Used to understand how the Service is used. Only placed with your consent." },
            ]} />
            <p className="mt-3">
              You can manage cookie preferences in your browser settings at any time.
            </p>
          </Section>

          {/* 9 */}
          <Section title="9. Data security">
            <p>
              We take security seriously. Your data is stored in encrypted databases, transmitted
              over HTTPS, and access is restricted to authorised systems only. We use row-level
              security in our database so that your data is only accessible to you and to the
              service processes acting on your behalf. In the event of a data breach, we will notify
              affected users and the relevant supervisory authority as required by GDPR.
            </p>
          </Section>

          {/* 10 */}
          <Section title="10. Children">
            <p>
              The Service is not directed at children under 16. We do not knowingly collect
              personal data from anyone under 16. If you believe we have inadvertently collected
              data from a child, please contact us immediately and we will delete it.
            </p>
          </Section>

          {/* 11 */}
          <Section title="11. Changes to this policy">
            <p>
              We may update this Privacy Policy from time to time. When we do, we will update the
              &ldquo;last updated&rdquo; date at the top of this page and, where the changes are
              material, notify you by email. Continued use of the Service after changes are posted
              constitutes acceptance of the updated policy.
            </p>
          </Section>

          {/* 12 */}
          <Section title="12. Contact us">
            <p>
              For any privacy-related questions or requests, contact us at:{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="underline" style={{ color: "var(--icon-green)" }}>
                {CONTACT_EMAIL}
              </a>
            </p>
          </Section>

        </div>

        {/* Footer nav */}
        <div className="mt-12 flex flex-wrap gap-4 border-t pt-8" style={{ borderColor: "var(--border)" }}>
          <Link href="/terms" className="text-sm underline" style={{ color: "var(--muted-foreground)" }}>Terms of Service</Link>
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
          <span className="mt-0.5 shrink-0 w-32 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--icon-green)" }}>{label}</span>
          <span style={{ color: "var(--muted-foreground)" }}>{text}</span>
        </div>
      ))}
    </div>
  )
}
