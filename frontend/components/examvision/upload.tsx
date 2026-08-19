"use client"

import { useRef, useState } from "react"
import { UploadCloud, FileVideo, X, Film, Loader2 } from "lucide-react"
import { uploadVideo } from "@/lib/api-client"

export function UploadScreen({ onStart }: { onStart: (jobId: string) => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
      setError(null)
    }
  }

  async function handleStart() {
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const response = await uploadVideo(file)
      onStart(response.job_id)
    } catch (err: any) {
      setError(err.message || "Something went wrong during file upload.")
    } finally {
      setLoading(false)
    }
  }

  function getReadableSize(bytes: number): string {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Upload session video
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a proctoring recording to queue it for AI analysis.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="video/*,.zip"
          className="hidden"
          disabled={loading}
        />

        {!file ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                setFile(e.dataTransfer.files[0])
                setError(null)
              }
            }}
            className={`flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-16 text-center transition-colors ${
              dragging
                ? "border-primary bg-accent/60"
                : "border-border bg-secondary/40 hover:border-primary/50 hover:bg-accent/40"
            }`}
          >
            <span className="flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <UploadCloud className="size-7" />
            </span>
            <p className="mt-4 text-base font-medium text-foreground">
              Drag &amp; drop your video here
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              or <span className="font-medium text-primary">click to browse</span>
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              MP4, MOV, WEBM or ZIP up to 5 GB
            </p>
          </button>
        ) : (
          <div className="flex items-center gap-4 rounded-xl border border-border bg-secondary/40 p-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileVideo className="size-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-foreground">{file.name}</p>
              <p className="text-sm text-muted-foreground">{getReadableSize(file.size)}</p>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Film className="size-3.5" />
                Ready to analyze
              </div>
            </div>
            <button
              onClick={() => setFile(null)}
              disabled={loading}
              className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
              aria-label="Remove file"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={() => {
              setFile(null)
              setError(null)
            }}
            disabled={!file || loading}
            className="inline-flex h-9 items-center rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleStart}
            disabled={!file || loading}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {loading ? "Uploading..." : "Start analysis"}
          </button>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Uploads are encrypted in transit and retained per your institution&apos;s
        policy.
      </p>
    </div>
  )
}
