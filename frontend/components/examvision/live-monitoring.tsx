"use client"
import { useEffect, useState } from "react"
import { Radio, Video } from "lucide-react"
import { LIVE_SESSIONS } from "@/lib/examvision-data"

type LiveSession = {
  id: string
  student: string
  initials: string
  exam: string
  score: number
  state: "critical" | "flagged" | "normal"
}

export function LiveMonitoring({ isDemo = true, onOpen }: { isDemo?: boolean; onOpen: (id: string) => void }) {
  const [filter, setFilter] = useState("All")
  const rawSessions: LiveSession[] = isDemo ? (LIVE_SESSIONS as LiveSession[]) : []
  const [scores, setScores] = useState<number[]>(() => rawSessions.map((x: LiveSession) => x.score))
  
  useEffect(() => {
    if (!isDemo || rawSessions.length === 0) return
    const timer = setInterval(() => setScores((s: number[]) => s.map((n: number) => Math.max(60, Math.min(100, n + Math.round(Math.random() * 4 - 2))))), 3500)
    return () => clearInterval(timer)
  }, [isDemo, rawSessions.length])

  const sessions = rawSessions.filter((x: LiveSession) => filter === "All" || (filter === "Flagged only" ? x.state === "flagged" : x.state === "critical"))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-950/40 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-400">
            <Radio className="size-3 animate-pulse" />
            Live now
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Live monitoring</h1>
          <p className="mt-1 text-sm text-muted-foreground">A calm, real-time view of active assessment sessions.</p>
        </div>
        <div className="rounded-lg bg-secondary p-1 border border-border">
          {["All", "Flagged only", "Critical only"].map(x => (
            <button
              key={x}
              onClick={() => setFilter(x)}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${filter === x ? "bg-card font-medium text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              {x}
            </button>
          ))}
        </div>
      </div>

      {sessions.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sessions.map((s, i) => (
            <button
              key={s.id}
              onClick={() => onOpen(s.id)}
              className="group rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <span className="flex size-10 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                  {s.initials}
                </span>
                <span className={`flex items-center gap-1.5 text-xs font-semibold ${s.state === "critical" ? "text-destructive" : s.state === "flagged" ? "text-warning-foreground" : "text-success"}`}>
                  <span className={`size-2 rounded-full animate-pulse ${s.state === "critical" ? "bg-destructive" : s.state === "flagged" ? "bg-warning" : "bg-success"}`} />
                  {s.state === "normal" ? "Normal" : s.state === "critical" ? "Critical" : "Flagged"}
                </span>
              </div>
              <div className="mt-5">
                <p className="font-semibold text-foreground">{s.student}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.exam}</p>
              </div>
              <div className="mt-5 flex items-end justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Integrity score</p>
                  <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">{scores[i] ?? s.score}%</p>
                </div>
                <Video className="size-5 text-primary opacity-0 transition group-hover:opacity-100" />
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${scores[i] ?? s.score}%` }} />
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-secondary/30 px-6 py-20 text-center">
          <Radio className="size-8 text-muted-foreground/50 mb-3" />
          <p className="text-base font-medium text-foreground">No live sessions active</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {isDemo
              ? `No ${filter.toLowerCase()} sessions currently active.`
              : "No candidate video streams are currently streaming. Live monitoring feeds will appear here when active exams begin."}
          </p>
        </div>
      )}
    </div>
  )
}
