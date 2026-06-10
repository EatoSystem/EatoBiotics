import { ShieldCheck } from "lucide-react"

/** Standard educational disclaimer shown on every Stability page. */
export function MedicalDisclaimer({ className = "" }: { className?: string }) {
  return (
    <section className={`px-6 py-10 ${className}`} style={{ background: "#f7f7f5" }}>
      <div className="mx-auto flex max-w-3xl items-start gap-3">
        <ShieldCheck size={18} className="mt-0.5 shrink-0" style={{ color: "var(--muted-foreground)" }} />
        <p className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
          EatoBiotics Stability is an educational and self-tracking tool. It does not diagnose, treat,
          or cure any medical condition. Bowel urgency, leakage, diarrhoea, constipation, or changes in
          bowel habits can have medical causes. Please speak to your GP, doctor, pharmacist, continence
          nurse, or a qualified healthcare professional — especially if symptoms are new, worsening,
          severe, or include red-flag symptoms.
        </p>
      </div>
    </section>
  )
}
