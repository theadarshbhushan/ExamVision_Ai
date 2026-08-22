"use client"

import React, { useState } from "react"
import {
  FileText,
  Users,
  Flag,
  Search,
  Download,
  FileCode,
  FileCheck,
  Check,
} from "lucide-react"
import { REPORTS, type Report, type ProctoringEvent } from "@/lib/examvision-data"
import { StatusPill } from "./primitives"
import { cn } from "@/lib/utils"

export function Reports({
  events = [],
  isDemo = true,
}: {
  events?: ProctoringEvent[]
  isDemo?: boolean
}) {
  const [query, setQuery] = useState("")
  const [downloadedReport, setDownloadedReport] = useState<string | null>(null)

  const flaggedEvents = events.filter((e) => e.status === "Flagged")
  const sessionIds = Array.from(new Set(events.map((e) => e.session)))

  // Dynamically generate audit reports from active session events
  const dynamicReports: Report[] = sessionIds.map((sid) => {
    const sessionEvents = events.filter((e) => e.session === sid)
    const sessionFlags = sessionEvents.filter((e) => e.status === "Flagged").length
    const examName = sessionEvents[0]?.exam || "Proctored Exam Session"
    const shortId = sid.startsWith("SES-") ? sid : `REP-${sid.slice(0, 6).toUpperCase()}`

    return {
      id: shortId,
      name: `${examName} — Integrity Audit Report`,
      exam: examName,
      candidates: 1,
      flags: sessionFlags,
      generated: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      status: "Ready" as const,
      format: "CSV" as const,
    }
  })

  let rawReports: Report[] = []
  if (isDemo) {
    const demoMap = new Map<string, Report>()
    REPORTS.forEach((r) => demoMap.set(r.exam, { ...r }))
    dynamicReports.forEach((dr) => {
      if (demoMap.has(dr.exam)) {
        const existing = demoMap.get(dr.exam)!
        demoMap.set(dr.exam, { ...existing, flags: existing.flags + dr.flags })
      } else {
        demoMap.set(dr.exam, dr)
      }
    })
    rawReports = Array.from(demoMap.values())
  } else {
    rawReports = dynamicReports
  }

  const totalFlagsCount = isDemo
    ? 486 + flaggedEvents.filter((e) => !e.session.startsWith("SES-")).length
    : flaggedEvents.length

  const candidatesCount = isDemo
    ? "12,904"
    : sessionIds.length.toString()

  const reportsCount = rawReports.length.toString()

  const filtered = rawReports.filter((r) => {
    const q = query.toLowerCase()
    return (
      r.name.toLowerCase().includes(q) ||
      r.exam.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q)
    )
  })

  function handleDownload(report: Report) {
    const matchingEvents = events.filter((e) => e.exam === report.exam || e.session === report.id)
    const reportEvents = matchingEvents.length > 0 ? matchingEvents : events
    const flagged = reportEvents.filter((e) => e.status === "Flagged")

    const reportText = [
      `=============================================================`,
      `EXAMVISION AI — INTEGRITY AUDIT REPORT`,
      `=============================================================`,
      `Report Name: ${report.name}`,
      `Exam: ${report.exam}`,
      `Candidates Covered: ${report.candidates}`,
      `Total Confirmed Flags: ${report.flags}`,
      `Generated Date: ${report.generated}`,
      `Status: ${report.status}`,
      `Format: ${report.format}`,
      `-------------------------------------------------------------`,
      `FLAGGED VIOLATIONS SUMMARY:`,
      flagged.length === 0
        ? "No violations flagged for this session."
        : flagged
            .map(
              (f, i) =>
                `#${i + 1} [${f.id}] Zone ${f.zone} | ${f.detection} | Conf: ${f.confidence}% | Time: ${f.timestamp} | Status: ${f.status} | Reviewer: ${f.reviewer}\n    Notes: ${f.notes}`
            )
            .join("\n\n"),
      `=============================================================`,
    ].join("\n")

    const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${report.name.replace(/[^a-zA-Z0-9]/g, "_")}_Audit_Report.${report.format.toLowerCase()}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    setDownloadedReport(report.id)
    setTimeout(() => setDownloadedReport(null), 2500)
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Title matching reports.png */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
          Reports
        </h1>
      </div>

      {/* 3 Top Summary Stat Cards matching reports.png */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {/* Card 1: Reports generated */}
        <div className="clay-card flex items-center justify-between p-6 bg-white/95">
          <div>
            <p className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
              {reportsCount}
            </p>
            <p className="mt-1 text-xs font-semibold text-[var(--text-secondary)]">
              Reports generated
            </p>
          </div>
          <span className="flex size-14 items-center justify-center rounded-2xl bg-[#ebf6fa] text-[#0284c7] shadow-[0_4px_12px_rgba(2,132,199,0.2),inset_0_1.5px_2px_rgba(255,255,255,0.9)]">
            <FileText className="size-7" strokeWidth={2.2} />
          </span>
        </div>

        {/* Card 2: Candidates covered */}
        <div className="clay-card flex items-center justify-between p-6 bg-white/95">
          <div>
            <p className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
              {candidatesCount}
            </p>
            <p className="mt-1 text-xs font-semibold text-[var(--text-secondary)]">
              Candidates covered
            </p>
          </div>
          <span className="flex size-14 items-center justify-center rounded-2xl bg-[#ebf6fa] text-[#0284c7] shadow-[0_4px_12px_rgba(2,132,199,0.2),inset_0_1.5px_2px_rgba(255,255,255,0.9)]">
            <Users className="size-7" strokeWidth={2.2} />
          </span>
        </div>

        {/* Card 3: Total flags */}
        <div className="clay-card flex items-center justify-between p-6 bg-white/95">
          <div>
            <p className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
              {totalFlagsCount}
            </p>
            <p className="mt-1 text-xs font-semibold text-[var(--text-secondary)]">
              Total flags
            </p>
          </div>
          <span className="flex size-14 items-center justify-center rounded-2xl bg-[#ebf6fa] text-[#0284c7] shadow-[0_4px_12px_rgba(2,132,199,0.2),inset_0_1.5px_2px_rgba(255,255,255,0.9)]">
            <Flag className="size-7" strokeWidth={2.2} />
          </span>
        </div>
      </div>

      {/* Main Reports Table Card matching reports.png */}
      <div className="clay-card p-7 bg-white/95">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--bg-app)] pb-5">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            All reports
          </h2>

          <div className="relative min-w-[240px] max-w-sm">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search reports..."
              className="clay-search-bar h-9 w-full bg-[var(--bg-card-inset)] pl-4 pr-10 text-xs font-medium text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none"
            />
            <Search className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--text-muted)]" />
          </div>
        </div>

        {/* Table Rows */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--bg-app)] text-xs font-semibold text-[var(--text-secondary)]">
                <th className="pb-3 pt-2">Report Name</th>
                <th className="pb-3 pt-2">Exam</th>
                <th className="pb-3 pt-2">Candidates</th>
                <th className="pb-3 pt-2">Flags</th>
                <th className="pb-3 pt-2">Generated Date</th>
                <th className="pb-3 pt-2">Status</th>
                <th className="pb-3 pt-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--bg-app)]">
              {filtered.map((report) => (
                <tr
                  key={report.id}
                  className="group transition-colors hover:bg-[var(--bg-card-secondary)]"
                >
                  <td className="py-4 font-semibold text-[var(--text-primary)]">
                    {report.name}
                  </td>
                  <td className="py-4 text-xs font-medium text-[var(--text-secondary)]">
                    {report.exam}
                  </td>
                  <td className="py-4 font-semibold text-[var(--text-primary)]">
                    {report.candidates.toLocaleString()}
                  </td>
                  <td className="py-4 font-semibold text-[var(--text-primary)]">
                    {report.flags}
                  </td>
                  <td className="py-4 text-xs font-medium text-[var(--text-secondary)]">
                    {report.generated}
                  </td>
                  <td className="py-4">
                    <span className="clay-pill-mint px-3.5 py-1 text-xs font-bold">
                      {report.status}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleDownload(report)}
                        title="Download Report"
                        className="clay-btn-secondary flex size-8 items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      >
                        {downloadedReport === report.id ? (
                          <Check className="size-3.5 text-[#10b981]" />
                        ) : (
                          <Download className="size-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDownload(report)}
                        className="clay-btn-secondary px-3 py-1 text-[11px] font-bold text-[var(--text-secondary)] uppercase"
                      >
                        {report.format}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
