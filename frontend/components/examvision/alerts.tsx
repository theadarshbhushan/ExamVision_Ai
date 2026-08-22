"use client"

import React, { useState, useEffect } from "react"
import {
  AlertTriangle,
  Eye,
  MonitorX,
  Volume2,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react"
import { ALERTS, type Alert, type Severity, type ProctoringEvent } from "@/lib/examvision-data"
import { cn } from "@/lib/utils"

export function Alerts({
  events = [],
  isDemo = true,
  onOpenEvent,
}: {
  events?: ProctoringEvent[]
  isDemo?: boolean
  onOpenEvent?: (id: string) => void
}) {
  const dynamicAlerts: (Alert & { eventId?: string })[] = isDemo
    ? ALERTS
    : events
        .filter((e) => e.severity === "Critical" || e.severity === "Medium" || e.status === "Flagged")
        .map((e) => ({
          id: `ALT-${e.id.replace(/^EVT-/, "")}`,
          eventId: e.id,
          title: `${e.detection} detected in ${e.session}`,
          description: `Zone ${e.zone} · ${e.confidence}% confidence at ${e.timestamp}. ${e.notes || ""}`,
          timestamp: e.timestamp,
          severity: e.severity,
          type: (e.detection.toLowerCase().includes("audio")
            ? "audio"
            : e.detection.toLowerCase().includes("tab")
            ? "tab"
            : e.detection.toLowerCase().includes("gaze") || e.detection.toLowerCase().includes("person")
            ? "eye"
            : "warning") as Alert["type"],
        }))

  const [alerts, setAlerts] = useState<(Alert & { eventId?: string })[]>(dynamicAlerts)
  const [filter, setFilter] = useState<"All" | "Critical" | "Medium" | "Low">("All")
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setAlerts(dynamicAlerts)
  }, [events, isDemo])

  const visible = alerts.filter((a) => filter === "All" || a.severity === filter)

  function dismiss(id: string) {
    setAlerts((prev) => prev.filter((a) => a.id !== id))
  }

  function renderIcon(type: Alert["type"], severity: Severity) {
    switch (type) {
      case "warning":
        return (
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#ff6b6b] to-[#fa5252] text-white shadow-[0_4px_12px_rgba(250,82,82,0.35),inset_0_2px_3px_rgba(255,255,255,0.7)]">
            <AlertTriangle className="size-6" strokeWidth={2.5} />
          </span>
        )
      case "eye":
        return (
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#ff6b6b] to-[#fa5252] text-white shadow-[0_4px_12px_rgba(250,82,82,0.35),inset_0_2px_3px_rgba(255,255,255,0.7)]">
            <Eye className="size-6" strokeWidth={2.5} />
          </span>
        )
      case "tab":
        return (
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#fd7e14] to-[#f76707] text-white shadow-[0_4px_12px_rgba(247,103,7,0.35),inset_0_2px_3px_rgba(255,255,255,0.7)]">
            <MonitorX className="size-6" strokeWidth={2.5} />
          </span>
        )
      case "audio":
        return (
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#fcc419] to-[#fab005] text-white shadow-[0_4px_12px_rgba(250,176,5,0.35),inset_0_2px_3px_rgba(255,255,255,0.7)]">
            <Volume2 className="size-6" strokeWidth={2.5} />
          </span>
        )
      default:
        return (
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#3b82f6] to-[#2563eb] text-white shadow-[0_4px_12px_rgba(37,99,235,0.35),inset_0_2px_3px_rgba(255,255,255,0.7)]">
            <AlertTriangle className="size-6" strokeWidth={2.5} />
          </span>
        )
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Title matching alert.png */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
          Alerts
        </h1>
      </div>

      {/* Filter Row matching alert.png */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setFilter("All")}
            className={cn(
              "clay-btn-secondary px-5 py-2 text-xs font-bold transition-all",
              filter === "All"
                ? "bg-white text-[#2563eb] shadow-[0_4px_12px_rgba(37,99,235,0.25),inset_0_2px_3px_rgba(255,255,255,1)]"
                : "text-[var(--text-secondary)]"
            )}
          >
            All
          </button>

          <button
            onClick={() => setFilter("Critical")}
            className={cn(
              "clay-btn-secondary flex items-center gap-2 px-5 py-2 text-xs font-bold transition-all",
              filter === "Critical"
                ? "bg-white text-[#ef4444] shadow-[0_4px_12px_rgba(239,68,68,0.25),inset_0_2px_3px_rgba(255,255,255,1)]"
                : "text-[var(--text-secondary)]"
            )}
          >
            <span className="size-2 rounded-full bg-[#ef4444]" />
            Critical
          </button>

          <button
            onClick={() => setFilter("Medium")}
            className={cn(
              "clay-btn-secondary flex items-center gap-2 px-5 py-2 text-xs font-bold transition-all",
              filter === "Medium"
                ? "bg-white text-[#f97316] shadow-[0_4px_12px_rgba(249,115,22,0.25),inset_0_2px_3px_rgba(255,255,255,1)]"
                : "text-[var(--text-secondary)]"
            )}
          >
            <span className="size-2 rounded-full bg-[#f97316]" />
            Medium
          </button>

          <button
            onClick={() => setFilter("Low")}
            className={cn(
              "clay-btn-secondary flex items-center gap-2 px-5 py-2 text-xs font-bold transition-all",
              filter === "Low"
                ? "bg-white text-[#eab308] shadow-[0_4px_12px_rgba(234,179,8,0.25),inset_0_2px_3px_rgba(255,255,255,1)]"
                : "text-[var(--text-secondary)]"
            )}
          >
            <span className="size-2 rounded-full bg-[#eab308]" />
            Low
          </button>
        </div>

        <button
          onClick={() => setAlerts([])}
          className="clay-btn-secondary px-5 py-2 text-xs font-bold text-[var(--text-primary)]"
        >
          Mark all as read
        </button>
      </div>

      {/* Alert Cards matching alert.png */}
      <div className="space-y-4">
        {visible.map((alert) => (
          <div
            key={alert.id}
            className="clay-card flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center bg-white/95"
          >
            {/* Left: Icon + Content */}
            <div className="flex items-center gap-4.5 min-w-0">
              {renderIcon(alert.type, alert.severity)}

              <div className="min-w-0">
                <h3 className="text-[15px] font-bold text-[var(--text-primary)]">
                  {alert.title}
                </h3>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                  {alert.description}
                </p>
              </div>
            </div>

            {/* Right: Quick Action */}
            <div className="flex flex-col items-end shrink-0 self-end sm:self-center">
              <span className="text-[11px] font-medium text-[var(--text-muted)]">
                Quick action
              </span>
              {alert.type === "audio" ? (
                <button
                  onClick={() => dismiss(alert.id)}
                  className="text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Dismiss
                </button>
              ) : (
                <button
                  onClick={() => onOpenEvent && onOpenEvent(alert.eventId || "EVT-073481")}
                  className="text-xs font-bold text-[#2563eb] hover:underline cursor-pointer"
                >
                  View Details
                </button>
              )}
            </div>
          </div>
        ))}

        {visible.length === 0 && (
          <div className="clay-card py-16 text-center text-[var(--text-secondary)]">
            <Check className="mx-auto size-8 text-[#10b981] mb-2" />
            <p className="font-semibold text-[var(--text-primary)]">All caught up!</p>
            <p className="text-xs mt-1">No alerts matching the selected filter.</p>
          </div>
        )}
      </div>

      {/* Pagination matching alert.png */}
      <div className="mt-8 flex items-center justify-center gap-2">
        <button className="clay-btn-secondary flex size-8 items-center justify-center rounded-lg text-xs font-bold text-[var(--text-secondary)]">
          <ChevronLeft className="size-3.5" />
        </button>
        {[1, 2, 3].map((page) => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={cn(
              "flex size-8 items-center justify-center rounded-lg text-xs font-bold transition-all",
              currentPage === page
                ? "bg-white text-[#2563eb] shadow-[0_4px_10px_rgba(37,99,235,0.25),inset_0_2px_3px_rgba(255,255,255,0.9)]"
                : "text-[var(--text-secondary)] hover:bg-white/50"
            )}
          >
            {page}
          </button>
        ))}
        <span className="px-1 text-xs text-[var(--text-secondary)]">...</span>
        <button
          onClick={() => setCurrentPage(8)}
          className="flex size-8 items-center justify-center rounded-lg text-xs font-bold text-[var(--text-secondary)] hover:bg-white/50"
        >
          8
        </button>
        <button className="clay-btn-secondary flex size-8 items-center justify-center rounded-lg text-xs font-bold text-[var(--text-secondary)]">
          <ChevronRight className="size-3.5" />
        </button>
      </div>
    </div>
  )
}
