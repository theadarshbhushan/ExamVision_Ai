"use client"

import { useMemo, useState } from "react"
import { type ProctoringEvent } from "@/lib/examvision-data"
import { cn } from "@/lib/utils"
import { Clock } from "lucide-react"

function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds))
  const hrs = Math.floor(s / 3600)
  const mins = Math.floor((s % 3600) / 60)
  const secs = s % 60
  if (hrs > 0) {
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

function parseTimestampToSeconds(ts: string): number {
  if (!ts) return 0
  if (ts.includes(":")) {
    const parts = ts.split(":").map(Number)
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return parts[0] * 60 + parts[1]
    }
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2]
    }
  }
  const parsed = parseFloat(ts)
  return isNaN(parsed) ? 0 : parsed
}

export type TimelineCluster = {
  id: string
  positionPercent: number
  events: ProctoringEvent[]
}

export function ActivityTimeline({
  events,
  totalDuration,
  activeEventId,
  onSelectEvent,
  className,
}: {
  events: ProctoringEvent[]
  totalDuration?: number
  activeEventId?: string
  onSelectEvent?: (eventId: string) => void
  className?: string
}) {
  const [hoveredCluster, setHoveredCluster] = useState<TimelineCluster | null>(null)

  // Compute resolved total duration
  const resolvedDuration = useMemo(() => {
    if (totalDuration && totalDuration > 0) return totalDuration
    let maxSec = 0
    events.forEach((e) => {
      const start = e.startTime !== undefined ? e.startTime : parseTimestampToSeconds(e.timestamp)
      const end = e.endTime !== undefined ? e.endTime : start
      if (end > maxSec) maxSec = end
    })
    return maxSec > 0 ? Math.ceil(maxSec * 1.08) : 1590 // Default 26:30
  }, [totalDuration, events])

  // Cluster nearby events (within ~3% distance)
  const clusters = useMemo<TimelineCluster[]>(() => {
    if (!events || events.length === 0) return []

    // Sort events by startTime
    const sorted = [...events].map((e) => ({
      event: e,
      timeSec: e.startTime !== undefined ? e.startTime : parseTimestampToSeconds(e.timestamp),
    })).sort((a, b) => a.timeSec - b.timeSec)

    const clusterList: TimelineCluster[] = []
    const thresholdPercent = 3.2 // 3.2% cluster tolerance

    sorted.forEach(({ event, timeSec }) => {
      const posPercent = Math.min(100, Math.max(0, (timeSec / resolvedDuration) * 100))
      const lastCluster = clusterList[clusterList.length - 1]

      if (lastCluster && Math.abs(posPercent - lastCluster.positionPercent) < thresholdPercent) {
        lastCluster.events.push(event)
      } else {
        clusterList.push({
          id: `cluster-${event.id}`,
          positionPercent: posPercent,
          events: [event],
        })
      }
    })

    return clusterList
  }, [events, resolvedDuration])

  // Find active event position for pointer indicator
  const activePercent = useMemo(() => {
    if (!activeEventId) return null
    const activeEv = events.find((e) => e.id === activeEventId)
    if (!activeEv) return null
    const sec = activeEv.startTime !== undefined ? activeEv.startTime : parseTimestampToSeconds(activeEv.timestamp)
    return Math.min(100, Math.max(0, (sec / resolvedDuration) * 100))
  }, [activeEventId, events, resolvedDuration])

  return (
    <div className={cn("rounded-xl border border-border bg-card p-4 shadow-sm", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-primary" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
            Activity Timeline
          </h4>
          <span className="text-[11px] font-mono text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded">
            {events.length} {events.length === 1 ? "event" : "events"} recorded
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-destructive" />
            AI Detection
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-warning" />
            Medium
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-slate-500" />
            Motion-only
          </span>
        </div>
      </div>

      {/* Main Timeline Scrubber Area */}
      <div className="relative pt-3 pb-2">
        {/* Active event cursor indicator */}
        {activePercent !== null && (
          <div
            className="absolute top-0 -translate-x-1/2 flex flex-col items-center pointer-events-none transition-all duration-300 z-10"
            style={{ left: `${activePercent}%` }}
          >
            <div className="size-2 rounded-full bg-primary ring-2 ring-primary/40 animate-pulse" />
            <div className="w-0.5 h-3 bg-primary" />
          </div>
        )}

        {/* Track Line */}
        <div className="relative h-2.5 w-full rounded-full bg-secondary/90 border border-border overflow-visible">
          {/* Tick markers across intervals (25%, 50%, 75%) */}
          <div className="absolute left-1/4 top-0 h-full w-px bg-border/80 pointer-events-none" />
          <div className="absolute left-1/2 top-0 h-full w-px bg-border/80 pointer-events-none" />
          <div className="absolute left-3/4 top-0 h-full w-px bg-border/80 pointer-events-none" />

          {/* Interactive Event Markers */}
          {clusters.map((cluster) => {
            const count = cluster.events.length
            const isSingle = count === 1
            const primaryEvent = cluster.events[0]
            const containsActive = cluster.events.some((e) => e.id === activeEventId)
            const hasCritical = cluster.events.some((e) => e.severity === "Critical" || e.detection !== "Motion Triggered")
            const hasMedium = cluster.events.some((e) => e.severity === "Medium")

            // Color coding
            const markerBg = hasCritical
              ? "bg-destructive text-destructive-foreground border-destructive/60"
              : hasMedium
                ? "bg-warning text-warning-foreground border-warning/60"
                : "bg-slate-500 text-white border-slate-400"

            return (
              <div
                key={cluster.id}
                style={{ left: `${cluster.positionPercent}%` }}
                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 group"
              >
                <button
                  onClick={() => onSelectEvent?.(primaryEvent.id)}
                  onMouseEnter={() => setHoveredCluster(cluster)}
                  onMouseLeave={() => setHoveredCluster(null)}
                  aria-label={`Event marker at ${cluster.positionPercent.toFixed(1)}%`}
                  className={cn(
                    "relative flex items-center justify-center rounded-full border shadow transition duration-150 transform hover:scale-125 focus:outline-none",
                    isSingle ? "size-3.5" : "min-w-5 h-5 px-1 text-[10px] font-bold",
                    markerBg,
                    containsActive && "ring-2 ring-primary ring-offset-2 ring-offset-card scale-110"
                  )}
                >
                  {!isSingle && count}
                </button>
              </div>
            )
          })}
        </div>

        {/* Floating Tooltip for Hovered Cluster */}
        {hoveredCluster && (
          <div
            className="absolute -top-24 -translate-x-1/2 z-30 pointer-events-auto transition-all animate-fade-in"
            style={{
              left: `${Math.min(92, Math.max(8, hoveredCluster.positionPercent))}%`,
            }}
          >
            <div className="rounded-lg border border-border bg-popover/95 p-2.5 text-popover-foreground shadow-lg backdrop-blur-sm min-w-44">
              <div className="flex items-center justify-between border-b border-border/80 pb-1.5 mb-1.5 text-xs text-muted-foreground">
                <span className="font-mono font-medium text-foreground">
                  {formatDuration((hoveredCluster.positionPercent / 100) * resolvedDuration)}
                </span>
                <span className="text-[10px] uppercase font-bold text-primary">
                  {hoveredCluster.events.length > 1 ? `${hoveredCluster.events.length} Events` : "Event Detail"}
                </span>
              </div>

              <div className="space-y-1.5">
                {hoveredCluster.events.slice(0, 3).map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => onSelectEvent?.(ev.id)}
                    className="w-full text-left text-xs p-1 rounded hover:bg-muted/70 flex items-center justify-between gap-2 group/item"
                  >
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <span
                        className={cn(
                          "size-1.5 rounded-full shrink-0",
                          ev.severity === "Critical"
                            ? "bg-destructive"
                            : ev.severity === "Medium"
                              ? "bg-warning"
                              : "bg-slate-400"
                        )}
                      />
                      <span className="font-medium text-foreground truncate">{ev.detection}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                      Zone {ev.zone}
                    </span>
                  </button>
                ))}
                {hoveredCluster.events.length > 3 && (
                  <p className="text-[10px] text-center text-muted-foreground italic">
                    +{hoveredCluster.events.length - 3} more events
                  </p>
                )}
              </div>
            </div>
            {/* Triangle caret */}
            <div className="mx-auto size-0 border-x-4 border-x-transparent border-t-4 border-t-popover" />
          </div>
        )}
      </div>

      {/* Start / End Timestamp Labels */}
      <div className="flex justify-between items-center text-[11px] font-mono text-muted-foreground mt-1 px-0.5">
        <span>00:00</span>
        <span className="text-xs font-semibold text-foreground/80">
          {formatDuration(resolvedDuration)}
        </span>
      </div>
    </div>
  )
}
