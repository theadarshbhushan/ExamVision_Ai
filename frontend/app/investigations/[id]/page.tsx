"use client"

import { useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { AppShell } from "@/components/examvision/app-shell"
import { EventDetail } from "@/components/examvision/event-detail"
import { ALERTS, EVENTS, type ProctoringEvent, type Screen } from "@/lib/examvision-data"

export default function InvestigationPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [events, setEvents] = useState<ProctoringEvent[]>(EVENTS)
  const event = useMemo(
    () => events.find((item) => item.id === params.id) ?? EVENTS[0],
    [events, params.id],
  )

  function decideEvent(id: string, status: "Flagged" | "Cleared") {
    setEvents((current) => current.map((item) => item.id === id ? { ...item, status } : item))
  }

  function navigate(screen: Screen) {
    if (screen === "investigation") return
    router.push("/")
  }

  return (
    <AppShell
      active="investigations"
      onNavigate={navigate}
      onSignOut={() => router.push("/")}
      alertCount={ALERTS.length}
      onOpenEvent={(id) => router.push(`/investigations/${id}`)}
    >
      <EventDetail
        event={event}
        onBack={() => router.push("/")}
        onViolation={(id) => decideEvent(id, "Flagged")}
        onDismiss={(id) => decideEvent(id, "Cleared")}
      />
    </AppShell>
  )
}
