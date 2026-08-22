"use client"

import React, { useEffect, useRef, useState } from "react"
import {
  LayoutDashboard,
  Upload,
  Search,
  Bell,
  FileText,
  Settings as SettingsIcon,
  Sun,
  Moon,
  LogOut,
  ChevronDown,
  User as UserIcon,
  Sparkles,
} from "lucide-react"
import { type Screen } from "@/lib/examvision-data"
import { Logo } from "./primitives"
import { cn } from "@/lib/utils"
import type { User } from "@/lib/api-client"

type NavKey = "dashboard" | "upload" | "investigations" | "alerts" | "reports" | "settings"

type NavItem = {
  key: NavKey
  label: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  screen: Screen
  badge?: number
}

const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, screen: "dashboard" },
  { key: "upload", label: "Upload", icon: Upload, screen: "upload" },
  { key: "investigations", label: "Investigations", icon: Search, screen: "investigations" },
  { key: "alerts", label: "Alerts", icon: Bell, screen: "alerts", badge: 5 },
  { key: "reports", label: "Reports", icon: FileText, screen: "reports" },
  { key: "settings", label: "Settings", icon: SettingsIcon, screen: "settings" },
]

export function AppShell({
  active,
  currentUser,
  onNavigate,
  onSignOut,
  alertCount = 5,
  onOpenEvent,
  children,
}: {
  active: NavKey
  currentUser?: User | null
  onNavigate: (screen: Screen) => void
  onSignOut: () => void
  alertCount?: number
  onOpenEvent: (id: string) => void
  children: React.ReactNode
}) {
  const [dark, setDark] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
  }, [dark])

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleOutside)
    return () => document.removeEventListener("mousedown", handleOutside)
  }, [])

  const initials = currentUser?.full_name
    ? currentUser.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "LR"

  return (
    <div className="flex min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors duration-300">
      {/* Left Sidebar matching Stitch designs */}
      <aside
        className={cn(
          "sticky top-0 z-30 hidden h-screen w-64 shrink-0 flex-col justify-between p-6 lg:flex",
          active === "investigations"
            ? "clay-card-mint border-r border-teal-100/40"
            : "bg-transparent"
        )}
      >
        <div className="space-y-8">
          {/* Logo */}
          <button
            onClick={() => onNavigate("dashboard")}
            className="text-left transition-transform hover:scale-[1.02]"
          >
            <Logo variant={active === "investigations" ? "mint" : "blue"} />
          </button>

          {/* Navigation Links */}
          <nav className="space-y-2">
            {NAV_ITEMS.map((item) => {
              const isActive = active === item.key
              return (
                <button
                  key={item.key}
                  onClick={() => onNavigate(item.screen as Screen)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 cursor-pointer",
                    isActive
                      ? "clay-nav-active"
                      : "text-[var(--text-secondary)] hover:bg-white/60 hover:text-[var(--text-primary)]"
                  )}
                >
                  <span className="flex items-center gap-3.5">
                    <item.icon className="size-5" strokeWidth={2.2} />
                    {item.label}
                  </span>

                  {item.badge ? (
                    <span className="flex size-5 items-center justify-center rounded-full bg-[#ef4444] text-[10px] font-bold text-white shadow-sm">
                      {alertCount}
                    </span>
                  ) : null}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Bottom of Sidebar: Theme Toggle & User Info */}
        <div className="space-y-4 pt-6 border-t border-[var(--text-muted)]/15">
          {/* Theme Toggle Pill Switch */}
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-2">
              {dark ? <Moon className="size-4 text-[#60a5fa]" /> : <Sun className="size-4 text-[#f59e0b]" />}
              {dark ? "Dark mode" : "Light mode"}
            </span>

            <button
              onClick={() => setDark(!dark)}
              aria-label="Toggle dark mode"
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                dark ? "bg-[#2563eb]" : "bg-[#cbd5e1]"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                  dark ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>

          {/* User Profile Card */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="clay-btn-secondary flex w-full items-center justify-between p-2.5 hover:bg-white transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#dbeafe] text-xs font-black text-[#2563eb] shadow-inner">
                  {initials}
                </span>
                <div className="text-left min-w-0">
                  <p className="truncate text-xs font-bold text-[var(--text-primary)]">
                    {currentUser?.full_name || "Lead Reviewer"}
                  </p>
                  <p className="truncate text-[10px] text-[var(--text-secondary)]">
                    {currentUser?.role || "Reviewer"}
                  </p>
                </div>
              </div>
              <ChevronDown className="size-4 text-[var(--text-muted)] shrink-0" />
            </button>

            {userMenuOpen && (
              <div className="clay-card absolute bottom-14 left-0 right-0 z-50 p-2 text-xs font-semibold bg-white/95 animate-fade-in shadow-xl">
                <div className="p-2 border-b border-[var(--bg-app)]">
                  <p className="text-[var(--text-primary)] truncate">{currentUser?.email || "reviewer@examvision.ai"}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">Active Workspace: University Hall</p>
                </div>
                <button
                  onClick={onSignOut}
                  className="flex w-full items-center gap-2 rounded-xl p-2 text-[#ef4444] hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <LogOut className="size-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top Header Bar matching Stitch designs */}
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between gap-6 px-6 sm:px-10">
          {/* Search Bar matching Stitch reference */}
          <div className="relative max-w-lg flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sessions, students, exams..."
              className="clay-search-bar h-11 w-full pl-11 pr-12 text-xs font-medium text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-all focus:ring-2 focus:ring-[#3b82f6]/40"
            />
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--text-muted)]" />
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3.5">
            {/* Notification Bell */}
            <button
              onClick={() => onNavigate("alerts")}
              className="relative flex size-11 items-center justify-center rounded-full bg-white/90 text-[var(--text-secondary)] shadow-[0_4px_12px_rgba(140,170,205,0.3),inset_0_1.5px_2px_rgba(255,255,255,0.9)] transition-transform hover:scale-105 cursor-pointer"
            >
              <Bell className="size-5" />
              {alertCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-[#ef4444] text-[9px] font-bold text-white shadow-sm">
                  {alertCount}
                </span>
              )}
            </button>

            {/* User Avatar Circle */}
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex size-11 items-center justify-center rounded-full bg-[#dbeafe] text-sm font-black text-[#2563eb] shadow-[0_4px_12px_rgba(37,99,235,0.25),inset_0_1.5px_2px_rgba(255,255,255,0.9)] transition-transform hover:scale-105 cursor-pointer"
            >
              {initials}
            </button>
          </div>
        </header>

        {/* Page Content View */}
        <main className="flex-1 overflow-y-auto px-6 pb-12 sm:px-10">
          {children}
        </main>
      </div>
    </div>
  )
}
