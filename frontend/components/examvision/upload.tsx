"use client"

import { useRef, useState } from "react"
import { UploadCloud, FileVideo, X, Film } from "lucide-react"

type SelectedFile = { name: string; size: string }

const SAMPLE_FILES = [
  { name: "SES-20492_econ401_final.mp4", size: "428.6 MB" },
  { name: "SES-20493_chem210_mid.mp4", size: "312.1 MB" },
  { name: "batch_registrar_aug11.zip", size: "1.8 GB" },
]

export function UploadScreen({ onStart }: { onStart: () => void }) {
  const [file, setFile] = useState<SelectedFile | null>(null)
  const [dragging, setDragging] = useState(false)
  const sampleIndex = useRef(0)

  function pickSample() {
    const next = SAMPLE_FILES[sampleIndex.current % SAMPLE_FILES.length]
    sampleIndex.current += 1
    setFile(next)
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
        {!file ? (
          <button
            type="button"
            onClick={pickSample}
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              pickSample()
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
              <p className="text-sm text-muted-foreground">{file.size}</p>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Film className="size-3.5" />
                Ready to analyze
              </div>
            </div>
            <button
              onClick={() => setFile(null)}
              className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Remove file"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={() => setFile(null)}
            disabled={!file}
            className="inline-flex h-9 items-center rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onStart}
            disabled={!file}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
          >
            Start analysis
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
