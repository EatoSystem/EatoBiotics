\"use client\"

import { useState } from \"react\"

type AppRow = {
  id: string
  name: string | null
  email: string
  why: string
  focus: string | null
  referral: string | null
  status: \"submitted\" | \"admitted\" | \"rejected\" | \"waitlist\"
  created_at: string
}

export function FoundingAdminClient({
  rows,
  stats,
}: {
  rows: AppRow[]
  stats: { total: number; admitted: number; rejected: number; waitlist: number }
}) {
  const [items, setItems] = useState(rows)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  async function updateStatus(id: string, status: \"admitted\" | \"rejected\" | \"waitlist\") {
    setBusyId(id)
    try {
      const res = await fetch(\"/api/founding/admin/status\", {
        method: \"POST\",
        headers: { \"content-type\": \"application/json\" },
        body: JSON.stringify({ id, status }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || \"Request failed\")
      setItems((list) => list.map((r) => (r.id === id ? { ...r, status } : r)))
      if (status === \"admitted\" && data.unlockUrl) {
        // Show copy affordance inline
        await navigator.clipboard.writeText(data.unlockUrl as string)
        setCopied(id)
        setTimeout(() => setCopied(null), 3000)
        alert(data.email?.ok ? \"Admit email sent.\" : \"Link copied — Resend not configured or email failed.\")
      }
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className=\"space-y-6\">
      <div className=\"grid grid-cols-2 gap-3 sm:grid-cols-4\">
        <Stat label=\"Total\" value={stats.total} />
        <Stat label=\"Admitted\" value={stats.admitted} />
        <Stat label=\"Rejected\" value={stats.rejected} />
        <Stat label=\"Waitlist\" value={stats.waitlist} />
      </div>
      <div className=\"rounded-2xl border border-border overflow-hidden\">
        <table className=\"w-full text-sm\">
          <thead>
            <tr className=\"border-b border-border bg-secondary/30\">
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Why</Th>
              <Th>Focus</Th>
              <Th>Referral</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={7} className=\"px-5 py-6 text-center text-muted-foreground\">No applications yet</td></tr>
            ) : items.map((r) => (
              <tr key={r.id} className=\"border-b border-border/50 last:border-0\">
                <Td>{r.name || \"—\"}</Td>
                <Td mono>{r.email}</Td>
                <Td>{r.why}</Td>
                <Td>{r.focus || \"—\"}</Td>
                <Td>{r.referral || \"—\"}</Td>
                <Td><span className=\"rounded-full border px-2 py-0.5 text-xs capitalize\">{r.status}</span></Td>
                <Td>
                  <div className=\"flex gap-2\">
                    <button
                      onClick={() => updateStatus(r.id, \"admitted\")}
                      disabled={busyId === r.id}
                      className=\"rounded-full border border-[var(--icon-green)]/40 px-3 py-1 text-xs font-semibold text-[var(--icon-green)] hover:border-[var(--icon-green)]\"
                    >
                      {copied === r.id ? \"Link copied\" : busyId === r.id ? \"Working…\" : \"Admit\"}
                    </button>
                    <button
                      onClick={() => updateStatus(r.id, \"rejected\")}
                      disabled={busyId === r.id}
                      className=\"rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground\"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => updateStatus(r.id, \"waitlist\")}
                      disabled={busyId === r.id}
                      className=\"rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground\"
                    >
                      Waitlist
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className=\"rounded-2xl border border-border bg-card p-4\">
      <div className=\"text-xs font-bold uppercase tracking-widest text-muted-foreground\">{label}</div>
      <div className=\"mt-1 text-2xl font-semibold tabular-nums\">{value}</div>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className=\"text-left px-5 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide\">{children}</th>
}
function Td({ children, mono = false }: { children: React.ReactNode; mono?: boolean }) {
  return <td className={`px-5 py-3.5 ${mono ? \"font-mono text-xs text-muted-foreground\" : \"\"}`}>{children}</td>
}

