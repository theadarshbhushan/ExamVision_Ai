"use client"

import { ArrowLeft, Play, Check, X, Flag } from "lucide-react"
import type { ProctoringEvent } from "@/lib/examvision-data"
import { StatusPill, SeverityPill } from "./primitives"

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{children}</span>
    </div>
  )
}

export function EventDetail({
  event,
  onBack,
  onViolation,
  onDismiss,
}: {
  event: ProctoringEvent
  onBack: () => void
  onViolation: (id: string) => void
  onDismiss: (id: string) => void
}) {
  const decided = event.status !== "Pending"

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to dashboard
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {event.detection}
            </h1>
            <StatusPill status={event.status} />
          </div>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {event.id} · {event.session}
          </p>
        </div>
        <SeverityPill severity={event.severity} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Evidence panel */}
        <div className="lg:col-span-3">
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="relative aspect-video bg-secondary">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={event.thumbnail || "/placeholder.svg"}
                alt={`Evidence frame for ${event.detection} in session ${event.session}`}
                className="size-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-foreground/10">
                <span className="flex size-14 items-center justify-center rounded-full bg-card/90 text-foreground shadow-sm backdrop-blur">
                  <Play className="size-6 translate-x-0.5 fill-current" />
                </span>
              </div>
              <span className="absolute left-3 top-3 rounded-md bg-foreground/70 px-2 py-1 font-mono text-xs text-background">
                00:14:22
              </span>
              <span className="absolute right-3 top-3 rounded-md bg-destructive/90 px-2 py-1 text-xs font-medium text-primary-foreground">
                Detection point
              </span>
            </div>
            <div className="border-t border-border p-4">
              <p className="text-sm font-medium text-foreground">Reviewer notes</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {event.notes}
              </p>
            </div>
          </div>
        </div>

        {/* Metadata + actions */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground">Details</h3>
            <div className="mt-2">
              <MetaRow label="Student">{event.student}</MetaRow>
              <MetaRow label="Exam">{event.exam}</MetaRow>
              <MetaRow label="Session">
                <span className="font-mono text-xs">{event.session}</span>
              </MetaRow>
              <MetaRow label="Detection type">{event.detection}</MetaRow>
              <MetaRow label="Confidence">
                <span className="tabular-nums">{event.confidence}%</span>
              </MetaRow>
              <MetaRow label="Reviewer">{event.reviewer}</MetaRow>
              <MetaRow label="Timestamp">
                <span className="font-mono text-xs">{event.timestamp}</span>
              </MetaRow>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground">Decision</h3>
            {decided ? (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-secondary/60 px-3 py-3 text-sm text-muted-foreground">
                <Check className="size-4 text-success" />
                Marked as <span className="font-medium text-foreground">{event.status}</span>
              </div>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">
                Confirm this event as a violation or dismiss it if there&apos;s no
                integrity concern.
              </p>
            )}
            <div className="mt-4 flex flex-col gap-2">
              <button
                onClick={() => onViolation(event.id)}
                disabled={decided}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
              >
                <Flag className="size-4" />
                Mark as violation
              </button>
              <button
                onClick={() => onDismiss(event.id)}
                disabled={decided}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
              >
                <X className="size-4" />
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
