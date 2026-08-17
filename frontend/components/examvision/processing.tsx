"use client"

import { useEffect, useState } from "react"
import { Check, Loader2 } from "lucide-react"
import { PROCESSING_STEPS } from "@/lib/examvision-data"
import { Logo } from "./primitives"
import { cn } from "@/lib/utils"

export function Processing({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval)
          return 100
        }
        return Math.min(100, p + Math.random() * 6 + 2)
      })
    }, 320)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (progress >= 100) {
      const t = setTimeout(onComplete, 900)
      return () => clearTimeout(t)
    }
  }, [progress, onComplete])

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
