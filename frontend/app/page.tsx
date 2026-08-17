"use client"

import { useMemo, useState } from "react"
import {
  EVENTS,
  ALERTS,
  type Screen,
  type ProctoringEvent,
} from "@/lib/examvision-data"
import { Landing } from "@/components/examvision/landing"
import { AppShell } from "@/components/examvision/app-shell"
import { Dashboard } from "@/components/examvision/dashboard"
import { UploadScreen } from "@/components/examvision/upload"
import { Processing } from "@/components/examvision/processing"
import { EventDetail } from "@/components/examvision/event-detail"
import { Alerts } from "@/components/examvision/alerts"
import { Reports } from "@/components/examvision/reports"
import { LiveMonitoring } from "@/components/examvision/live-monitoring"
import { StudentTrends } from "@/components/examvision/student-trends"
import { Investigation } from "@/components/examvision/investigation"

type NavKey = "dashboard" | "upload" | "investigations" | "live" | "students" | "alerts" | "reports"

const SCREEN_TO_NAV: Record<Screen, NavKey> = {
  landing: "dashboard",
  dashboard: "dashboard",
  upload: "upload",
  processing: "upload",
  "event-detail": "dashboard",
  investigation: "investigations",
  live: "live",
  students: "students",
  alerts: "alerts",
  reports: "reports",
}

export default function Page() {
  const [screen, setScreen] = useState<Screen>("landing")
  const [events, setEvents] = useState<ProctoringEvent[]>(EVENTS)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selectedEvent = useMemo(
    () => events.find((e) => e.id === selectedId) ?? null,
    [events, selectedId],
  )

  function openEvent(id: string) {
    setSelectedId(id)
    setScreen("investigation")
  }

  function decideEvent(id: string, status: "Flagged" | "Cleared") {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, status, reviewer: e.reviewer === "Unassigned" ? "L. Sørensen" : e.reviewer }
          : e,
      ),
    )
    setTimeout(() => setScreen("dashboard"), 400)
  }

  if (screen === "landing") {
    return (
      <Landing
        onLogin={() => setScreen("dashboard")}
        onGetStarted={() => setScreen("dashboard")}
      />
    )
  }

  if (screen === "processing") {
    return <Processing onComplete={() => setScreen("dashboard")} />
  }

  return (
    <AppShell
      active={SCREEN_TO_NAV[screen]}
      onNavigate={setScreen}
      onSignOut={() => setScreen("landing")}
      alertCount={ALERTS.length}
      onOpenEvent={openEvent}
    >
      {screen === "dashboard" && (
        <Dashboard
          events={events}
          onOpenEvent={openEvent}
          onUpload={() => setScreen("upload")}
        />
      )}
      {screen === "upload" && (
        <UploadScreen onStart={() => setScreen("processing")} />
      )}
      {screen === "event-detail" && selectedEvent && (
        <EventDetail
          event={selectedEvent}
          onBack={() => setScreen("dashboard")}
          onViolation={(id) => decideEvent(id, "Flagged")}
          onDismiss={(id) => decideEvent(id, "Cleared")}
        />
      )}
      {screen === "investigation" && (
        <Investigation event={selectedEvent} onBack={() => setScreen("dashboard")} onDecide={decideEvent} />
      )}
      {screen === "live" && <LiveMonitoring onOpen={openEvent} />}
      {screen === "students" && <StudentTrends />}
      {screen === "event-detail" && !selectedEvent && (
        <Dashboard
          events={events}
          onOpenEvent={openEvent}
          onUpload={() => setScreen("upload")}
        />
      )}
      {screen === "alerts" && <Alerts />}
      {screen === "reports" && <Reports />}
    </AppShell>
  )
}
