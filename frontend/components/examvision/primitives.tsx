import { ScanEye } from "lucide-react"
import { cn } from "@/lib/utils"
import type { EventStatus, Severity } from "@/lib/examvision-data"

export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string
  showWordmark?: boolean
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <ScanEye className="size-4.5" strokeWidth={2.25} />
      </span>
      {showWordmark && (
        <span className="text-[15px] font-semibold tracking-tight text-foreground">
          ExamVision<span className="text-primary"> AI</span>
        </span>
      )}
    </div>
  )
}

const statusStyles: Record<EventStatus, string> = {
  Pending: "bg-warning/15 text-warning-foreground ring-warning/25",
  Flagged: "bg-destructive/10 text-destructive ring-destructive/20",
  Cleared: "bg-success/12 text-success ring-success/25",
}

const severityStyles: Record<Severity, string> = {
  Critical: "bg-destructive/10 text-destructive ring-destructive/20",
  Medium: "bg-warning/15 text-warning-foreground ring-warning/25",
  Low: "bg-secondary text-muted-foreground ring-border",
}

export function StatusPill({ status }: { status: EventStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        statusStyles[status],
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  )
}

export function SeverityPill({ severity }: { severity: Severity }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        severityStyles[severity],
      )}
    >
      {severity}
    </span>
  )
}
