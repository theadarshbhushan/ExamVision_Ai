"use client"

import React, { useState } from "react"
import { Search, Calendar, ChevronDown, Bell, Eye, Volume2, MonitorX, Users } from "lucide-react"
import { type ProctoringEvent, type EventStatus, type Severity } from "@/lib/examvision-data"
import { StatusPill, SeverityPill } from "./primitives"
import { cn } from "@/lib/utils"

export function InvestigationsList({
  events,
  onOpenEvent,
}: {
  events: ProctoringEvent[]
  onOpenEvent: (id: string) => void
}) {
  const [query, setQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState<"All" | "Pending" | "Critical" | "Reviewed">("All")
  const [currentPage, setCurrentPage] = useState(1)

  const filtered = events.filter((e) => {
    const q = query.toLowerCase()
    const matchesQuery =
      e.detection.toLowerCase().includes(q) ||
      e.exam.toLowerCase().includes(q) ||
      e.session.toLowerCase().includes(q) ||
      String(e.zone).toLowerCase().includes(q)

    if (!matchesQuery) return false

    if (activeFilter === "All") return true
    if (activeFilter === "Pending") return e.status === "Pending"
    if (activeFilter === "Critical") return e.severity === "Critical"
    if (activeFilter === "Reviewed") return e.status === "Reviewed" || e.status === "Flagged" || e.status === "Cleared"
    return true
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title Header matching investigationlist.png */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
          Investigations
        </h1>
      </div>

      {/* Main Periwinkle/Blue Clay Container matching investigationlist.png */}
      <div className="rounded-[32px] bg-gradient-to-br from-[#c8e2fb]/80 via-[#b6d7f8]/70 to-[#c2defa]/80 p-6 sm:p-8 shadow-[0_20px_45px_-10px_rgba(147,190,230,0.45),inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-3px_6px_rgba(130,175,220,0.3)]">
        {/* Filter Bar Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6">
          {/* Search bar */}
          <div className="relative min-w-[240px] flex-1 max-w-sm">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="clay-search-bar h-10 w-full bg-white/90 pl-4 pr-10 text-sm font-medium text-[var(--text-primary)] placeholder-[#8a9eb8] outline-none shadow-[inset_0_2px_4px_rgba(150,185,220,0.25)]"
            />
            <Search className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-[#8a9eb8]" />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {(["All", "Pending", "Critical", "Reviewed"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={cn(
                  "clay-btn-secondary px-5 py-2 text-xs font-semibold transition-all",
                  activeFilter === filter
                    ? "bg-white text-[#2563eb] shadow-[0_4px_12px_rgba(37,99,235,0.25),inset_0_2px_3px_rgba(255,255,255,1)]"
                    : "bg-white/70 text-[#475569] hover:bg-white"
                )}
              >
                {filter}
              </button>
            ))}

            {/* Date dropdown */}
            <button className="clay-btn-secondary flex items-center gap-2 bg-white/80 px-4 py-2 text-xs font-semibold text-[#475569]">
              <Calendar className="size-3.5 text-[#64748b]" />
              Date
              <ChevronDown className="size-3.5 text-[#64748b]" />
            </button>
          </div>
        </div>

        {/* Investigation Items List */}
        <div className="space-y-3.5">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => onOpenEvent(item.id)}
              className="group flex flex-col gap-4 rounded-2xl bg-white/95 p-3.5 sm:flex-row sm:items-center sm:justify-between shadow-[0_8px_20px_-4px_rgba(130,170,210,0.3),inset_0_2px_3px_rgba(255,255,255,0.95)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_-4px_rgba(110,160,210,0.4)] cursor-pointer"
            >
              {/* Left: Thumbnail + Title & Metadata */}
              <div className="flex items-center gap-4 min-w-0">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-slate-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
                  {item.thumbnail && item.thumbnail !== "/placeholder.svg" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.thumbnail}
                      alt={item.detection}
                      className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center bg-gradient-to-tr from-blue-100 to-indigo-100 text-blue-600">
                      <Eye className="size-6" />
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-[#0f1e36]">
                    <span className="font-bold">{item.detection}</span>
                    <span className="font-normal text-[#5a718d]">
                      {" "}
                      - {item.session}, {item.exam}, {item.timestamp}, {item.zone}, {item.confidence}% confidence
                    </span>
                  </p>
                </div>
              </div>

              {/* Right: Badges */}
              <div className="flex shrink-0 items-center gap-2.5 self-end sm:self-center">
                <SeverityPill severity={item.severity} className="px-4 py-1.5 text-xs font-semibold" />
                <StatusPill status={item.status} className="px-4 py-1.5 text-xs font-semibold" />
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="rounded-2xl bg-white/70 py-12 text-center text-[#5a718d]">
              No investigations match the selected filter.
            </div>
          )}
        </div>

        {/* Pagination matching investigationlist.png */}
        <div className="mt-8 flex items-center justify-center gap-2">
          {[1, 2, 3].map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={cn(
                "flex size-8 items-center justify-center rounded-lg text-xs font-bold transition-all",
                currentPage === page
                  ? "bg-white text-[#2563eb] shadow-[0_4px_10px_rgba(37,99,235,0.25),inset_0_2px_3px_rgba(255,255,255,0.9)]"
                  : "text-[#5a718d] hover:bg-white/50"
              )}
            >
              {page}
            </button>
          ))}
          <span className="px-1 text-xs text-[#5a718d]">...</span>
          <button
            onClick={() => setCurrentPage(8)}
            className="flex size-8 items-center justify-center rounded-lg text-xs font-bold text-[#5a718d] hover:bg-white/50"
          >
            8
          </button>
        </div>
      </div>
    </div>
  )
}
