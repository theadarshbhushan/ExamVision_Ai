"use client"

import { useState } from "react"
import { TrendingUp, TrendingDown, Upload, ChevronRight } from "lucide-react"
import {
  KPIS,
  FLAG_TREND,
  type ProctoringEvent,
} from "@/lib/examvision-data"
import { StatusPill, SeverityPill } from "./primitives"
import { cn } from "@/lib/utils"

function KpiCard({ kpi }: { kpi: (typeof KPIS)[number] }) {
  const isUp = kpi.trend === "up"
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{kpi.label}</p>
      <div className="mt-2 flex items-end justify-between">
        <p className="text-3xl font-semibold tracking-tight text-foreground">
          {kpi.value}
        </p>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
            isUp
              ? "bg-success/12 text-success"
              : "bg-secondary text-muted-foreground",
          )}
        >
          {isUp ? (
            <TrendingUp className="size-3" />
          ) : (
            <TrendingDown className="size-3" />
          )}
          {kpi.delta}
        </span>
      </div>
    </div>
  )
}

function FlagChart() {
  const max = Math.max(...FLAG_TREND.map((d) => d.flags))
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Flag volume
          </h3>
          <p className="text-sm text-muted-foreground">Last 7 days</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
          <span className="size-1.5 rounded-full bg-primary" />
          Flags
        </span>
      </div>
      <div className="mt-8 flex h-48 items-end justify-between gap-3">
        {FLAG_TREND.map((d) => (
          <div
            key={d.day}
            className="flex h-full flex-1 flex-col items-center justify-end gap-2"
          >
            <span className="text-xs font-medium tabular-nums text-muted-foreground">
              {d.flags}
            </span>
            <div
              className="w-full rounded-t-md bg-primary/85 transition-all hover:bg-primary"
              style={{ height: `${Math.max(6, (d.flags / max) * 100)}%` }}
              title={`${d.flags} flags`}
            />
            <span className="text-xs text-muted-foreground">{d.day}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Dashboard({
  events,
  onOpenEvent,
  onUpload,
}: {
  events: ProctoringEvent[]
  onOpenEvent: (id: string) => void
  onUpload: () => void
}) {
  const [query, setQuery] = useState("")
  const filtered = events.filter((e) => {
    const q = query.toLowerCase()
    return (
      e.student.toLowerCase().includes(q) ||
      e.exam.toLowerCase().includes(q) ||
      e.detection.toLowerCase().includes(q) ||
      e.id.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Overview of session analysis and open investigations.
          </p>
        </div>
        <button
          onClick={onUpload}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Upload className="size-4" />
          Upload video
        </button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((kpi) => (
          <KpiCard key={kpi.label} kpi={kpi} />
        ))}
      </div>

      {/* Chart */}
      <FlagChart />

      {/* Recent events */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Recent events
            </h3>
            <p className="text-sm text-muted-foreground">
              Click a row to review the evidence.
            </p>
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter events…"
            className="h-9 w-full max-w-56 rounded-lg border border-border bg-card px-3 text-sm text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/20"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <th className="px-6 py-3">Event</th>
                <th className="px-6 py-3">Student</th>
                <th className="px-6 py-3">Detection</th>
                <th className="px-6 py-3">Confidence</th>
                <th className="px-6 py-3">Severity</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr
                  key={e.id}
                  onClick={() => onOpenEvent(e.id)}
                  className="group cursor-pointer border-b border-border last:border-0 transition-colors hover:bg-muted/60"
                >
                  <td className="px-6 py-3.5 font-mono text-xs text-muted-foreground">
                    {e.id}
                  </td>
                  <td className="px-6 py-3.5">
                    <p className="font-medium text-foreground">{e.student}</p>
                    <p className="text-xs text-muted-foreground">{e.exam}</p>
                  </td>
                  <td className="px-6 py-3.5 text-foreground">{e.detection}</td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${e.confidence}%` }}
                        />
                      </div>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {e.confidence}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    <SeverityPill severity={e.severity} />
                  </td>
                  <td className="px-6 py-3.5">
                    <StatusPill status={e.status} />
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <ChevronRight className="ml-auto size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-10 text-center text-sm text-muted-foreground"
                  >
                    No events match “{query}”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
