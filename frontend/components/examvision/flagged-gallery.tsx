"use client"

import { useState } from "react"
import { type ProctoringEvent } from "@/lib/examvision-data"
import { AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

function FlaggedCard({ event, onClick }: { event: ProctoringEvent; onClick: () => void }) {
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null)

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget
    setDimensions({ width: naturalWidth, height: naturalHeight })
  }

  const box = event.boundingBox
  const hasGlow = box && dimensions

  // Compute percentage coordinates for absolutely positioned overlay
  let left = 0, top = 0, width = 0, height = 0
  if (hasGlow) {
    const [x1, y1, x2, y2] = box
    left = (x1 / dimensions.width) * 100
    top = (y1 / dimensions.height) * 100
    width = ((x2 - x1) / dimensions.width) * 100
    height = ((y2 - y1) / dimensions.height) * 100
  }

  // Determine glow color mapping based on severity
  const rgbColor = event.severity === "Critical" 
    ? "239, 68, 68" // red-500
    : event.severity === "Medium"
      ? "245, 158, 11" // amber-500
      : "59, 130, 246" // blue-500

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-xl border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
    >
      {/* Relative wrapper containing the image and the absolute overlay glow */}
      <div className="relative overflow-hidden rounded-lg bg-slate-900 aspect-video select-none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={event.thumbnail}
          alt={event.detection}
          onLoad={handleImageLoad}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Glow overlay */}
        {hasGlow && (
          <div
            className="absolute rounded border border-white/20 transition-all duration-300"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: `${width}%`,
              height: `${height}%`,
              transform: 'scale(1.25)', // scales the glow so it surrounds the red bounding box
              boxShadow: `0 0 20px 6px rgba(${rgbColor}, 0.65), inset 0 0 10px 2px rgba(${rgbColor}, 0.45)`,
              background: `radial-gradient(circle, rgba(${rgbColor}, 0.25) 0%, rgba(${rgbColor}, 0) 70%)`
            }}
          />
        )}
      </div>

      {/* Caption details below image */}
      <div className="mt-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-foreground uppercase tracking-wide">
            {event.detection}
          </p>
          <span className="text-xs font-medium tabular-nums text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded">
            Zone {event.zone}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>Confidence: <strong className="font-semibold text-foreground">{event.confidence}%</strong></span>
          <span className="font-mono">{event.timestamp}</span>
        </div>
      </div>
    </div>
  )
}

export function FlaggedGallery({
  events,
  onOpenEvent,
}: {
  events: ProctoringEvent[]
  onOpenEvent: (id: string) => void
}) {
  // Filters to only those with a non-null boundingBox (real classifications)
  const flaggedEvents = events.filter((e) => e.boundingBox != null)

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <AlertTriangle className="text-destructive size-5 animate-pulse" />
          Flagged Detections Gallery
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Annotated snapshots of AI-classified cheating indicators with heat-glow highlights.
        </p>
      </div>

      {flaggedEvents.length === 0 ? (
        <div className="flex h-36 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-secondary/5 text-center p-4">
          <p className="text-sm font-medium text-muted-foreground">No flagged detections in this session</p>
          <p className="text-xs text-muted-foreground mt-1">Suspected cheating incidents (phones/chits) will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {flaggedEvents.map((e) => (
            <FlaggedCard key={e.id} event={e} onClick={() => onOpenEvent(e.id)} />
          ))}
        </div>
      )}
    </div>
  )
}
