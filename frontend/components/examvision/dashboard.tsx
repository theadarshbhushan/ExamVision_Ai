"use client"

import { useState } from "react"
import { TrendingUp, TrendingDown, Upload, ChevronRight, Download, Activity } from "lucide-react"
import {
  FLAG_TREND,
  type ProctoringEvent,
} from "@/lib/examvision-data"
import { StatusPill, SeverityPill } from "./primitives"
import { cn } from "@/lib/utils"
import { FlaggedGallery } from "./flagged-gallery"

function KpiCard({ kpi }: { kpi: { label: string; value: string; delta: string; trend: "up" | "down" } }) {
  const isUp = kpi.trend === "up"
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm animate-fade-in">
      <p className="text-sm text-muted-foreground">{kpi.label}</p>
      <div className="mt-2 flex items-end justify-between">
        <p className="text-3xl font-semibold tracking-tight text-foreground">
          {kpi.value}
        </p>
        {kpi.delta && (
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
        )}
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

function HeatmapCard({ heatmapZones }: { heatmapZones: { zone_id: number; total_intensity: number; event_count: number }[] | null }) {
  const zoneIds = [1, 2, 3, 4, 5, 6, 7, 8]
  const maxCount = heatmapZones && heatmapZones.length > 0 
    ? Math.max(...heatmapZones.map(z => z.event_count), 1) 
    : 1

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
      <div>
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Activity className="size-5 text-primary" />
          Spatial Activity Heatmap
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Aggregated events and motion intensity per proctoring zone.
        </p>
      </div>

      <div className="mt-6">
        {!heatmapZones || heatmapZones.length === 0 ? (
          <div className="flex h-44 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-secondary/10 text-center p-4">
            <p className="text-sm font-medium text-muted-foreground">No heatmap telemetry available</p>
            <p className="text-xs text-muted-foreground mt-1">Upload a session video to generate spatial activity tracking.</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2.5">
            {zoneIds.map((id) => {
              const zData = heatmapZones.find(z => z.zone_id === id)
              const count = zData ? zData.event_count : 0
              const intensity = zData ? zData.total_intensity : 0
              const isHigh = count > 0 && (count / maxCount) > 0.5

              return (
                <div
                  key={id}
                  className="flex flex-col justify-between rounded-lg border border-border/80 p-3 transition duration-150 hover:scale-[1.02] hover:shadow-sm"
                  style={{
                    backgroundColor: count > 0 
                      ? `rgba(59, 130, 246, ${0.12 + 0.60 * (count / maxCount)})` 
                      : 'rgba(248, 250, 252, 0.7)',
                    color: isHigh ? '#ffffff' : 'inherit'
                  }}
                >
                  <div>
                    <p className={cn(
                      "text-[10px] font-bold uppercase tracking-wider",
                      isHigh ? "text-blue-100" : "text-muted-foreground"
                    )}>
                      Zone {id}
                    </p>
                    <p className="text-xl font-extrabold tracking-tight mt-0.5 tabular-nums">
                      {count} <span className="text-[10px] font-medium opacity-80">evt</span>
                    </p>
                  </div>
                  {count > 0 && (
                    <p className={cn(
                      "text-[9px] mt-1.5 leading-none font-medium opacity-90",
                      isHigh ? "text-blue-200" : "text-muted-foreground"
                    )}>
                      Mot: {intensity.toFixed(1)}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export function Dashboard({
  events,
  pipelineStats,
  heatmapZones,
  onOpenEvent,
  onUpload,
}: {
  events: ProctoringEvent[]
  pipelineStats: { totalFrames: number; framesSentToYolo: number; bypassRatio: number } | null
  heatmapZones: { zone_id: number; total_intensity: number; event_count: number }[] | null
  onOpenEvent: (id: string) => void
  onUpload: () => void
}) {
  const [query, setQuery] = useState("")

  const uniqueSessions = new Set(events.map((e) => e.session)).size
  const activeCount = events.filter((e) => e.status === "Pending").length
  const flagsCount = events.filter((e) => e.detection !== "Motion Triggered").length

  // Calculate dynamic Integrity Indicator
  const sessionsList = Array.from(new Set(events.map((e) => e.session)))
  let totalScore = 0
  sessionsList.forEach((session) => {
    const sessionEvents = events.filter((e) => e.session === session)
    const penalty = sessionEvents.reduce((sum, e) => {
      if (e.status === "Cleared") return sum
      const base = e.severity === "Critical" ? 20 : e.severity === "Medium" ? 10 : 5
      const mult = e.status === "Flagged" ? 1.0 : e.confidence / 100
      return sum + base * mult
    }, 0)
    totalScore += Math.max(0, 100 - penalty)
  })
  const avgIntegrity = sessionsList.length > 0 ? Math.round(totalScore / sessionsList.length) : 100

  const dynamicKpis = [
    { label: "Sessions analyzed", value: uniqueSessions.toString(), delta: "", trend: "up" as const },
    { label: "Active investigations", value: activeCount.toString(), delta: "", trend: "up" as const },
    { label: "Flags detected", value: flagsCount.toString(), delta: "", trend: "up" as const },
    { label: "Integrity indicator", value: `${avgIntegrity}%`, delta: "weighted index", trend: "up" as const },
  ]

  const filtered = events.filter((e) => {
    const q = query.toLowerCase()
    return (
      String(e.zone).toLowerCase().includes(q) ||
      e.exam.toLowerCase().includes(q) ||
      e.detection.toLowerCase().includes(q) ||
      e.id.toLowerCase().includes(q)
    )
  })

  function handleExportCSV() {
    if (events.length === 0) return
    const headers = ["Event ID", "Zone", "Detection", "Confidence", "Severity", "Status", "Timestamp"]
    const rows = events.map((e) => [
      e.id,
      `Zone ${e.zone}`,
      e.detection,
      `${e.confidence}%`,
      e.severity,
      e.status,
      e.timestamp,
    ])

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.map((val) => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `examvision_events_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

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
        {dynamicKpis.map((kpi) => (
          <KpiCard key={kpi.label} kpi={kpi} />
        ))}
      </div>

      {/* Chart */}
      <FlagChart />

      {/* Telemetry and Spatial Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pipeline Efficiency card */}
        {pipelineStats ? (
          <div className="rounded-xl border border-border bg-blue-50/40 dark:bg-blue-950/20 p-6 shadow-sm flex flex-col justify-between gap-6 transition duration-200">
            <div className="flex items-start gap-4">
              <span className="flex size-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 shrink-0">
                <TrendingDown className="size-6" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-foreground">Pipeline Efficiency (Bypass Rate)</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Our background subtraction model maps motion regions, bypassing idle camera frames from deep YOLO classification to maximize performance.
                </p>
              </div>
            </div>
            <div className="border-t border-border/80 pt-4 mt-auto">
              <p className="text-sm text-muted-foreground">
                Analyzed <span className="font-semibold text-foreground">{pipelineStats.totalFrames.toLocaleString()}</span> frames &mdash; only <span className="font-semibold text-foreground">{pipelineStats.framesSentToYolo.toLocaleString()}</span> sent to AI model.
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Total compute saved</span>
                <span className="inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-950/30 px-3 py-1 text-sm font-semibold text-emerald-700 dark:text-emerald-400 ring-1 ring-inset ring-emerald-600/20">
                  {pipelineStats.bypassRatio}% Saved
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-card p-6 shadow-sm flex flex-col items-center justify-center text-center p-8 min-h-64">
            <TrendingDown className="size-8 text-muted-foreground/60 mb-2" />
            <p className="text-sm font-medium text-muted-foreground">No efficiency metrics loaded</p>
            <p className="text-xs text-muted-foreground mt-1">Run video upload to measure AI computation savings.</p>
          </div>
        )}

        {/* Spatial Activity Heatmap Card */}
        <HeatmapCard heatmapZones={heatmapZones} />
      </div>

      {/* Flagged Visual Detections Gallery */}
      <FlaggedGallery events={events} onOpenEvent={onOpenEvent} />

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
          <div className="flex items-center gap-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter events…"
              className="h-9 w-full max-w-56 rounded-lg border border-border bg-card px-3 text-sm text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/20"
            />
            <button
              onClick={handleExportCSV}
              disabled={events.length === 0}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 py-1 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted disabled:opacity-40 disabled:pointer-events-none"
            >
              <Download className="size-4 text-muted-foreground" />
              Export CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <th className="px-6 py-3">Event</th>
                <th className="px-6 py-3">Zone</th>
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
                    <p className="font-medium text-foreground">Zone {e.zone}</p>
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
