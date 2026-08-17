import { cn } from "@/lib/utils"
import type { Severity } from "@/lib/examvision-data"

export function TrendBadge({ children, down = false }: { children: React.ReactNode; down?: boolean }) {
  return <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", down ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600")}>{children}</span>
}

export function SeverityPill({ severity }: { severity: Severity }) {
  const style = severity === "Critical" ? "bg-red-100 text-red-600" : severity === "Medium" ? "bg-amber-100 text-amber-700" : "bg-blue-50 text-blue-600"
  return <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", style)}>{severity}</span>
}

export function Sparkline({ points }: { points: number[] }) {
  const max = Math.max(...points), min = Math.min(...points), width = 100, height = 28
  const path = points.map((p, i) => `${i ? "L" : "M"}${(i / (points.length - 1)) * width},${height - ((p - min) / Math.max(1, max - min)) * 20 - 4}`).join(" ")
  return <svg viewBox="0 0 100 28" className="h-8 w-24 overflow-visible" aria-label="Integrity score trend"><path d={path} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

export function Avatar({ initials, className }: { initials: string; className?: string }) {
  return <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-700", className)}>{initials}</span>
}
