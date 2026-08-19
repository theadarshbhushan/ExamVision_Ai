export type Screen =
  | "landing"
  | "dashboard"
  | "upload"
  | "processing"
  | "event-detail"
  | "investigation"
  | "live"
  | "students"
  | "alerts"
  | "reports"

export type EventStatus = "Pending" | "Flagged" | "Cleared"
export type Severity = "Critical" | "Medium" | "Low"

export type ProctoringEvent = {
  id: string
  zone: number
  session: string
  exam: string
  detection: string
  confidence: number
  timestamp: string
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
}

export type Report = {
  id: string
  name: string
  exam: string
  candidates: number
  flags: number
  generated: string
  status: "Ready" | "Processing" | "Archived"
}

export const KPIS = [
  { label: "Sessions analyzed", value: "1,284", delta: "+12.4%", trend: "up" as const },
  { label: "Active investigations", value: "37", delta: "+4", trend: "up" as const },
  { label: "Flags this week", value: "92", delta: "-8.1%", trend: "down" as const },
  { label: "Avg. integrity score", value: "94.2%", delta: "+1.3%", trend: "up" as const },
]

export const REVIEWERS = ["Lena Sørensen", "Ravi Patel", "Maya Chen", "Noah Williams"]

export const LIVE_SESSIONS = [
  { id: "EVT-9F2A41", student: "Marcus Reilly", initials: "MR", exam: "Advanced Microeconomics", score: 76, state: "critical" as const },
  { id: "EVT-7C8B03", student: "Priya Nair", initials: "PN", exam: "Organic Chemistry", score: 81, state: "flagged" as const },
  { id: "EVT-5A1D77", student: "Daniel Okonkwo", initials: "DO", exam: "Data Structures", score: 88, state: "flagged" as const },
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

export const TIMELINE_MARKERS = [
  { time: "03:14", position: 18, severity: "Low" as Severity, title: "Gaze briefly off screen", note: "A short glance away from the assessment window." },
  { time: "12:42", position: 47, severity: "Medium" as Severity, title: "Repeated gaze pattern", note: "Four looks toward the lower-right within 90 seconds." },
  { time: "18:36", position: 70, severity: "Critical" as Severity, title: "Object detection", note: "A phone-shaped object is briefly visible beside the candidate." },
]

// Weekly flag volume for the dashboard chart
export const FLAG_TREND = [
  { day: "Mon", flags: 14, sessions: 182 },
  { day: "Tue", flags: 22, sessions: 210 },
  { day: "Wed", flags: 18, sessions: 196 },
  { day: "Thu", flags: 31, sessions: 245 },
  { day: "Fri", flags: 26, sessions: 231 },
  { day: "Sat", flags: 9, sessions: 88 },
  { day: "Sun", flags: 12, sessions: 132 },
]

export const EVENTS: ProctoringEvent[] = [
  {
    id: "EVT-9F2A41",
    zone: 8,
    session: "SES-20481",
    exam: "Advanced Microeconomics — Final",
    detection: "Gaze off-screen (repeated)",
    confidence: 91,
    timestamp: "2026-08-11 09:42:17",
    reviewer: "Unassigned",
    status: "Pending",
    severity: "Critical",
    thumbnail: "/evidence-frame-1.png",
    notes: "Candidate looked toward the lower-right of frame 14 times over a 6-minute window.",
  },
  {
    id: "EVT-7C8B03",
    zone: 3,
    session: "SES-20477",
    exam: "Organic Chemistry — Midterm",
    detection: "Second person detected",
    confidence: 87,
    timestamp: "2026-08-11 09:18:52",
    reviewer: "Unassigned",
    status: "Pending",
    severity: "Critical",
    thumbnail: "/evidence-frame-2.png",
    notes: "A second face was intermittently visible in the background doorway.",
  },
  {
    id: "EVT-5A1D77",
    zone: 4,
    session: "SES-20470",
    exam: "Data Structures — Quiz 4",
    detection: "Tab switch detected",
    confidence: 78,
    timestamp: "2026-08-11 08:55:09",
    reviewer: "L. Sørensen",
    status: "Pending",
    severity: "Medium",
    thumbnail: "/evidence-frame-1.png",
    notes: "Browser focus left the exam window twice for a total of 41 seconds.",
  },
  {
    id: "EVT-4B9E12",
    zone: 7,
    session: "SES-20465",
    exam: "Constitutional Law — Final",
    detection: "Background noise spike",
    confidence: 64,
    timestamp: "2026-08-11 08:30:44",
    reviewer: "L. Sørensen",
    status: "Flagged",
    severity: "Medium",
    thumbnail: "/evidence-frame-2.png",
    notes: "Sustained conversational audio detected for 22 seconds.",
  },
  {
    id: "EVT-3E7C56",
    zone: 5,
    session: "SES-20459",
    exam: "Calculus II — Midterm",
    detection: "Phone-shaped object",
    confidence: 82,
    timestamp: "2026-08-11 08:04:31",
    reviewer: "R. Patel",
    status: "Flagged",
    severity: "Critical",
    thumbnail: "/evidence-frame-1.png",
    notes: "A rectangular reflective object appeared briefly near the candidate's right hand.",
  },
  {
    id: "EVT-2D6A98",
    zone: 6,
    session: "SES-20451",
    exam: "World History — Quiz 2",
    detection: "Face not detected",
    confidence: 55,
    timestamp: "2026-08-11 07:47:20",
    reviewer: "R. Patel",
    status: "Cleared",
    severity: "Low",
    thumbnail: "/evidence-frame-2.png",
    notes: "Candidate leaned out of frame to retrieve a dropped pen. No integrity concern.",
  },
  {
    id: "EVT-1C5F30",
    zone: 2,
    session: "SES-20444",
    exam: "Statistics — Final",
    detection: "Lighting change",
    confidence: 48,
    timestamp: "2026-08-11 07:22:58",
    reviewer: "L. Sørensen",
    status: "Cleared",
    severity: "Low",
    thumbnail: "/evidence-frame-1.png",
    notes: "Ambient light shifted; automated recalibration succeeded.",
  },
]

export const ALERTS: Alert[] = [
  {
    id: "ALT-3391",
    title: "Multiple candidates flagged in Advanced Microeconomics",
    description: "3 sessions in the same exam window triggered high-confidence gaze anomalies.",
    timestamp: "4 minutes ago",
    severity: "Critical",
  },
  {
    id: "ALT-3390",
    title: "Second person detected in SES-20477",
    description: "Priya Nair's session shows an additional face in the background.",
    timestamp: "24 minutes ago",
    severity: "Critical",
  },
  {
    id: "ALT-3388",
    title: "Repeated tab switching in Data Structures Quiz 4",
    description: "Daniel Okonkwo's browser lost focus multiple times during the assessment.",
    timestamp: "47 minutes ago",
    severity: "Medium",
  },
  {
    id: "ALT-3385",
    title: "Audio anomaly in Constitutional Law Final",
    description: "Conversational audio detected in Sofia Marchetti's session.",
    timestamp: "1 hour ago",
    severity: "Medium",
  },
  {
    id: "ALT-3380",
    title: "Processing complete for 42 new sessions",
    description: "Batch upload from Registrar's Office finished analysis successfully.",
    timestamp: "2 hours ago",
    severity: "Low",
  },
]

export const REPORTS: Report[] = [
  {
    id: "RPT-5521",
    name: "Advanced Microeconomics — Final Integrity Report",
    exam: "ECON-401",
    candidates: 218,
    flags: 12,
    generated: "2026-08-11",
    status: "Ready",
  },
  {
    id: "RPT-5518",
    name: "Organic Chemistry — Midterm Summary",
    exam: "CHEM-210",
    candidates: 164,
    flags: 7,
    generated: "2026-08-10",
    status: "Ready",
  },
  {
    id: "RPT-5514",
    name: "Data Structures — Quiz 4 Overview",
    exam: "CS-201",
    candidates: 96,
    flags: 3,
    generated: "2026-08-10",
    status: "Ready",
  },
  {
    id: "RPT-5509",
    name: "Constitutional Law — Final Review",
    exam: "LAW-330",
    candidates: 142,
    flags: 9,
    generated: "2026-08-09",
    status: "Processing",
  },
  {
    id: "RPT-5501",
    name: "Calculus II — Midterm Report",
    exam: "MATH-152",
    candidates: 203,
    flags: 15,
    generated: "2026-08-08",
    status: "Ready",
  },
  {
    id: "RPT-5487",
    name: "World History — Quiz 2 Summary",
    exam: "HIST-105",
    candidates: 88,
    flags: 2,
    generated: "2026-08-06",
    status: "Archived",
  },
]

export const PROCESSING_STEPS = [
  "Extracting frames",
  "Detecting faces",
  "Running AI analysis",
  "Generating report",
]
