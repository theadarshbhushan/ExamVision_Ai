"use client"

import React from "react"
import { Eye, Shield, CheckCircle, AlertTriangle, Clock, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { EventStatus, Severity } from "@/lib/examvision-data"

export function Logo({
  className,
  showWordmark = true,
  variant = "blue",
}: {
  className?: string
  showWordmark?: boolean
  variant?: "blue" | "mint" | "gradient"
}) {
  return (
    <div className={cn("flex items-center gap-2.5 select-none", className)}>
      <span
        className={cn(
          "flex size-9 items-center justify-center rounded-2xl shadow-[0_4px_12px_rgba(59,130,246,0.3),inset_0_2px_3px_rgba(255,255,255,0.7),inset_0_-2px_3px_rgba(0,0,0,0.1)] transition-transform hover:scale-105",
          variant === "mint"
            ? "bg-gradient-to-tr from-[#10b981] via-[#06b6d4] to-[#3b82f6] text-white"
            : "bg-gradient-to-tr from-[#3b82f6] via-[#0ea5e9] to-[#2dd4bf] text-white"
        )}
      >
        <Eye className="size-5 drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)]" strokeWidth={2.5} />
      </span>
      {showWordmark && (
        <span className="text-[17px] font-bold tracking-tight text-[var(--text-primary)]">
          ExamVision <span className="text-[#3b82f6]">AI</span>
        </span>
      )}
    </div>
  )
}

export function StatusPill({ status, className }: { status: EventStatus; className?: string }) {
  const getStyle = () => {
    switch (status) {
      case "Pending":
        return "clay-pill-amber"
      case "Flagged":
        return "clay-pill-coral"
      case "Cleared":
        return "clay-pill-mint"
      default:
        return "clay-pill-blue"
    }
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full px-3.5 py-1 text-xs font-semibold tracking-wide transition-transform hover:scale-105",
        getStyle(),
        className
      )}
    >
      {status}
    </span>
  )
}

export function SeverityPill({ severity, className }: { severity: Severity; className?: string }) {
  const getStyle = () => {
    switch (severity) {
      case "Critical":
        return "clay-pill-coral"
      case "Medium":
        return "clay-pill-mint"
      case "Low":
        return "clay-pill-blue"
      default:
        return "clay-pill-white"
    }
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full px-3.5 py-1 text-xs font-semibold tracking-wide transition-transform hover:scale-105",
        getStyle(),
        className
      )}
    >
      {severity}
    </span>
  )
}

export function ClayCard({
  children,
  className,
  variant = "default",
  onClick,
}: {
  children: React.ReactNode
  className?: string
  variant?: "default" | "mint" | "recessed"
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        variant === "mint"
          ? "clay-card-mint"
          : variant === "recessed"
            ? "clay-card-recessed"
            : "clay-card",
        "p-6",
        onClick && "cursor-pointer transition-transform hover:-translate-y-0.5",
        className
      )}
    >
      {children}
    </div>
  )
}
