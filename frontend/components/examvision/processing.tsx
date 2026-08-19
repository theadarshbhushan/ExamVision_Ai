"use client"

import { useEffect, useState, useRef } from "react"
import { Check, Loader2, AlertTriangle, ArrowLeft } from "lucide-react"
import { PROCESSING_STEPS, type ProctoringEvent } from "@/lib/examvision-data"
import { Logo } from "./primitives"
import { cn } from "@/lib/utils"
import { getStatus, getResults, mapResultsToEvents } from "@/lib/api-client"

export function Processing({
  jobId,
  onComplete,
}: {
  jobId: string | null
  onComplete: (events: ProctoringEvent[]) => void
}) {
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<"processing" | "done" | "failed">("processing")
  const [error, setError] = useState<string | null>(null)
  const consecutiveFailures = useRef(0)

  useEffect(() => {
    if (!jobId) {
      setError("No active job ID provided.")
      setStatus("failed")
      return
    }

    const interval = setInterval(async () => {
      try {
        const res = await getStatus(jobId)
        consecutiveFailures.current = 0 // Reset failure counter on success
        setProgress(res.progress)

        if (res.status === "done") {
          clearInterval(interval)
          setStatus("done")

          // Fetch raw results and map them to UI ProctoringEvents
          const rawResults = await getResults(jobId)
          const events = mapResultsToEvents(rawResults, jobId)

          // Keep the analysis complete message visible for a short duration (900ms) for better UX
          setTimeout(() => {
            onComplete(events)
          }, 900)
        } else if (res.status === "failed") {
          clearInterval(interval)
          setStatus("failed")
          setError(res.error || "The pipeline run failed during execution.")
        }
      } catch (err: any) {
        console.error("Error checking job status:", err)
        consecutiveFailures.current += 1
        if (consecutiveFailures.current >= 5) {
          clearInterval(interval)
          setStatus("failed")
          setError("Lost connection to the analysis server. Please check the backend is running and try again.")
        }
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [jobId, onComplete])

  if (status === "failed") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center">
            <Logo />
          </div>
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
              <AlertTriangle className="size-7" />
            </div>
            <h1 className="text-lg font-semibold text-foreground">Analysis failed</h1>
            <p className="mt-2 text-sm text-muted-foreground text-left bg-slate-50 p-4 rounded-xl border border-border font-mono max-h-48 overflow-y-auto break-words">
              {error || "An unknown error occurred during video analysis."}
            </p>
            <button
              onClick={() => onComplete([])}
              className="mt-6 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              <ArrowLeft className="size-4" />
              Back to dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  const rounded = Math.round(progress)
  const stepCount = PROCESSING_STEPS.length
  const activeStep = Math.min(stepCount - 1, Math.floor((progress / 100) * stepCount))

  // circular progress geometry
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="flex flex-col items-center">
            <div className="relative flex size-32 items-center justify-center">
              <svg className="size-32 -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  strokeWidth="8"
                  className="stroke-secondary"
                />
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  strokeWidth="8"
                  strokeLinecap="round"
                  className="stroke-primary transition-[stroke-dashoffset] duration-300 ease-out"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                />
              </svg>
              <span className="absolute text-2xl font-semibold tabular-nums text-foreground">
                {rounded}%
              </span>
            </div>
            <h1 className="mt-6 text-lg font-semibold text-foreground">
              {progress >= 100 ? "Analysis complete" : "Analyzing your session"}
            </h1>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              {progress >= 100
                ? "Taking you to your dashboard…"
                : "This usually takes a couple of minutes. You can keep this tab open."}
            </p>
          </div>

          <ul className="mt-8 space-y-3">
            {PROCESSING_STEPS.map((step, i) => {
              const done = i < activeStep || progress >= 100
              const current = i === activeStep && progress < 100
              return (
                <li key={step} className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full transition-colors",
                      done
                        ? "bg-success text-success-foreground"
                        : current
                          ? "bg-primary/10 text-primary"
                          : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {done ? (
                      <Check className="size-3.5" strokeWidth={3} />
                    ) : current ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <span className="text-xs font-medium">{i + 1}</span>
                    )}
                  </span>
                  <span
                    className={cn(
                      "text-sm transition-colors",
                      done || current
                        ? "font-medium text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {step}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  )
}
