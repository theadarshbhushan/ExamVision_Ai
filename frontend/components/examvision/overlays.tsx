"use client"
import { useEffect, useState } from "react"
import { Bell, Check, Command, Search, X } from "lucide-react"
import { ALERTS, EVENTS, type Screen } from "@/lib/examvision-data"

export function CommandPalette({
  open,
  events = [],
  onClose,
  onNavigate,
  onEvent,
}: {
  open: boolean
  events?: { id: string; zone: number; exam: string }[]
  onClose: () => void
  onNavigate: (s: Screen) => void
  onEvent: (id: string) => void
}) {
  const [query, setQuery] = useState("")
  const [active, setActive] = useState(0)
  const pages = [
    { label: "Dashboard", screen: "dashboard" },
    { label: "Upload", screen: "upload" },
    { label: "Alerts", screen: "alerts" },
    { label: "Reports", screen: "reports" },
  ] as const
  const matches = [
    ...pages.filter((x) => x.label.toLowerCase().includes(query.toLowerCase())),
    ...events
      .filter((x) => `Zone ${x.zone} ${x.exam} ${x.id}`.toLowerCase().includes(query.toLowerCase()))
      .map((x) => ({ label: `Zone ${x.zone} — ${x.exam}`, id: x.id })),
  ]

  useEffect(() => {
    if (!open) return
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setActive((a) => Math.min(a + 1, matches.length - 1))
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setActive((a) => Math.max(a - 1, 0))
      }
      if (e.key === "Enter" && matches[active]) {
        const item = matches[active]
        if ("id" in item) {
          onEvent(item.id)
        } else {
          onNavigate(item.screen)
        }
        onClose()
      }
    }
    window.addEventListener("keydown", key)
    return () => window.removeEventListener("keydown", key)
  }, [open, active, matches, onClose, onEvent, onNavigate])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/20 p-4 pt-[15vh] backdrop-blur-sm" onMouseDown={onClose}>
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="size-5 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActive(0)
            }}
            placeholder="Search pages, students, sessions…"
            className="h-14 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">esc</kbd>
        </div>
        <div className="p-2">
          <p className="px-2 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {query ? "Results" : "Navigation"}
          </p>
          {matches.slice(0, 6).map((item, i) => (
            <button
              key={item.label}
              onClick={() => {
                if ("id" in item) {
                  onEvent(item.id)
                } else {
                  onNavigate(item.screen)
                }
                onClose()
              }}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition ${i === active ? "bg-primary/15 text-primary font-medium" : "text-foreground hover:bg-muted"}`}
            >
              <Command className="size-4" />
              {item.label}
            </button>
          ))}
          {matches.length === 0 && (
            <p className="py-6 text-center text-xs text-muted-foreground">No matches found</p>
          )}
        </div>
      </div>
    </div>
  )
}

export function NotificationDrawer({
  open,
  isDemo = true,
  onClose,
}: {
  open: boolean
  isDemo?: boolean
  onClose: () => void
}) {
  const [read, setRead] = useState<string[]>([])
  if (!open) return null
  const alertList = isDemo ? ALERTS : []

  return (
    <div className="fixed inset-0 z-40 bg-slate-900/10 backdrop-blur-xs" onMouseDown={onClose}>
      <aside className="absolute right-0 top-0 h-full w-full max-w-sm border-l border-border bg-card p-6 shadow-xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
            <p className="text-sm text-muted-foreground">Keep up with your review queue.</p>
          </div>
          <button aria-label="Close notifications" onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        {alertList.length > 0 ? (
          ["Today", "Yesterday"].map((day, di) => (
            <section key={day} className="mt-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{day}</p>
              {alertList.slice(di ? 3 : 0, di ? 5 : 3).map((a) => (
                <div
                  key={a.id}
                  className={`relative mb-2 rounded-xl p-3 border border-border ${read.includes(a.id) ? "bg-card opacity-70" : "border-l-2 border-l-primary bg-primary/5"}`}
                >
                  <Bell className="absolute right-3 top-3 size-4 text-primary" />
                  <p className="pr-6 text-sm font-medium text-foreground">{a.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{a.timestamp}</p>
                  <button onClick={() => setRead((r) => [...r, a.id])} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                    <Check className="size-3" />
                    Mark read
                  </button>
                </div>
              ))}
            </section>
          ))
        ) : (
          <div className="py-16 text-center text-sm text-muted-foreground">
            <Bell className="mx-auto size-8 text-muted-foreground/40 mb-2" />
            <p className="font-medium text-foreground">All caught up</p>
            <p className="text-xs text-muted-foreground mt-1">No pending notifications for this account.</p>
          </div>
        )}
      </aside>
    </div>
  )
}
