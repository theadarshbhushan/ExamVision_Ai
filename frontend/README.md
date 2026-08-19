# ExamVision AI — Next.js Audit Portal Dashboard

This is the Next.js frontend web dashboard for the ExamVision AI proctoring audit suite. It displays processed exam-hall video events, metrics cards, heatmaps, and allows reviewers to approve or dismiss flagged incidents in real time.

## Tech Stack
- Framework: Next.js (App Router)
- Language: TypeScript
- Style: Vanilla CSS & Tailwind CSS
- Icons: Lucide React

---

## Setup & Running

1. **Install Node.js dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Port Hosting**:
   The development server hosts the app on `http://localhost:3000`.

---

## API Backend Connection
The dashboard connects to the FastAPI backend to fetch job status, upload videos, query results, and submit review audits.

* It expects the backend API to be running concurrently at:
  `http://localhost:8000` (configurable via `BASE_URL` inside `lib/api-client.ts`).
