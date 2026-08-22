"use client"

import React, { useState } from "react"
import {
  TrendingUp,
  TrendingDown,
  Upload,
  ChevronDown,
  Users,
  Flag,
  Shield,
  Activity,
  Download,
  ChevronRight,
  Sparkles,
} from "lucide-react"
import {
  FLAG_TREND,
  EMPTY_FLAG_TREND,
  type ProctoringEvent,
} from "@/lib/examvision-data"
import { StatusPill, SeverityPill, ClayCard } from "./primitives"
import { cn } from "@/lib/utils"

export function Dashboard({
  events,
  pipelineStats,
  heatmapZones,
  totalDuration,
  isDemo = true,
  onOpenEvent,
  onUpload,
}: {
  events: ProctoringEvent[]
  pipelineStats: { totalFrames: number; framesSentToYolo: number; bypassRatio: number } | null
  heatmapZones: { zone_id: number; total_intensity: number; event_count: number }[] | null
  totalDuration?: number
  isDemo?: boolean
  onOpenEvent: (id: string) => void
  onUpload: () => void
}) {
  const [timeRange, setTimeRange] = useState("Last 7 days")
  const [selectedZone, setSelectedZone] = useState<number | null>(null)
  const [query, setQuery] = useState("")

  const uniqueSessions = new Set(events.map((e) => e.session)).size
  const activeCount = events.filter((e) => e.status === "Pending").length
  const flagsCount = events.filter(
    (e) => e.status === "Flagged" || (e.detection !== "Motion Triggered" && e.detection !== "Normal Activity")
  ).length

  // Calculate dynamic Integrity Indicator
  const sessionsList = Array.from(new Set(events.map((e) => e.session)))
  let totalScore = 0
  sessionsList.forEach((session) => {
    const sessionEvents = events.filter((e) => e.session === session)
    const penalty = sessionEvents.reduce((sum, e) => {
      if (e.status === "Cleared") return sum
      const base = e.severity === "Critical" ? 20 : e.severity === "Medium" ? 10 : 5
      const mult = e.status === "Flagged" ? 1.0 : (e.confidence || 75) / 100
      return sum + base * mult
    }, 0)
    totalScore += Math.max(0, 100 - penalty)
  })
  const avgIntegrity = sessionsList.length > 0 ? `${Math.round(totalScore / sessionsList.length)}%` : "—"

  // Display values (respecting demo vs real user account)
  const displaySessions = isDemo ? "1,284" : uniqueSessions.toString()
  const displayActive = isDemo ? "37" : activeCount.toString()
  const displayFlags = isDemo ? "92" : flagsCount.toString()
  const displayIntegrity = isDemo ? "94.2%" : avgIntegrity

  const trendData = isDemo
    ? FLAG_TREND
    : events.length > 0
    ? FLAG_TREND
    : EMPTY_FLAG_TREND

  const maxTrend = Math.max(...trendData.map((d) => d.flags), 1)

  const filteredEvents = events.filter((e) => {
    const q = query.toLowerCase()
    const matchesQuery =
      String(e.zone).toLowerCase().includes(q) ||
      e.exam.toLowerCase().includes(q) ||
      e.detection.toLowerCase().includes(q) ||
      e.id.toLowerCase().includes(q)

    const matchesZone =
      selectedZone === null ||
      String(e.zone) === `Zone ${selectedZone}` ||
      String(e.zone) === String(selectedZone)

    return matchesQuery && matchesZone
  })

  function getZoneData(id: number) {
    if (!heatmapZones || heatmapZones.length === 0) return null
    return heatmapZones.find((z) => z.zone_id === id) || null
  }

  function handleExportCSV() {
    if (events.length === 0) return
    const headers = ["Event ID", "Zone", "Detection", "Confidence", "Severity", "Status", "Timestamp"]
    const rows = events.map((e) => [
      e.id,
      String(e.zone),
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
    <div className="space-y-8 animate-fade-in">
      {/* 4 Stat Cards matching dashboard.png */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Sessions analyzed */}
        <div className="clay-card relative overflow-hidden p-6">
          <div className="flex items-start justify-between">
            <span className="text-[15px] font-medium text-[var(--text-secondary)]">
              Sessions analyzed
            </span>
            <span className="flex size-10 items-center justify-center rounded-full bg-[#ebf4ff] text-[#2563eb] shadow-[0_4px_10px_rgba(37,99,235,0.2),inset_0_1.5px_2px_rgba(255,255,255,0.9)]">
              <TrendingUp className="size-5" strokeWidth={2.5} />
            </span>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] flex items-center gap-1.5">
              {displaySessions} {displaySessions !== "0" && <span className="text-xl font-bold text-[#10b981]">↗</span>}
            </p>
            <p className="mt-1.5 text-xs font-semibold text-[#10b981]">
              {isDemo ? "+12% from last week" : events.length > 0 ? "Active workspace" : "Ready for video"}
            </p>
          </div>
        </div>

        {/* Card 2: Active investigations */}
        <div className="clay-card relative overflow-hidden p-6">
          <div className="flex items-start justify-between">
            <span className="text-[15px] font-medium text-[var(--text-secondary)]">
              Active investigations
            </span>
            <span className="flex size-10 items-center justify-center rounded-full bg-[#ebf4ff] text-[#2563eb] shadow-[0_4px_10px_rgba(37,99,235,0.2),inset_0_1.5px_2px_rgba(255,255,255,0.9)]">
              <Users className="size-5" strokeWidth={2.5} />
            </span>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] flex items-center gap-1.5">
              {displayActive} {displayActive !== "0" && <span className="text-xl font-bold text-[#10b981]">↗</span>}
            </p>
            <p className="mt-1.5 text-xs font-semibold text-[#10b981]">
              {isDemo ? "+8% from last week" : `${activeCount} pending review`}
            </p>
          </div>
        </div>

        {/* Card 3: Flags detected */}
        <div className="clay-card relative overflow-hidden p-6">
          <div className="flex items-start justify-between">
            <span className="text-[15px] font-medium text-[var(--text-secondary)]">
              Flags detected
            </span>
            <span className="flex size-10 items-center justify-center rounded-full bg-[#fff0f0] text-[#ef4444] shadow-[0_4px_10px_rgba(239,68,68,0.2),inset_0_1.5px_2px_rgba(255,255,255,0.9)]">
              <Flag className="size-5" strokeWidth={2.5} />
            </span>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] flex items-center gap-1.5">
              {displayFlags} <Flag className="size-5 fill-current text-[#ef4444] inline-block" />
            </p>
            <p className="mt-1.5 text-xs font-semibold text-[#10b981]">
              {isDemo ? "+15% from last week" : `${flagsCount} potential violations`}
            </p>
          </div>
        </div>

        {/* Card 4: Integrity indicator */}
        <div className="clay-card relative overflow-hidden p-6">
          <div className="flex items-start justify-between">
            <span className="text-[15px] font-medium text-[var(--text-secondary)]">
              Integrity indicator
            </span>
            <span className="flex size-10 items-center justify-center rounded-full bg-[#ebf4ff] text-[#2563eb] shadow-[0_4px_10px_rgba(37,99,235,0.2),inset_0_1.5px_2px_rgba(255,255,255,0.9)]">
              <Shield className="size-5" strokeWidth={2.5} />
            </span>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
              {displayIntegrity}
            </p>
            <p className="mt-1.5 text-xs font-semibold text-[#10b981]">
              {isDemo ? "+2.4% from last week" : events.length > 0 ? "Weighted index" : "No active session"}
            </p>
          </div>
        </div>
      </div>

      {/* Main Two Large Clay Cards matching dashboard.png */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left: Flag Volume 3D Bar Chart Card */}
        <div className="clay-card flex flex-col justify-between p-7">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              Flag volume
            </h2>

            {/* Dropdown pill */}
            <button className="clay-btn-secondary flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold">
              {timeRange}
              <ChevronDown className="size-3.5" />
            </button>
          </div>

          {/* 3D Clay Pill Bar Chart */}
          <div className="mt-8 flex h-60 items-end justify-between gap-4 px-2 sm:px-6">
            {trendData.map((item) => {
              const heightPercent = item.flags === 0 ? 6 : Math.max(8, Math.round((item.flags / maxTrend) * 100))
              return (
                <div
                  key={item.day}
                  className="group flex h-full flex-1 flex-col items-center justify-end gap-2.5 cursor-pointer"
                >
                  {/* Number label above bar */}
                  <span className="text-xs font-bold text-[var(--text-secondary)] transition-transform group-hover:scale-110 group-hover:text-[#2563eb]">
                    {item.flags}
                  </span>

                  {/* 3D rounded clay pill bar */}
                  <div className="relative w-full max-w-[28px] h-full flex items-end">
                    <div
                      className="clay-bar w-full transition-all duration-500"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>

                  {/* Day label */}
                  <span className="text-xs font-medium text-[var(--text-secondary)]">
                    {item.day}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: Spatial Activity Heatmap Card */}
        <div className="clay-card relative overflow-hidden p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                Spatial Activity Heatmap
              </h2>
              {selectedZone !== null && (
                <button
                  onClick={() => setSelectedZone(null)}
                  className="clay-btn-secondary px-2.5 py-1 text-[11px] font-bold text-[#2563eb]"
                >
                  Reset Filter (Zone {selectedZone})
                </button>
              )}
            </div>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              {heatmapZones && heatmapZones.length > 0
                ? "Live multi-zone camera proctoring density & telemetry"
                : "Live multi-zone camera proctoring density & motion clustering"}
            </p>
          </div>

          {/* Fluid organic interconnected metaball graphic (as in dashboard.png) */}
          <div className="relative my-4 flex h-60 items-center justify-center">
            {/* SVG Metaball bridge connections */}
            <svg
              className="absolute inset-0 size-full pointer-events-none"
              viewBox="0 0 400 240"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="bridgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#a7f3d0" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#6ee7b7" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.8" />
                </linearGradient>
                <filter id="goo">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
                  <feColorMatrix
                    in="blur"
                    mode="matrix"
                    values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
                    result="goo"
                  />
                </filter>
              </defs>

              {/* Organic connected fluid bridges */}
              <g filter="url(#goo)">
                <path
                  d="M 100 80 Q 200 40 300 80 Q 320 160 300 180 Q 200 190 100 180 Q 80 120 100 80 Z"
                  fill="url(#bridgeGrad)"
                  opacity="0.65"
                />
                <circle cx="200" cy="130" r="40" fill="#6ee7b7" opacity="0.5" />
              </g>
            </svg>

            {/* Zone Discs Grid with glowing clay style */}
            <div className="relative z-10 grid grid-cols-2 gap-x-32 gap-y-12">
              {[1, 2, 3, 4].map((zId) => {
                const zData = getZoneData(zId)
                const isSelected = selectedZone === zId
                const count = zData ? zData.event_count : events.filter(e => String(e.zone).includes(String(zId))).length
                const hasActivity = count > 0

                return (
                  <button
                    key={zId}
                    onClick={() => setSelectedZone(isSelected ? null : zId)}
                    className={cn(
                      "group relative flex size-24 flex-col items-center justify-center rounded-full shadow-[0_8px_24px_rgba(16,185,129,0.3),inset_0_2px_4px_rgba(255,255,255,0.9)] backdrop-blur-sm transition-all hover:scale-110 active:scale-95 cursor-pointer",
                      zId % 2 === 1
                        ? "bg-gradient-to-tr from-[#6ee7b7]/70 to-[#a7f3d0]/90 text-[#065f46]"
                        : "bg-gradient-to-tr from-[#67e8f9]/70 to-[#a5f3fc]/90 text-[#0e7490]",
                      isSelected && "ring-4 ring-[#2563eb] scale-105"
                    )}
                  >
                    <span className="text-sm font-bold group-hover:scale-105">
                      Zone {zId}
                    </span>
                    {count > 0 && (
                      <span className="text-[10px] font-semibold opacity-85">
                        {count} {count === 1 ? "evt" : "evts"}
                      </span>
                    )}
                    {hasActivity && (
                      <span className="absolute -top-1 -right-1 flex size-3">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#10b981] opacity-75" />
                        <span className="relative inline-flex size-3 rounded-full bg-[#10b981]" />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[#10b981]" /> 4 Active Proctoring Zones
            </span>
            <span
              onClick={onUpload}
              className="font-semibold text-[#2563eb] hover:underline cursor-pointer"
            >
              Analyze New Video →
            </span>
          </div>
        </div>
      </div>

      {/* Recent Events Section */}
      <div className="clay-card p-7">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--bg-app)] pb-5">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
              Recent Proctoring Events
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              {events.length > 0
                ? "Click any flagged event to review high-resolution AI snapshots."
                : "No proctoring events recorded yet. Upload an exam recording to begin AI analysis."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search session or exam..."
              className="clay-search-bar h-9 px-4 text-xs font-medium text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none"
            />
            <button
              onClick={handleExportCSV}
              disabled={events.length === 0}
              className="clay-btn-secondary flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold disabled:opacity-40"
            >
              <Download className="size-3.5" />
              Export
            </button>
          </div>
        </div>

        {/* Table Rows */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--bg-app)] text-xs font-semibold uppercase text-[var(--text-muted)]">
                <th className="pb-3 pt-1">Event</th>
                <th className="pb-3 pt-1">Zone / Exam</th>
                <th className="pb-3 pt-1">Detection Type</th>
                <th className="pb-3 pt-1">Confidence</th>
                <th className="pb-3 pt-1">Severity</th>
                <th className="pb-3 pt-1">Status</th>
                <th className="pb-3 pt-1 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--bg-app)]">
              {filteredEvents.map((evt) => (
                <tr
                  key={evt.id}
                  onClick={() => onOpenEvent(evt.id)}
                  className="group cursor-pointer transition-colors hover:bg-[var(--bg-card-secondary)]"
                >
                  <td className="py-4 font-mono text-xs font-bold text-[#2563eb]">
                    {evt.id}
                  </td>
                  <td className="py-4">
                    <p className="font-semibold text-[var(--text-primary)]">{evt.zone}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{evt.exam}</p>
                  </td>
                  <td className="py-4 text-xs font-medium text-[var(--text-primary)]">
                    {evt.detection}
                  </td>
                  <td className="py-4">
                    <span className="text-xs font-bold text-[var(--text-primary)]">
                      {evt.confidence}%
                    </span>
                  </td>
                  <td className="py-4">
                    <SeverityPill severity={evt.severity} />
                  </td>
                  <td className="py-4">
                    <StatusPill status={evt.status} />
                  </td>
                  <td className="py-4 text-right">
                    <button className="clay-btn-secondary inline-flex items-center gap-1 px-3 py-1 text-xs font-medium group-hover:bg-white">
                      Review
                      <ChevronRight className="size-3" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredEvents.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-[var(--text-secondary)]">
                    {query
                      ? `No events match "${query}".`
                      : "No proctoring events found. Upload an exam recording to begin AI analysis."}
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
