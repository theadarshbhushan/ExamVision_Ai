"use client"

import React, { useRef, useState } from "react"
import {
  Upload as UploadIcon,
  ChevronDown,
  FileVideo,
  X,
  CheckCircle2,
  Loader2,
  Sparkles,
} from "lucide-react"
import { uploadVideo } from "@/lib/api-client"
import { cn } from "@/lib/utils"

export function UploadScreen({
  onStart,
}: {
  onStart: (jobId: string) => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [examName, setExamName] = useState("")
  const [sessionId, setSessionId] = useState("")
  const [selectedZone, setSelectedZone] = useState("Zone 1 (North Hall)")
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const abortControllerRef = useRef<AbortController | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
      setError(null)
    }
  }

  async function handleStart() {
    if (!file) {
      setError("Please select or drop an exam video file first.")
      return
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setLoading(true)
    setError(null)
    abortControllerRef.current = new AbortController()
    try {
      const response = await uploadVideo(file, abortControllerRef.current.signal)
      onStart(response.job_id)
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError(err.message || "Failed to upload video to backend. Please check connection.")
      }
    } finally {
      abortControllerRef.current = null
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl py-6 animate-fade-in">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="video/*,.zip"
        className="hidden"
      />

      {/* Main Upload Clay Card matching upload.png */}
      <div className="clay-card p-8 sm:p-10 bg-white/95 space-y-8">
        {/* Dropzone Container with Soft Cyan Inset Glow */}
        <div
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
          className={cn(
            "relative flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-[24px] p-8 text-center transition-all duration-300",
            "bg-gradient-to-b from-[#d9f2fd]/80 via-[#e1f5fe]/60 to-[#d8f0fa]/80 shadow-[inset_0_3px_8px_rgba(14,165,233,0.18),inset_0_-2px_4px_rgba(255,255,255,0.9)] border border-cyan-100/60",
            dragging && "scale-[1.01] ring-2 ring-[#0284c7]"
          )}
        >
          {/* Cloud Upload Icon */}
          <span className="flex size-20 items-center justify-center rounded-full text-[#3b82f6] drop-shadow-[0_4px_10px_rgba(59,130,246,0.3)]">
            <UploadIcon className="size-14" strokeWidth={2.2} />
          </span>

          <h3 className="mt-4 text-xl font-bold text-[#0f1e36]">
            {file ? file.name : "Drag and drop your exam video file here"}
          </h3>

          <p className="mt-1.5 text-sm text-[#5a718d]">
            {file
              ? `${(file.size / (1024 * 1024)).toFixed(1)} MB • Click to replace file`
              : "or click to browse files. Supports MP4, MOV, AVI"}
          </p>
        </div>

        {/* 3 Form Fields in a Single Row matching upload.png */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {/* Field 1: Exam Name */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#0f1e36]">
              Exam Name
            </label>
            <input
              type="text"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              placeholder="e.g., Final Exam - Biology 101"
              className="clay-search-bar h-11 w-full bg-[var(--bg-card-inset)] px-4 text-xs font-medium text-[var(--text-primary)] placeholder-[#8b9eb5] outline-none"
            />
          </div>

          {/* Field 2: Session ID */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#0f1e36]">
              Session ID
            </label>
            <input
              type="text"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              placeholder="e.g., SES-54321"
              className="clay-search-bar h-11 w-full bg-[var(--bg-card-inset)] px-4 text-xs font-medium text-[var(--text-primary)] placeholder-[#8b9eb5] outline-none"
            />
          </div>

          {/* Field 3: Select Zone */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#0f1e36]">
              Select Zone
            </label>
            <div className="relative">
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="clay-search-bar h-11 w-full appearance-none bg-[var(--bg-card-inset)] px-4 pr-10 text-xs font-medium text-[var(--text-primary)] outline-none cursor-pointer"
              >
                <option value="Zone 1 (North Hall)">Zone 1 (North Hall)</option>
                <option value="Zone 2 (East Wing)">Zone 2 (East Wing)</option>
                <option value="Zone 3 (Auditorium)">Zone 3 (Auditorium)</option>
                <option value="Zone 4 (South Hall)">Zone 4 (South Hall)</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-[#8b9eb5]" />
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-[#b91c1c] shadow-sm animate-fade-in flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="font-bold hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Start Analysis CTA Button matching upload.png */}
        <div>
          <button
            onClick={handleStart}
            disabled={loading}
            className="clay-btn-primary w-full py-4 text-base font-bold tracking-wide shadow-xl flex items-center justify-center gap-2 hover:scale-[1.01]"
          >
            {loading ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                Initializing AI Pipeline...
              </>
            ) : (
              "Start Analysis"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
