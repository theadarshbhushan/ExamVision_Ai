"use client"

import { useState } from "react"
import { Download, ArrowUpDown, FileText, Flag, Users, X } from "lucide-react"
import { REPORTS, type Report } from "@/lib/examvision-data"
import { cn } from "@/lib/utils"

type SortKey = "name" | "candidates" | "flags" | "generated"

const statusStyles: Record<Report["status"], string> = {
  Ready: "bg-success/12 text-success ring-success/25",
  Processing: "bg-warning/15 text-warning-foreground ring-warning/25",
  Archived: "bg-secondary text-muted-foreground ring-border",
}

const SUMMARY = [
  { label: "Reports generated", value: "148", icon: FileText },
  { label: "Candidates covered", value: "12,904", icon: Users },
  { label: "Total flags", value: "486", icon: Flag },
]

export function Reports() {
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "generated",
    dir: "desc",
  })
  const [builder, setBuilder] = useState(false)
  const [sections, setSections] = useState({ executive: true, events: true, confidence: true, notes: false })
  const [toast, setToast] = useState(false)

  const filtered = REPORTS.filter((r) => {
    const q = query.toLowerCase()
    return (
      r.name.toLowerCase().includes(q) ||
      r.exam.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q)
    )
  }).sort((a, b) => {
    const dir = sort.dir === "asc" ? 1 : -1
    const av = a[sort.key]
    const bv = b[sort.key]
    if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir
    return String(av).localeCompare(String(bv)) * dir
  })

  function toggleSort(key: SortKey) {
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    )
  }

  const SortHead = ({ label, k }: { label: string; k: SortKey }) => (
    <th className="px-6 py-3">
      <button
        onClick={() => toggleSort(k)}
        className={cn(
          "inline-flex items-center gap-1.5 transition-colors hover:text-foreground",
          sort.key === k && "text-foreground",
        )}
      >
        {label}
        <ArrowUpDown className="size-3" />
      </button>
    </th>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Reports
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Audit-ready integrity summaries for every exam.
        </p>
      </div><button onClick={() => setBuilder(true)} className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700">Generate report</button></div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {SUMMARY.map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-sm"
          >
            <span className="flex size-11 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <s.icon className="size-5" />
            </span>
            <div>
              <p className="text-2xl font-semibold tracking-tight text-foreground">
                {s.value}
              </p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
          <h3 className="text-base font-semibold text-foreground">
            All reports
          </h3>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search reports…"
            className="h-9 w-full max-w-64 rounded-lg border border-border bg-card px-3 text-sm text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/20"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <SortHead label="Report" k="name" />
                <th className="px-6 py-3">Exam</th>
                <SortHead label="Candidates" k="candidates" />
                <SortHead label="Flags" k="flags" />
                <SortHead label="Generated" k="generated" />
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Export</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-border last:border-0 transition-colors hover:bg-muted/60"
                >
                  <td className="px-6 py-3.5">
                    <p className="font-medium text-foreground">{r.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {r.id}
                    </p>
                  </td>
                  <td className="px-6 py-3.5 font-mono text-xs text-muted-foreground">
                    {r.exam}
                  </td>
                  <td className="px-6 py-3.5 tabular-nums text-foreground">
                    {r.candidates.toLocaleString()}
                  </td>
                  <td className="px-6 py-3.5 tabular-nums text-foreground">
                    {r.flags}
                  </td>
                  <td className="px-6 py-3.5 font-mono text-xs text-muted-foreground">
                    {r.generated}
                  </td>
                  <td className="px-6 py-3.5">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
                        statusStyles[r.status],
                      )}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <button
                      disabled={r.status === "Processing"}
                      className="inline-flex size-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                      aria-label={`Download ${r.name}`}
                    >
                      <Download className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-10 text-center text-sm text-muted-foreground"
                  >
                    No reports match “{query}”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {builder && <div className="fixed inset-0 z-50 bg-slate-900/20 backdrop-blur-sm"><div className="absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto border-l border-border bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><div><h2 className="text-xl font-semibold">Smart Report Builder</h2><p className="mt-1 text-sm text-muted-foreground">Prepare a clear review narrative for stakeholders.</p></div><button onClick={() => setBuilder(false)} aria-label="Close report builder" className="rounded-lg p-2 hover:bg-muted"><X className="size-5"/></button></div><div className="mt-7 grid gap-6 md:grid-cols-[200px_1fr]"><div><p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Include</p>{([['executive','Executive summary'],['events','Flagged events'],['confidence','Confidence breakdown'],['notes','Reviewer notes']] as const).map(([key,label]) => <label key={key} className="mb-3 flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" checked={sections[key]} onChange={e => setSections({...sections,[key]:e.target.checked})} className="size-4 accent-blue-600"/>{label}</label>)}</div><div className="rounded-xl border border-border bg-slate-50 p-5"><p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Live preview</p><h3 className="text-lg font-semibold">Advanced Microeconomics — Final</h3>{sections.executive && <p className="mt-3 text-sm leading-6 text-slate-600">ExamVision AI reviewed 218 assessment sessions and identified 12 moments requiring human attention. Most candidates demonstrated consistent, high-integrity behavior throughout the assessment.</p>}{sections.events && <div className="mt-4 border-t border-border pt-4"><h4 className="text-sm font-semibold">Flagged events</h4><p className="mt-1 text-sm text-slate-600">Three high-confidence gaze and object-detection patterns were escalated for reviewer confirmation.</p></div>}{sections.confidence && <div className="mt-4 border-t border-border pt-4"><h4 className="text-sm font-semibold">Confidence breakdown</h4><p className="mt-1 text-sm text-slate-600">Gaze tracking 91% · Object detection 78% · Face match 98%</p></div>}{sections.notes && <div className="mt-4 border-t border-border pt-4"><h4 className="text-sm font-semibold">Reviewer notes</h4><p className="mt-1 text-sm text-slate-600">Manual review is recommended for the two critical sessions.</p></div>}</div></div><button onClick={() => { setToast(true); setTimeout(() => setToast(false), 2500) }} className="mt-7 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white"><Download className="size-4"/>Export PDF</button>{toast && <span className="ml-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Report queued for export ✓</span>}</div></div>}
    </div>
  )
}
