"use client"
import { useEffect, useRef, useState } from "react"
import { Bell, ChevronLeft, FileText, FolderSearch, LayoutDashboard, LogOut, Moon, Radio, Repeat2, Search, Sun, Upload, Users } from "lucide-react"
import type { Screen } from "@/lib/examvision-data"
import { Logo } from "./primitives"
import { CommandPalette, NotificationDrawer } from "./overlays"
import { cn } from "@/lib/utils"

type NavKey = "dashboard" | "upload" | "investigations" | "live" | "students" | "alerts" | "reports"
const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, screen: "dashboard" }, { key: "upload", label: "Upload", icon: Upload, screen: "upload" },
  { key: "investigations", label: "Investigations", icon: FolderSearch, screen: "investigation" }, { key: "live", label: "Live monitoring", icon: Radio, screen: "live" },
  { key: "students", label: "Student trends", icon: Users, screen: "students" }, { key: "alerts", label: "Alerts", icon: Bell, screen: "alerts" }, { key: "reports", label: "Reports", icon: FileText, screen: "reports" },
] as const

const ACCOUNTS = [
  { name: "Lena Sørensen", email: "lena@university.edu", initials: "LS" },
  { name: "Ravi Patel", email: "ravi@university.edu", initials: "RP" },
  { name: "Maya Chen", email: "maya@university.edu", initials: "MC" },
]

function UserMenu({ onSignOut }: { onSignOut: () => void }) {
  const [open, setOpen] = useState(false), [switching, setSwitching] = useState(false), [account, setAccount] = useState(ACCOUNTS[0]), [confirm, setConfirm] = useState(false), [active, setActive] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const outside = (event: MouseEvent) => { if (!menuRef.current?.contains(event.target as Node)) setOpen(false) }
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
      if (event.key === "ArrowDown") { event.preventDefault(); setActive(i => Math.min(i + 1, switching ? ACCOUNTS.length - 1 : 1)) }
      if (event.key === "ArrowUp") { event.preventDefault(); setActive(i => Math.max(i - 1, 0)) }
      if (event.key === "Enter") { event.preventDefault(); if (switching) { setAccount(ACCOUNTS[active]); setSwitching(false); setOpen(false) } else if (active === 0) setSwitching(true); else { setConfirm(true); setTimeout(onSignOut, 700) } }
    }
    document.addEventListener("mousedown", outside); document.addEventListener("keydown", key)
    return () => { document.removeEventListener("mousedown", outside); document.removeEventListener("keydown", key) }
  }, [open, switching, active, onSignOut])
  return <div ref={menuRef} className="relative"><button onClick={() => { setOpen(v => !v); setSwitching(false); setActive(0) }} aria-label="Open user menu" aria-expanded={open} className="flex size-9 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary transition hover:scale-105 focus:ring-3 focus:ring-ring/20">{account.initials}</button>{open && <div className="absolute right-0 top-12 w-72 overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-sm" role="menu" aria-label="User account menu">{confirm ? <div className="px-4 py-5 text-center text-sm font-medium text-destructive">Logging you out…</div> : switching ? <><button onClick={() => setSwitching(false)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground hover:bg-muted"><ChevronLeft className="size-4"/>Accounts</button><div className="my-1 border-t border-border"/>{ACCOUNTS.map((item, index) => <button key={item.email} role="menuitem" onClick={() => { setAccount(item); setSwitching(false); setOpen(false) }} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-muted ${active === index ? "bg-muted" : ""}`}><span className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">{item.initials}</span><span><span className="block text-sm font-medium text-foreground">{item.name}</span><span className="block text-xs text-muted-foreground">{item.email}</span></span></button>)}</> : <><div className="flex items-center gap-3 px-3 py-3"><span className="flex size-9 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">{account.initials}</span><span><span className="block text-sm font-semibold text-foreground">{account.name}</span><span className="block text-xs text-muted-foreground">{account.email}</span></span></div><div className="my-1 border-t border-border"/><button role="menuitem" onClick={() => setSwitching(true)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-muted ${active === 0 ? "bg-muted" : ""}`}><Repeat2 className="size-4 text-muted-foreground"/>Switch account</button><div className="my-1 border-t border-border"/><button role="menuitem" onClick={() => { setConfirm(true); setTimeout(onSignOut, 700) }} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 ${active === 1 ? "bg-destructive/10" : ""}`}><LogOut className="size-4"/>Log out</button></>}</div>}</div>
}

export function AppShell({ active, onNavigate, onSignOut, alertCount, onOpenEvent, children }: { active: NavKey; onNavigate: (screen: Screen) => void; onSignOut: () => void; alertCount: number; onOpenEvent: (id: string) => void; children: React.ReactNode }) {
  const [palette, setPalette] = useState(false), [notifications, setNotifications] = useState(false), [dark, setDark] = useState(true)
  useEffect(() => { const key = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPalette(true) } }; window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key) }, [])
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
  }, [dark])
  return <div className="min-h-screen bg-background transition-colors duration-300">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-sidebar lg:flex"><div className="flex h-16 items-center px-5"><button onClick={() => onNavigate("landing")} aria-label="Go to homepage" className="rounded-lg transition duration-200 hover:scale-[1.02] hover:opacity-80 focus:ring-3 focus:ring-ring/20"><Logo/></button></div><nav className="flex flex-1 flex-col gap-1 px-3 py-4"><p className="px-3 pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Workspace</p>{NAV.map(item => <button key={item.key} onClick={() => onNavigate(item.screen)} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all hover:bg-muted", active === item.key ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground")}><item.icon className="size-4.5"/>{item.label}{item.key === "alerts" && <span className="ml-auto rounded-full bg-primary/15 px-1.5 text-xs text-primary">{alertCount}</span>}</button>)}</nav><div className="border-t border-border p-3"><button onClick={() => setDark(d => !d)} className="mb-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-muted" aria-label="Toggle theme">{dark ? <Sun className="size-4"/> : <Moon className="size-4"/>}{dark ? "Light mode" : "Dark mode"}</button><div className="flex items-center gap-3 rounded-lg px-3 py-2"><span className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">LS</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">Lena Sørensen</p><p className="truncate text-xs text-muted-foreground">Integrity Reviewer</p></div><button onClick={onSignOut} aria-label="Sign out" className="text-muted-foreground hover:text-foreground"><LogOut className="size-4"/></button></div></div></aside>
    <div className="lg:pl-60"><header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-background/95 px-6 backdrop-blur"><div className="lg:hidden"><Logo showWordmark={false}/></div><div className="relative max-w-md flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><button onClick={() => setPalette(true)} className="h-9 w-full rounded-lg bg-muted pl-9 pr-3 text-left text-sm text-muted-foreground focus:ring-3 focus:ring-ring/20">Search sessions, students, exams… <kbd className="float-right hidden rounded border border-border px-1 text-[10px] sm:inline">⌘K</kbd></button></div><div className="ml-auto flex items-center gap-2"><button onClick={() => setNotifications(true)} aria-label="Notifications" className="relative flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground shadow-sm hover:text-foreground"><Bell className="size-4.5"/><span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-accent text-[10px] text-accent-foreground">{alertCount}</span></button><UserMenu onSignOut={onSignOut}/></div></header><main className="mx-auto max-w-6xl px-6 py-8">{children}</main></div>
    <CommandPalette open={palette} onClose={() => setPalette(false)} onNavigate={onNavigate} onEvent={onOpenEvent}/><NotificationDrawer open={notifications} onClose={() => setNotifications(false)}/>
  </div>
}
