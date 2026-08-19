// frontend/lib/api-client.ts
//
// Single source of truth for all calls to the ExamVision AI backend.
// Every component should import from here instead of writing its own fetch().
//
// If the backend host/port changes before demo day, update BASE_URL only.

import type { ProctoringEvent, EventStatus, Severity } from "./examvision-data"

export const BASE_URL = "http://localhost:8000"

// ---------- Raw backend response shapes ----------

export type UploadResponse = {
  job_id: string
  status: string
}

export type StatusResponse = {
  job_id: string
  status: string // "processing" | "done" | "failed" (confirm exact values with backend team)
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

// ---------- API calls ----------

/**
 * Upload a video file to start a new analysis job.
 * Throws if the request fails or the backend returns a non-OK status.
 */
export async function uploadVideo(file: File): Promise<UploadResponse> {
  const formData = new FormData()
  formData.append("file", file)

  const res = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    body: formData,
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
  const res = await fetch(`${BASE_URL}/status/${jobId}`)

  if (!res.ok) {
    throw new Error(`Status check failed: ${res.status} ${res.statusText}`)
  }

  return res.json()
}

/**
 * Fetch raw results for a completed (or in-progress) job.
 * Use mapResultsToEvents() to convert this into the UI's ProctoringEvent shape.
 */
export async function getResults(jobId: string): Promise<RawResults> {
  const res = await fetch(`${BASE_URL}/results/${jobId}`)

  if (!res.ok) {
    throw new Error(`Results fetch failed: ${res.status} ${res.statusText}`)
  }

  return res.json()
}

/**
 * Build a fully-qualified URL for a snapshot image.
 * annotated_snapshot_url from the backend is already a path like
 * "/snapshot/{job_id}/event_04.jpg" - this just prefixes BASE_URL.
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
  const res = await fetch(`${BASE_URL}/events/${jobId}/${eventId}/review`, {
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

/**
 * Convert a single raw backend event into the UI's ProctoringEvent shape.
 *
 * NOTE: "student" has no real source - the pipeline is zone/camera-based,
 * not identity-based. We deliberately use an obvious placeholder rather than
 * a plausible-sounding fake name, so it's never mistaken for real data.
 */
function mapEvent(raw: RawEvent, jobId: string, videoName: string): ProctoringEvent {
  return {
    id: `EVT-${raw.event_id}`,
    zone: raw.zone_id,
    session: jobId,
    exam: videoName,
    detection: mapDetectionLabel(raw),
    confidence: mapConfidence(raw),
    timestamp: formatTimestamp(raw.start_time),
    reviewer: "Unassigned",
    status: mapReviewToStatus(raw.review),
    severity: mapSeverity(raw),
    thumbnail: getSnapshotUrl(raw.annotated_snapshot_url),
    notes: mapNotes(raw),
    boundingBox: raw.detections && raw.detections.length > 0 ? raw.detections[0].bounding_box : null,
  }
}

/**
 * Convert a full backend results payload into the UI's ProctoringEvent[] shape.
 */
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
  const res = await fetch(`${BASE_URL}/heatmap/${jobId}`)

  if (!res.ok) {
    throw new Error(`Heatmap check failed: ${res.status} ${res.statusText}`)
  }

  return res.json()
}