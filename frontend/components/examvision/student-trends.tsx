"use client"

import { Fragment, useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { STUDENTS } from "@/lib/examvision-data"
import { Avatar, Sparkline, TrendBadge } from "@/components/ui/examvision-primitives"

import { Users } from "lucide-react"

type Student = {
  name: string
  initials: string
  score: number
  trend: number
  history: number[]
  sessions: string[]
}

export function StudentTrends({ isDemo = true }: { isDemo?: boolean }) {
  const [declining, setDeclining] = useState(true)
  const [open, setOpen] = useState<string | null>(null)
  
  const rawStudents: Student[] = isDemo ? (STUDENTS as Student[]) : []
  const data = [...rawStudents].sort((a, b) =>
    declining ? a.trend - b.trend : b.score - a.score
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Student risk trends</h1>
          <p className="mt-1 text-sm text-muted-foreground">Spot meaningful changes across recent assessment sessions.</p>
        </div>
        <button
          onClick={() => setDeclining(!declining)}
          disabled={data.length === 0}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted disabled:opacity-40 disabled:pointer-events-none"
        >
          Sort: {declining ? "declining trend" : "integrity score"}
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-6 py-3">Student</th>
              <th>Recent integrity</th>
              <th>Trend</th>
              <th className="px-6 py-3 text-right">Score</th>
            </tr>
          </thead>
          <tbody>
            {data.map(s => (
              <Fragment key={s.name}>
                <tr
                  onClick={() => setOpen(open === s.name ? null : s.name)}
                  className="cursor-pointer border-b border-border transition hover:bg-muted/50"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar initials={s.initials} />
                      <span className="font-medium text-foreground">{s.name}</span>
                    </div>
                  </td>
                  <td className="text-primary">
                    <Sparkline points={s.history} />
                  </td>
                  <td>
                    <TrendBadge down={s.trend < 0}>
                      {s.trend > 0 ? "+" : ""}{s.trend}%
                    </TrendBadge>
                  </td>
                  <td className="px-6 text-right font-semibold text-foreground">
                    {s.score}% {open === s.name ? <ChevronUp className="ml-2 inline size-4" /> : <ChevronDown className="ml-2 inline size-4 text-muted-foreground" />}
                  </td>
                </tr>
                {open === s.name && (
                  <tr>
                    <td colSpan={4} className="bg-secondary/40 px-6 py-4">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Session history</p>
                      <div className="flex gap-3">
                        {s.sessions.map((x: string) => (
                          <span key={x} className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground">
                            {x}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-16 text-center text-sm text-muted-foreground">
                  <div className="flex flex-col items-center justify-center">
                    <Users className="size-8 text-muted-foreground/40 mb-2" />
                    <p className="font-medium text-foreground">No candidate integrity profiles found</p>
                    <p className="text-xs text-muted-foreground mt-1">Student risk metrics and longitudinal history will appear as exams are evaluated.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
