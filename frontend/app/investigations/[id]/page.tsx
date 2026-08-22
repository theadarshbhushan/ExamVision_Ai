"use client"

import { useMemo, useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { AppShell } from "@/components/examvision/app-shell"
import { EventDetail } from "@/components/examvision/event-detail"
import { ALERTS, EVENTS, isDemoAccount, type ProctoringEvent, type Screen } from "@/lib/examvision-data"
import { reviewEvent, getStoredUser, logout, getStoredActiveJob, getResults, mapResultsToEvents } from "@/lib/api-client"

export default function InvestigationPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const user = getStoredUser()
  const isDemo = isDemoAccount(user)

  const [events, setEvents] = useState<ProctoringEvent[]>(() => (isDemo ? EVENTS : []))

  useEffect(() => {
    if (isDemo || events.length > 0) return
    const targetJobId = getStoredActiveJob(user?.id)
    if (targetJobId) {
      getResults(targetJobId)
        .then((results) => {
          if (results) {
            const mapped = mapResultsToEvents(results, targetJobId)
            if (mapped.length > 0) setEvents(mapped)
          }
        })
        .catch(() => {})
    }
  }, [isDemo, events.length, user?.id])

  const event = useMemo(
    () => events.find((item) => item.id === params.id) ?? (events.length > 0 ? events[0] : null),
    [events, params.id],
  )

  function decideEvent(id: string, status: "Flagged" | "Cleared") {
    setEvents((current) => current.map((item) => item.id === id ? { ...item, status } : item))
    const target = events.find((item) => item.id === id)
    if (target && !target.session.startsWith("SES-")) {
      const rawEventId = id.replace(/^EVT-/, "")
      const decision: "approve" | "dismiss" = status === "Flagged" ? "approve" : "dismiss"
      reviewEvent(target.session, rawEventId, decision).catch((err) => console.error("Review save error:", err))
    }
  }

  function navigate(screen: Screen) {
    if (screen === "investigation") return
    router.push("/")
  }

  async function handleSignOut() {
    await logout()
    router.push("/")
  }

  return (
    <AppShell
      active="investigations"
      currentUser={user}
      onNavigate={navigate}
      onSignOut={handleSignOut}
      alertCount={isDemo ? ALERTS.length : 0}
      onOpenEvent={(id) => router.push(`/investigations/${id}`)}
    >
      <EventDetail
        event={event}
        events={events}
        onBack={() => router.push("/")}
        onViolation={(id) => decideEvent(id, "Flagged")}
        onDismiss={(id) => decideEvent(id, "Cleared")}
        onNavigate={(id) => router.push(`/investigations/${id}`)}
      />
    </AppShell>
  )
}

