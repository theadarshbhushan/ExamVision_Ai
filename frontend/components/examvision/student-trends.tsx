"use client"

import { Fragment, useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { STUDENTS } from "@/lib/examvision-data"
import { Avatar, Sparkline, TrendBadge } from "@/components/ui/examvision-primitives"

export function StudentTrends() {
    const [declining, setDeclining] = useState(true), [open, setOpen] = useState<string | null>(null); const data = [...STUDENTS].sort((a, b) => declining ? a.trend - b.trend : b.score - a.score);
    return (
    <div className="space-y-6"><div className="flex items-end justify-between"><div>
        <h1 className="text-2xl font-semibold tracking-tight">Student risk trends</h1>
        <p className="mt-1 text-sm text-muted-foreground">Spot meaningful changes across recent assessment sessions.</p>
        </div>
        <button onClick={() => setDeclining(!declining)} className="rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm">Sort: {declining ? "declining trend" : "integrity score"}</button>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm"><table className="w-full text-sm"><thead><tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground"><th className="px-6 py-3">Student</th><th>Recent integrity</th><th>Trend</th><th className="px-6 py-3 text-right">Score</th></tr></thead><tbody>{data.map(s => <Fragment key={s.name}><tr onClick={() => setOpen(open === s.name ? null : s.name)} className="cursor-pointer border-b border-border transition hover:bg-slate-50"><td className="px-6 py-4"><div className="flex items-center gap-3"><Avatar initials={s.initials} /><span className="font-medium">{s.name}</span></div></td><td className="text-blue-600"><Sparkline points={s.history} /></td><td><TrendBadge down={s.trend < 0}>{s.trend > 0 ? "+" : ""}{s.trend}%</TrendBadge></td><td className="px-6 text-right font-semibold">{s.score}% {open === s.name ? <ChevronUp className="ml-2 inline size-4" /> : <ChevronDown className="ml-2 inline size-4 text-muted-foreground" />}</td></tr>{open === s.name && <tr><td colSpan={4} className="bg-slate-50 px-6 py-4"><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Session history</p><div className="flex gap-3">{s.sessions.map(x => <span key={x} className="rounded-lg border border-border bg-white px-3 py-2 text-sm">{x}</span>)}</div></td></tr>}</Fragment>)}</tbody></table></div></div>
    )
}
