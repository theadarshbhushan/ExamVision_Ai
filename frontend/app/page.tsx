"use client"

import { useMemo, useState, useEffect } from "react"
import {
  EVENTS,
  ALERTS,
  isDemoAccount,
  type Screen,
  type ProctoringEvent,
} from "@/lib/examvision-data"
import { Landing } from "@/components/examvision/landing"
import { AppShell } from "@/components/examvision/app-shell"
import { Dashboard } from "@/components/examvision/dashboard"
import { UploadScreen } from "@/components/examvision/upload"
import { InvestigationsList } from "@/components/examvision/investigations-list"
import { EventDetail } from "@/components/examvision/event-detail"
import { Alerts } from "@/components/examvision/alerts"
import { Reports } from "@/components/examvision/reports"
import { Settings } from "@/components/examvision/settings"
import { Processing, type PipelineStats } from "@/components/examvision/processing"
import {
  reviewEvent,
  logout,
  clearAuth,
  getStoredUser,
  getStoredToken,
  getMe,
  getStoredActiveJob,
  setStoredActiveJob,
  getLatestUserJob,
  getResults,
  getHeatmap,
  mapResultsToEvents,
  type HeatmapZone,
  type User,
} from "@/lib/api-client"

type NavKey = "dashboard" | "upload" | "investigations" | "alerts" | "reports" | "settings"

const SCREEN_TO_NAV: Record<Screen, NavKey> = {
  landing: "dashboard",
  dashboard: "dashboard",
  upload: "upload",
  processing: "upload",
  investigations: "investigations",
  "event-detail": "investigations",
  investigation: "investigations",
  alerts: "alerts",
  reports: "reports",
  settings: "settings",
}

export default function Page() {
  const [screen, setScreen] = useState<Screen>("landing")
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [authInitialized, setAuthInitialized] = useState(false)
  const [events, setEvents] = useState<ProctoringEvent[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [pipelineStats, setPipelineStats] = useState<PipelineStats | null>(null)
  const [heatmapZones, setHeatmapZones] = useState<HeatmapZone[] | null>(null)

  const isDemo = isDemoAccount(currentUser)

  // Unified function to hydrate user data, jobs, events, and metrics
  async function hydrateUserSession(user: User) {
    setCurrentUser(user)
    const userIsDemo = isDemoAccount(user)

    if (userIsDemo) {
      setEvents(EVENTS)
      setSelectedId("EVT-073481")
      setActiveJobId(null)
      setPipelineStats(null)
      setHeatmapZones(null)
      setScreen("dashboard")
      return
    }

    // Look for stored active job for this specific user ID, or fetch the latest job from the backend
    let targetJobId = getStoredActiveJob(user.id)
    if (!targetJobId) {
      const latest = await getLatestUserJob().catch(() => null)
      if (latest?.job_id) {
        targetJobId = latest.job_id
        setStoredActiveJob(targetJobId, user.id)
      }
    }

    if (targetJobId) {
      setActiveJobId(targetJobId)
      try {
        const [results, heatmap] = await Promise.all([
          getResults(targetJobId).catch(() => null),
          getHeatmap(targetJobId).catch(() => null),
        ])
        if (results) {
          const mappedEvents = mapResultsToEvents(results, targetJobId)
          if (mappedEvents.length > 0) {
            setEvents(mappedEvents)
            setSelectedId(mappedEvents[0].id)
          } else {
            setEvents([])
            setSelectedId(null)
          }
          setPipelineStats({
            totalFrames: results.total_frames,
            framesSentToYolo: results.frames_sent_to_yolo,
            bypassRatio: Math.round(results.bypass_ratio * 100),
            totalDuration: results.total_duration,
          })
          if (heatmap?.zones) {
            setHeatmapZones(heatmap.zones)
          }
        }
      } catch (err) {
        console.error("Error rehydrating session results:", err)
      }
    } else {
      setEvents([])
      setSelectedId(null)
      setActiveJobId(null)
      setPipelineStats(null)
      setHeatmapZones(null)
    }

    setScreen("dashboard")
  }

  // Restore authenticated session and job data on page load/refresh
  useEffect(() => {
    async function restoreSession() {
      const storedToken = getStoredToken()
      const storedUser = getStoredUser()

      // If no stored credentials, stay on landing page
      if (!storedToken && !storedUser) {
        setAuthInitialized(true)
        return
      }

      // Check if it's a demo session
      if (!storedToken && storedUser && isDemoAccount(storedUser)) {
        await hydrateUserSession(storedUser)
        setAuthInitialized(true)
        return
      }

      if (storedToken) {
        try {
          // Verify token validity with backend
          const verifiedUser = await getMe()
          await hydrateUserSession(verifiedUser)
        } catch (err) {
          // Invalid or expired token: clear local storage and show landing page
          console.warn("Stored token is invalid or expired. Resetting session to landing page:", err)
          clearAuth()
          setCurrentUser(null)
          setEvents([])
          setSelectedId(null)
          setActiveJobId(null)
          setScreen("landing")
        }
      } else {
        clearAuth()
        setCurrentUser(null)
        setScreen("landing")
      }

      setAuthInitialized(true)
    }

    restoreSession()
  }, [])

  const selectedEvent = useMemo(
    () => events.find((e) => e.id === selectedId) ?? events.find((e) => e.detection !== "Motion Triggered") ?? events[0] ?? null,
    [events, selectedId]
  )

  async function handleAuthenticated(user: User) {
    await hydrateUserSession(user)
  }

  async function handleSignOut() {
    await logout()
    setCurrentUser(null)
    setEvents([])
    setSelectedId(null)
    setActiveJobId(null)
    setPipelineStats(null)
    setHeatmapZones(null)
    setScreen("landing")
  }

  function openEvent(id: string) {
    setSelectedId(id)
    setScreen("event-detail")
  }

  function decideEvent(id: string, status: "Flagged" | "Cleared") {
    const reviewerName = currentUser?.full_name || "Lead Reviewer"
    setEvents((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, status, reviewer: e.reviewer === "Unassigned" ? reviewerName : e.reviewer }
          : e
      )
    )
    const target = events.find((e) => e.id === id)
    const jobId = activeJobId || (target && !target.session.startsWith("SES-") ? target.session : null)
    if (jobId) {
      const rawEventId = id.replace(/^EVT-/, "")
      const decision: "approve" | "dismiss" = status === "Flagged" ? "approve" : "dismiss"
      reviewEvent(jobId, rawEventId, decision).catch((err) => console.error("Review sync error:", err))
    }
  }

  if (!currentUser || screen === "landing") {
    return <Landing onAuthenticated={handleAuthenticated} />
  }

  if (screen === "processing") {
    return (
      <Processing
        jobId={activeJobId}
        onComplete={(newEvents, stats, heatmap) => {
          if (newEvents.length > 0) {
            setEvents(newEvents)
            setSelectedId(newEvents[0].id)
          }
          if (stats) setPipelineStats(stats)
          if (heatmap) setHeatmapZones(heatmap)
          if (activeJobId) {
            setStoredActiveJob(activeJobId, currentUser?.id)
          }
          setScreen("dashboard")
        }}
      />
    )
  }

  const alertCount = isDemo
    ? ALERTS.length
    : events.filter((e) => e.severity === "Critical" || e.severity === "Medium").length

  return (
    <AppShell
      active={SCREEN_TO_NAV[screen] || "dashboard"}
      currentUser={currentUser}
      onNavigate={(s) => setScreen(s)}
      onSignOut={handleSignOut}
      alertCount={alertCount}
      onOpenEvent={openEvent}
    >
      {screen === "dashboard" && (
        <Dashboard
          events={events}
          pipelineStats={pipelineStats}
          heatmapZones={heatmapZones}
          totalDuration={pipelineStats?.totalDuration}
          isDemo={isDemo}
          onOpenEvent={openEvent}
          onUpload={() => setScreen("upload")}
        />
      )}
      {screen === "upload" && (
        <UploadScreen
          onStart={(jobId) => {
            setActiveJobId(jobId)
            setStoredActiveJob(jobId, currentUser?.id)
            setScreen("processing")
          }}
        />
      )}
      {screen === "investigations" && (
        <InvestigationsList events={events} onOpenEvent={openEvent} />
      )}
      {(screen === "event-detail" || screen === "investigation") && (
        <EventDetail
          event={selectedEvent}
          events={events}
          totalDuration={pipelineStats?.totalDuration}
          onBack={() => setScreen("investigations")}
          onViolation={(id) => decideEvent(id, "Flagged")}
          onDismiss={(id) => decideEvent(id, "Cleared")}
          onNavigate={(id) => setSelectedId(id)}
        />
      )}
      {screen === "alerts" && (
        <Alerts events={events} isDemo={isDemo} onOpenEvent={openEvent} />
      )}
      {screen === "reports" && (
        <Reports events={events} isDemo={isDemo} />
      )}
      {screen === "settings" && <Settings />}
    </AppShell>
  )
}
