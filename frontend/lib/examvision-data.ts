export type Screen =
  | "landing"
  | "dashboard"
  | "upload"
  | "processing"
  | "investigations"
  | "event-detail"
  | "investigation"
  | "alerts"
  | "reports"
  | "settings"

export type EventStatus = "Pending" | "Flagged" | "Cleared" | "Reviewed"
export type Severity = "Critical" | "Medium" | "Low"

export type ProctoringEvent = {
  id: string
  zone: number | string
  session: string
  exam: string
  detection: string
  confidence: number
  timestamp: string
  startTime?: number
  endTime?: number
  reviewer: string
  status: EventStatus
  severity: Severity
  thumbnail: string
  notes: string
  boundingBox?: [number, number, number, number] | null
}

export type Alert = {
  id: string
  title: string
  description: string
  timestamp: string
  severity: Severity
  type: "warning" | "eye" | "tab" | "audio"
}

export type Report = {
  id: string
  name: string
  exam: string
  candidates: number
  flags: number
  generated: string
  status: "Ready" | "Processing" | "Archived"
  format: "PDF" | "CSV"
}

export function isDemoAccount(user?: { email?: string } | null): boolean {
  if (!user?.email) return true
  const email = user.email.toLowerCase().trim()
  return (
    email === "reviewer@examvision.ai" ||
    email === "admin@examvision.ai" ||
    email.endsWith("@examvision.ai") ||
    email.includes("demo")
  )
}

export const KPIS = [
  { label: "Sessions analyzed", value: "1,284", delta: "+12% from last week", trend: "up" as const },
  { label: "Active investigations", value: "37", delta: "+8% from last week", trend: "up" as const },
  { label: "Flags detected", value: "92", delta: "+15% from last week", trend: "up" as const },
  { label: "Integrity indicator", value: "94.2%", delta: "+2.4% from last week", trend: "up" as const },
]

export const EMPTY_KPIS = [
  { label: "Sessions analyzed", value: "0", delta: "", trend: "up" as const },
  { label: "Active investigations", value: "0", delta: "", trend: "up" as const },
  { label: "Flags detected", value: "0", delta: "", trend: "up" as const },
  { label: "Integrity indicator", value: "—", delta: "", trend: "up" as const },
]

export const FLAG_TREND = [
  { day: "Mon", flags: 53, height: 65 },
  { day: "Tue", flags: 24, height: 32 },
  { day: "Wed", flags: 72, height: 95 },
  { day: "Thu", flags: 33, height: 42 },
  { day: "Fri", flags: 67, height: 85 },
  { day: "Sat", flags: 56, height: 70 },
  { day: "Sun", flags: 34, height: 45 },
]

export const EMPTY_FLAG_TREND = [
  { day: "Mon", flags: 0, height: 4 },
  { day: "Tue", flags: 0, height: 4 },
  { day: "Wed", flags: 0, height: 4 },
  { day: "Thu", flags: 0, height: 4 },
  { day: "Fri", flags: 0, height: 4 },
  { day: "Sat", flags: 0, height: 4 },
  { day: "Sun", flags: 0, height: 4 },
]

export const HEATMAP_ZONES_DEFAULT = [
  { zone_id: 1, name: "Zone 1", event_count: 18, intensity: 0.85, status: "Active" },
  { zone_id: 2, name: "Zone 2", event_count: 24, intensity: 0.92, status: "High Activity" },
  { zone_id: 3, name: "Zone 3", event_count: 14, intensity: 0.65, status: "Normal" },
  { zone_id: 4, name: "Zone 4", event_count: 31, intensity: 0.98, status: "Critical Attention" },
]

export const LIVE_SESSIONS = [
  { id: "EVT-073481", student: "Marcus Reilly", initials: "MR", exam: "Advanced Microeconomics", score: 76, state: "critical" as const },
  { id: "EVT-073482", student: "Priya Nair", initials: "PN", exam: "Organic Chemistry", score: 81, state: "flagged" as const },
  { id: "EVT-073483", student: "Daniel Okonkwo", initials: "DO", exam: "Data Structures", score: 88, state: "flagged" as const },
  { id: "SES-20501", student: "Aisha Khan", initials: "AK", exam: "Calculus II", score: 97, state: "normal" as const },
  { id: "SES-20502", student: "Mateo Silva", initials: "MS", exam: "World History", score: 94, state: "normal" as const },
  { id: "SES-20503", student: "Claire Dubois", initials: "CD", exam: "Constitutional Law", score: 92, state: "normal" as const },
]

export const STUDENTS = [
  { name: "Marcus Reilly", initials: "MR", score: 76, trend: -14, history: [96, 94, 91, 88, 76], sessions: ["ECON-302 · 96%", "ECON-401 · 76%"] },
  { name: "Priya Nair", initials: "PN", score: 81, trend: -9, history: [96, 94, 90, 87, 81], sessions: ["CHEM-201 · 96%", "CHEM-210 · 81%"] },
  { name: "Daniel Okonkwo", initials: "DO", score: 88, trend: -5, history: [97, 94, 93, 90, 88], sessions: ["CS-101 · 97%", "CS-201 · 88%"] },
  { name: "Sofia Marchetti", initials: "SM", score: 90, trend: 2, history: [87, 88, 90, 89, 90], sessions: ["LAW-201 · 87%", "LAW-330 · 90%"] },
]

export const EVENTS: ProctoringEvent[] = [
  {
    id: "EVT-073481",
    zone: "Zone 8",
    session: "SES-20481",
    exam: "Advanced Microeconomics - Final",
    detection: "Gaze off-screen (repeated)",
    confidence: 91,
    timestamp: "03:14",
    reviewer: "Unassigned",
    status: "Pending",
    severity: "Critical",
    thumbnail: "/evidence-gaze.jpg",
    notes: "Candidate looked toward the lower-right of frame 14 times over a 6-minute window.",
  },
  {
    id: "EVT-073482",
    zone: "Zone 3",
    session: "SES-20477",
    exam: "Organic Chemistry - Midterm",
    detection: "Second person detected",
    confidence: 80,
    timestamp: "01:48",
    reviewer: "Unassigned",
    status: "Pending",
    severity: "Critical",
    thumbnail: "/evidence-secondperson.jpg",
    notes: "Skeleton's exhibit shows an additional face in the background doorway.",
  },
  {
    id: "EVT-073483",
    zone: "Zone 5",
    session: "SES-20479",
    exam: "Data Structures - Quiz 4",
    detection: "Repeated tab switching",
    confidence: 76,
    timestamp: "02:22",
    reviewer: "L. Sørensen",
    status: "Pending",
    severity: "Medium",
    thumbnail: "/evidence-browser.svg",
    notes: "Multiple short duration tab switches during the active exam session.",
  },
  {
    id: "EVT-073484",
    zone: "Zone 2",
    session: "SES-20485",
    exam: "Constitutional Law - Final",
    detection: "Audio anomaly",
    confidence: 66,
    timestamp: "04:10",
    reviewer: "L. Sørensen",
    status: "Pending",
    severity: "Medium",
    thumbnail: "/evidence-audio.svg",
    notes: "Brief background noise and conversational audio frequency detected.",
  },
  {
    id: "EVT-073485",
    zone: "Zone 6",
    session: "SES-20481",
    exam: "Advanced Microeconomics - Final",
    detection: "Multiple candidates flagged",
    confidence: 89,
    timestamp: "05:32",
    reviewer: "R. Patel",
    status: "Reviewed",
    severity: "Critical",
    thumbnail: "/evidence-multiple.jpg",
    notes: "3 candidates in the same exam cluster triggered synchronized off-screen glances.",
  },
]

export const ALERTS: Alert[] = [
  {
    id: "ALT-3391",
    title: "Multiple candidates flagged in Advanced Microeconomics",
    description: "3 sessions in the same exam window triggered high-confidence gaze anomalies.",
    timestamp: "4 minutes ago",
    severity: "Critical",
    type: "warning",
  },
  {
    id: "ALT-3390",
    title: "Second person detected in SES-20477",
    description: "Skeleton's exhibit shows an additional face in the background.",
    timestamp: "24 minutes ago",
    severity: "Critical",
    type: "eye",
  },
  {
    id: "ALT-3388",
    title: "Repeated tab switching in Quiz 4",
    description: "Multiple short duration tab switches during the exam session.",
    timestamp: "47 minutes ago",
    severity: "Medium",
    type: "tab",
  },
  {
    id: "ALT-3385",
    title: "Audio anomaly detected in SES-20478",
    description: "Brief background noise but no distinct speech patterns.",
    timestamp: "1 hour ago",
    severity: "Low",
    type: "audio",
  },
  {
    id: "ALT-3384",
    title: "Gaze off-screen (repeated) in SES-20481",
    description: "Candidate looking away from the screen for extended periods.",
    timestamp: "2 hours ago",
    severity: "Critical",
    type: "eye",
  },
]

export const REPORTS: Report[] = [
  {
    id: "RPT-5521",
    name: "Advanced Microeconomics — Final",
    exam: "Advanced Microecono...",
    candidates: 1204,
    flags: 48,
    generated: "Aug 22, 2024",
    status: "Ready",
    format: "PDF",
  },
  {
    id: "RPT-5518",
    name: "Organic Chemistry — Midterm",
    exam: "Organic Chemistry",
    candidates: 1204,
    flags: 48,
    generated: "Aug 22, 2024",
    status: "Ready",
    format: "CSV",
  },
  {
    id: "RPT-5514",
    name: "Data Structures Quiz 4",
    exam: "Data Structures",
    candidates: 300,
    flags: 15,
    generated: "Aug 22, 2024",
    status: "Ready",
    format: "CSV",
  },
  {
    id: "RPT-5509",
    name: "Constitutional Law — Final",
    exam: "Constitutional Law",
    candidates: 1204,
    flags: 48,
    generated: "Aug 22, 2024",
    status: "Ready",
    format: "CSV",
  },
  {
    id: "RPT-5501",
    name: "Organic Chemistry — Midterm",
    exam: "Final",
    candidates: 1204,
    flags: 48,
    generated: "Aug 22, 2024",
    status: "Ready",
    format: "CSV",
  },
]

export const TIMELINE_MARKERS = [
  { time: "01:48", position: 15, severity: "Critical" as Severity, title: "Second person detected", note: "Additional face recognized." },
  { time: "03:14", position: 35, severity: "Critical" as Severity, title: "Gaze off-screen (repeated)", note: "Looked to lower right 14 times." },
  { time: "05:32", position: 65, severity: "Medium" as Severity, title: "Synchronized anomaly", note: "Cluster gaze correlation." },
]

export const REVIEWERS = ["Lena Sørensen", "Ravi Patel", "Maya Chen", "Noah Williams"]

export const PROCESSING_STEPS = [
  "Extracting frames",
  "Detecting faces",
  "Running AI analysis",
  "Generating report",
]
