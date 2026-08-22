"use client"

import React, { useState, useEffect } from "react"
import { ArrowLeft, ChevronLeft, ChevronRight, Check, X, Eye, CameraOff, Sparkles } from "lucide-react"
import { type ProctoringEvent } from "@/lib/examvision-data"
import { StatusPill, SeverityPill } from "./primitives"
import { ActivityTimeline } from "./activity-timeline"
import { cn } from "@/lib/utils"

export function EventDetail({
  event,
  events = [],
  totalDuration,
  onBack,
  onViolation,
  onDismiss,
  onNavigate,
}: {
  event: ProctoringEvent | null
  events?: ProctoringEvent[]
  totalDuration?: number
  onBack: () => void
  onViolation: (id: string) => void
  onDismiss: (id: string) => void
  onNavigate?: (id: string) => void
}) {
  const item = event ?? (events.length > 0 ? events[0] : null)
  const currentIndex = item ? events.findIndex((e) => e.id === item.id) : 0
  const totalEvents = events.length > 0 ? events.length : 1
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex >= 0 && currentIndex < events.length - 1
  const prevEvent = hasPrev ? events[currentIndex - 1] : null
  const nextEvent = hasNext ? events[currentIndex + 1] : null

  const [decisionState, setDecisionState] = useState<"Flagged" | "Cleared" | null>(
    item?.status === "Pending" ? null : (item?.status as "Flagged" | "Cleared")
  )

  useEffect(() => {
    if (item) {
      setDecisionState(item.status === "Pending" ? null : (item.status as "Flagged" | "Cleared"))
    }
  }, [item])

  // Keyboard navigation support (ArrowLeft / ArrowRight)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return
      }
      if (e.key === "ArrowLeft" && hasPrev && prevEvent && onNavigate) {
        e.preventDefault()
        onNavigate(prevEvent.id)
      } else if (e.key === "ArrowRight" && hasNext && nextEvent && onNavigate) {
        e.preventDefault()
        onNavigate(nextEvent.id)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [hasPrev, hasNext, prevEvent, nextEvent, onNavigate])

  if (!item) {
    return (
      <div className="clay-card py-20 text-center">
        <CameraOff className="size-12 text-[#8a9eb8] mx-auto mb-3" />
        <h2 className="text-xl font-bold text-[var(--text-primary)]">No investigation selected</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Upload and process an exam recording to inspect AI-flagged detection snapshots.
        </p>
        <button onClick={onBack} className="clay-btn-primary mt-6 px-6 py-2.5">
          Back to investigations
        </button>
      </div>
    )
  }

  function handleViolation() {
    setDecisionState("Flagged")
    onViolation(item!.id)
  }

  function handleDismiss() {
    setDecisionState("Cleared")
    onDismiss(item!.id)
  }

  const isDemoGazeEvent = item.id === "EVT-073481" && item.thumbnail?.includes("evidence-gaze")

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Breadcrumb & Navigation Bar matching investigation.png */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
        >
          <ArrowLeft className="size-4" />
          Back to Investigations
        </button>

        {/* Stepper Navigation */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-[var(--text-secondary)]">
            Event {currentIndex + 1} of {totalEvents}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => prevEvent && onNavigate?.(prevEvent.id)}
              disabled={!hasPrev}
              className="clay-btn-secondary flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold disabled:opacity-40 disabled:pointer-events-none"
            >
              <ChevronLeft className="size-3.5" />
              Previous
            </button>
            <button
              onClick={() => nextEvent && onNavigate?.(nextEvent.id)}
              disabled={!hasNext}
              className="clay-btn-secondary flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold disabled:opacity-40 disabled:pointer-events-none"
            >
              Next
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Header with Title and Badges */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
            {item.detection}
          </h1>
          <StatusPill status={item.status} className="px-4 py-1 text-xs font-bold" />
        </div>
        <p className="mt-1 font-mono text-xs font-medium text-[var(--text-secondary)]">
          {item.id} • {item.session}
        </p>
      </div>

      {/* Main Grid matching investigation.png */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column (Evidence Frame & Reviewer Notes) */}
        <div className="space-y-6 lg:col-span-8">
          {/* Large Evidence Card */}
          <div className="clay-card relative overflow-hidden p-3.5 bg-white">
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-slate-900 shadow-[inset_0_2px_6px_rgba(0,0,0,0.4)] flex items-center justify-center">
              {item.thumbnail && item.thumbnail !== "/placeholder.svg" ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.thumbnail}
                    alt={`Evidence frame for ${item.detection}`}
                    className="size-full object-cover"
                  />

                  {/* Top Badges */}
                  <div className="absolute top-4 left-4 z-10">
                    <span className="rounded-full bg-white/85 px-3.5 py-1 text-xs font-semibold text-[#0f1e36] shadow-sm backdrop-blur-md">
                      Evidence frame ({item.timestamp})
                    </span>
                  </div>

                  <div className="absolute top-4 right-4 z-10">
                    <span className="rounded-full bg-[#dcfce7]/90 px-3.5 py-1 text-xs font-semibold text-[#166534] shadow-sm backdrop-blur-md">
                      Detection snapshot
                    </span>
                  </div>

                  {/* AI Bounding Box Overlay for Demo Gaze Frame */}
                  {isDemoGazeEvent && (
                    <div className="absolute top-[32%] left-[40%] z-20">
                      <div className="relative size-28 rounded-md border-2 border-[#ef4444] shadow-[0_0_12px_rgba(239,68,68,0.5)]">
                        <div className="absolute top-12 left-16 min-w-[140px] rounded-xl bg-[#ef4444]/85 px-3 py-1.5 text-white shadow-md backdrop-blur-md">
                          <p className="text-[11px] font-bold leading-tight">Gaze off-screen</p>
                          <p className="text-[11px] font-semibold opacity-90">{item.confidence}%</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center text-slate-300">
                  <CameraOff className="size-12 opacity-60 mb-2" />
                  <p className="text-sm font-semibold">Motion Telemetry Event</p>
                  <p className="text-xs opacity-75 mt-1">No prohibited object detected by YOLO in this window.</p>
                </div>
              )}
            </div>
          </div>

          {/* Reviewer Notes Card */}
          <div className="clay-card p-6">
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Reviewer notes
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
              {item.notes || "Event captured during proctored assessment."}
            </p>
          </div>
        </div>

        {/* Right Column (Details & Decision) */}
        <div className="space-y-6 lg:col-span-4">
          {/* Details Card */}
          <div className="clay-card p-6">
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Details
            </h3>

            <div className="mt-4 divide-y divide-[var(--bg-app)] text-sm">
              <div className="flex items-center justify-between py-3">
                <span className="text-[var(--text-secondary)]">Zone</span>
                <span className="font-semibold text-[var(--text-primary)]">{item.zone}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-[var(--text-secondary)]">Exam</span>
                <span className="font-semibold text-[var(--text-primary)]">{item.exam}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-[var(--text-secondary)]">Session</span>
                <span className="font-mono font-semibold text-[var(--text-primary)]">{item.session}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-[var(--text-secondary)]">Detection type</span>
                <span className="font-semibold text-[var(--text-primary)]">{item.detection}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-[var(--text-secondary)]">Confidence</span>
                <span className="font-bold text-[var(--text-primary)]">{item.confidence}%</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-[var(--text-secondary)]">Reviewer</span>
                <span className="font-semibold text-[var(--text-primary)]">{item.reviewer}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-[var(--text-secondary)]">Timestamp</span>
                <span className="font-mono font-semibold text-[var(--text-primary)]">{item.timestamp}</span>
              </div>
            </div>
          </div>

          {/* Decision Card matching investigation.png */}
          <div className="clay-card p-6">
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Decision
            </h3>
            <p className="mt-1.5 text-xs text-[var(--text-secondary)] leading-relaxed">
              Confirm this event as a violation or dismiss it if there&apos;s no integrity concern.
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={handleViolation}
                className={cn(
                  "flex h-11 items-center justify-center gap-2 rounded-2xl text-sm font-bold text-white transition-all shadow-[0_6px_16px_rgba(22,101,52,0.3),inset_0_2px_3px_rgba(255,255,255,0.4)]",
                  decisionState === "Flagged"
                    ? "bg-[#14532d] ring-2 ring-[#22c55e]"
                    : "bg-[#166534] hover:bg-[#15803d]"
                )}
              >
                <Check className="size-4" strokeWidth={3} />
                Mark as violation
              </button>

              <button
                onClick={handleDismiss}
                className={cn(
                  "flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#fca5a5] text-sm font-bold text-[#b91c1c] bg-white transition-all shadow-[0_4px_12px_rgba(239,68,68,0.15)]",
                  decisionState === "Cleared"
                    ? "bg-[#fef2f2] ring-2 ring-[#ef4444]"
                    : "hover:bg-[#fff5f5]"
                )}
              >
                <X className="size-4" strokeWidth={3} />
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Timeline Scrubber */}
      {events.length > 0 && (
        <ActivityTimeline
          events={events}
          totalDuration={totalDuration}
          activeEventId={item.id}
          onSelectEvent={onNavigate}
        />
      )}
    </div>
  )
}

export function Investigation(props: any) {
  return <EventDetail {...props} />
}
