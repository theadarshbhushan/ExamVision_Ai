"use client"

import { useState } from "react"
import {
  AlertTriangle,
  Eye,
  Volume2,
  MonitorX,
  CheckCircle2,
  BellOff,
  Check,
} from "lucide-react"
import { ALERTS, type Alert, type Severity } from "@/lib/examvision-data"
import { SeverityPill } from "./primitives"
import { cn } from "@/lib/utils"

const FILTERS: (Severity | "All")[] = ["All", "Critical", "Medium", "Low"]

function iconFor(alert: Alert) {
  const t = alert.title.toLowerCase()
  if (t.includes("second person") || t.includes("candidates")) return Eye
  if (t.includes("audio")) return Volume2
  if (t.includes("tab")) return MonitorX
  if (t.includes("complete")) return CheckCircle2
  return AlertTriangle
}

export function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>(ALERTS)
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All")
  const [removing, setRemoving] = useState<string[]>([])

  const visible = alerts.filter(
    (a) => filter === "All" || a.severity === filter,
  )

  function dismiss(id: string) {
    setRemoving((r) => [...r, id])
    setTimeout(() => {
      setAlerts((prev) => prev.filter((a) => a.id !== id))
      setRemoving((r) => r.filter((x) => x !== id))
    }, 280)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Alerts
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Prioritized integrity signals across all active exams.
          </p>
        </div>
        <button
          onClick={() => setAlerts([])}
          disabled={alerts.length === 0}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
        >
          <Check className="size-4" />
          Mark all as read
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const count =
            f === "All"
              ? alerts.length
              : alerts.filter((a) => a.severity === f).length
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                filter === f
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {f}
              <span
                className={cn(
                  "rounded-full px-1.5 text-xs",
                  filter === f
                    ? "bg-primary-foreground/20"
                    : "bg-secondary text-muted-foreground",
                )}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* List */}
      {visible.length > 0 ? (
        <div className="space-y-3">
          {visible.map((alert) => {
            const Icon = iconFor(alert)
            const isRemoving = removing.includes(alert.id)
            return (
              <div
                key={alert.id}
                className={cn(
                  "flex items-start gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition-all duration-300",
                  isRemoving
                    ? "translate-x-2 opacity-0"
                    : "translate-x-0 opacity-100",
                )}
              >
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-lg",
                    alert.severity === "Critical"
                      ? "bg-destructive/10 text-destructive"
                      : alert.severity === "Medium"
                        ? "bg-warning/15 text-warning-foreground"
                        : "bg-secondary text-muted-foreground",
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-foreground">{alert.title}</p>
                    <SeverityPill severity={alert.severity} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {alert.description}
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {alert.timestamp}
                    </span>
                    <span className="text-border">·</span>
                    <button className="text-xs font-medium text-primary hover:underline">
                      Review
                    </button>
                    <button
                      onClick={() => dismiss(alert.id)}
                      className="text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-secondary/30 px-6 py-20 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <BellOff className="size-6" />
          </span>
          <p className="mt-4 text-base font-medium text-foreground">
            You&apos;re all caught up
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {alerts.length === 0
              ? "No alerts left in your queue."
              : `No ${filter.toLowerCase()} alerts right now.`}
          </p>
        </div>
      )}
    </div>
  )
}
