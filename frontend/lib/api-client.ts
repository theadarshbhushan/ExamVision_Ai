// frontend/lib/api-client.ts
//
// Single source of truth for all calls to the ExamVision AI backend.
// Every component should import from here instead of writing its own fetch().

import type { ProctoringEvent, EventStatus, Severity } from "./examvision-data"

export const BASE_URL = "http://localhost:8000"

const TOKEN_STORAGE_KEY = "examvision_jwt_token"
const USER_STORAGE_KEY = "examvision_user"

// ---------- Auth Types & Helpers ----------

export type UserRole = "admin" | "reviewer" | "student"

export type User = {
  id: string
  email: string
  full_name: string
  role: UserRole
  is_active: boolean
  created_at: string
}

export type AuthResponse = {
  user: User
  access_token?: string
  token_type?: string
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(TOKEN_STORAGE_KEY)
}

export function setStoredToken(token: string | null): void {
  if (typeof window === "undefined") return
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
  }
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(USER_STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function setStoredUser(user: User | null): void {
  if (typeof window === "undefined") return
  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(USER_STORAGE_KEY)
  }
}

const ACTIVE_JOB_PREFIX = "examvision_active_job_"

export function getStoredActiveJob(userId?: string): string | null {
  if (typeof window === "undefined") return null
  const key = userId ? `${ACTIVE_JOB_PREFIX}${userId}` : "examvision_active_job"
  return localStorage.getItem(key) || localStorage.getItem("examvision_active_job")
}

export function setStoredActiveJob(jobId: string | null, userId?: string): void {
  if (typeof window === "undefined") return
  const key = userId ? `${ACTIVE_JOB_PREFIX}${userId}` : "examvision_active_job"
  if (jobId) {
    localStorage.setItem(key, jobId)
    localStorage.setItem("examvision_active_job", jobId)
  } else {
    localStorage.removeItem(key)
    localStorage.removeItem("examvision_active_job")
  }
}

export function clearAuth(): void {
  setStoredToken(null)
  setStoredUser(null)
}

/**
 * Standard fetch wrapper that automatically attaches Authorization Bearer header and credentials.
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getStoredToken()
  const headers = new Headers(options.headers || {})

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  return fetch(url.startsWith("http") ? url : `${BASE_URL}${url}`, {
    ...options,
    headers,
    credentials: "include",
  })
}

// ---------- Auth API Calls ----------

export async function login(email: string, password: string): Promise<{ user: User; access_token: string }> {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include",
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || `Login failed (${res.status})`)
  }

  const data: AuthResponse = await res.json()
  if (data.access_token) {
    setStoredToken(data.access_token)
  }
  setStoredUser(data.user)

  return {
    user: data.user,
    access_token: data.access_token || "",
  }
}

export async function register(payload: {
  email: string
  password: string
  full_name: string
  role?: UserRole
}): Promise<User> {
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: payload.email,
      password: payload.password,
      full_name: payload.full_name,
      role: payload.role || "reviewer",
    }),
    credentials: "include",
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || `Registration failed (${res.status})`)
  }

  return res.json()
}

export async function getMe(): Promise<User> {
  const res = await authFetch("/api/auth/me")
  if (!res.ok) {
    throw new Error(`Failed to fetch current user profile (${res.status})`)
  }
  const user: User = await res.json()
  setStoredUser(user)
  return user
}

export async function logout(): Promise<void> {
  try {
    await authFetch("/api/auth/logout", { method: "POST" })
  } catch (err) {
    console.error("Logout request error:", err)
  } finally {
    clearAuth()
  }
}

// ---------- Raw backend response shapes ----------

export type UploadResponse = {
  job_id: string
  status: string
}

export type StatusResponse = {
  job_id: string
  status: string
  progress: number
  error: string | null
}

export type RawDetection = {
  class_name: string
  confidence: number
  bounding_box: [number, number, number, number]
}

export type RawEvent = {
  event_id: string
  start_time: number
  end_time: number
  zone_id: number
  motion_intensity: number
  detections: RawDetection[]
  before_snapshot_url: string | null
  after_snapshot_url: string | null
  annotated_snapshot_url: string | null
  review?: "approve" | "dismiss"
}

export type RawResults = {
  video_name: string
  total_frames: number
  total_duration?: number
  frames_sent_to_yolo: number
  bypass_ratio: number
  events: RawEvent[]
}

export type ReviewDecision = "approve" | "dismiss"

export type ReviewResponse = {
  event_id: string
  decision: ReviewDecision
  status: string
}

// ---------- Pipeline API calls ----------

/**
 * Upload a video file to start a new analysis job.
 */
export async function uploadVideo(file: File, signal?: AbortSignal): Promise<UploadResponse> {
  const formData = new FormData()
  formData.append("file", file)

  const res = await authFetch("/upload", {
    method: "POST",
    body: formData,
    signal,
  })

  if (!res.ok) {
    throw new Error(`Upload failed: ${res.status} ${res.statusText}`)
  }

  return res.json()
}

/**
 * Poll the processing status of a job.
 */
export async function getStatus(jobId: string): Promise<StatusResponse> {
  const res = await authFetch(`/status/${jobId}`)

  if (!res.ok) {
    throw new Error(`Status check failed: ${res.status} ${res.statusText}`)
  }

  return res.json()
}

/**
 * Fetch raw results for a completed job.
 */
export async function getResults(jobId: string): Promise<RawResults> {
  const res = await authFetch(`/results/${jobId}`)

  if (!res.ok) {
    throw new Error(`Results fetch failed: ${res.status} ${res.statusText}`)
  }

  return res.json()
}

/**
 * Fetch the latest analysis job associated with the authenticated user.
 */
export async function getLatestUserJob(): Promise<{ job_id: string | null; status: string | null } | null> {
  try {
    const res = await authFetch("/api/jobs/latest")
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

/**
 * Build a fully-qualified URL for a snapshot image.
 */
export function getSnapshotUrl(path: string | null): string {
  if (!path) return ""
  return path.startsWith("http") ? path : `${BASE_URL}${path}`
}

/**
 * Submit an approve/dismiss decision for a specific event.
 */
export async function reviewEvent(
  jobId: string,
  eventId: string,
  decision: ReviewDecision
): Promise<ReviewResponse> {
  const res = await authFetch(`/events/${jobId}/${eventId}/review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ decision }),
  })

  if (!res.ok) {
    throw new Error(`Review submit failed: ${res.status} ${res.statusText}`)
  }

  return res.json()
}

// ---------- Transform: backend RawResults -> frontend ProctoringEvent[] ----------

function formatTimestamp(startTimeSeconds: number): string {
  const mins = Math.floor(startTimeSeconds / 60)
  const secs = Math.floor(startTimeSeconds % 60)
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

function mapReviewToStatus(review: RawEvent["review"]): EventStatus {
  if (review === "approve") return "Flagged"
  if (review === "dismiss") return "Cleared"
  return "Pending"
}

function mapSeverity(ev: RawEvent): Severity {
  if (ev.detections.length > 0) return "Critical"
  if (ev.motion_intensity > 0.1) return "Medium"
  return "Low"
}

function mapDetectionLabel(ev: RawEvent): string {
  if (ev.detections.length > 0) {
    return ev.detections.map((d) => d.class_name).join(", ")
  }
  return "Motion Triggered"
}

function mapConfidence(ev: RawEvent): number {
  if (ev.detections.length > 0) {
    return Math.round(ev.detections[0].confidence * 100)
  }
  return 0
}

function mapNotes(ev: RawEvent): string {
  const base = `Active motion detected in Zone ${ev.zone_id} (intensity: ${ev.motion_intensity.toFixed(3)}).`
  const detectionNote =
    ev.detections.length > 0
      ? ` Object identified: ${ev.detections.map((d) => d.class_name).join(", ")}.`
      : ""
  return base + detectionNote
}

function pickSnapshotUrl(ev: RawEvent): string {
  return getSnapshotUrl(ev.annotated_snapshot_url ?? ev.after_snapshot_url ?? ev.before_snapshot_url)
}

function mapEvent(raw: RawEvent, jobId: string, videoName: string): ProctoringEvent {
  return {
    id: `EVT-${raw.event_id}`,
    zone: raw.zone_id,
    session: jobId,
    exam: videoName,
    detection: mapDetectionLabel(raw),
    confidence: mapConfidence(raw),
    timestamp: formatTimestamp(raw.start_time),
    startTime: raw.start_time,
    endTime: raw.end_time,
    reviewer: "Unassigned",
    status: mapReviewToStatus(raw.review),
    severity: mapSeverity(raw),
    thumbnail: pickSnapshotUrl(raw),
    notes: mapNotes(raw),
    boundingBox: raw.detections && raw.detections.length > 0 ? raw.detections[0].bounding_box : null,
  }
}

export function mapResultsToEvents(raw: RawResults, jobId: string): ProctoringEvent[] {
  return raw.events.map((ev) => mapEvent(ev, jobId, raw.video_name))
}

export type HeatmapZone = {
  zone_id: number
  total_intensity: number
  event_count: number
}

export type HeatmapResponse = {
  zones: HeatmapZone[]
}

/**
 * Fetch aggregated zone heatmap data for a completed job.
 */
export async function getHeatmap(jobId: string): Promise<HeatmapResponse> {
  const res = await authFetch(`/heatmap/${jobId}`)

  if (!res.ok) {
    throw new Error(`Heatmap check failed: ${res.status} ${res.statusText}`)
  }

  return res.json()
}