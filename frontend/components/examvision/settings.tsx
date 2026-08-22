"use client"

import React, { useState } from "react"
import { Settings as SettingsIcon, Sliders, Shield, Bell, Key, Check } from "lucide-react"

export function Settings() {
  const [gazeSensitivity, setGazeSensitivity] = useState(85)
  const [personConfidence, setPersonConfidence] = useState(75)
  const [audioThreshold, setAudioThreshold] = useState(60)
  const [tabSwitchGrace, setTabSwitchGrace] = useState(3)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [saved, setSaved] = useState(false)

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
          Settings
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Manage proctoring thresholds, AI detection sensitivity, and notification preferences.
        </p>
      </div>

      {/* Settings Sections */}
      <div className="clay-card p-8 bg-white/95 space-y-6">
        <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Sliders className="size-5 text-[#2563eb]" />
          AI Proctoring Sensitivity & Thresholds
        </h2>

        <div className="space-y-6 divide-y divide-[var(--bg-app)]">
          {/* Gaze tracking */}
          <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)]">Gaze Off-Screen Threshold</p>
              <p className="text-xs text-[var(--text-secondary)]">Flag sessions when off-screen glance probability exceeds this score.</p>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="50"
                max="99"
                value={gazeSensitivity}
                onChange={(e) => setGazeSensitivity(Number(e.target.value))}
                className="w-36 accent-[#2563eb] cursor-pointer"
              />
              <span className="min-w-[48px] font-mono text-sm font-bold text-[var(--text-primary)] text-right">
                {gazeSensitivity}%
              </span>
            </div>
          </div>

          {/* Second person confidence */}
          <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)]">Second Person Confidence Cutoff</p>
              <p className="text-xs text-[var(--text-secondary)]">Minimum model certainty required to trigger a multi-candidate alert.</p>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="50"
                max="99"
                value={personConfidence}
                onChange={(e) => setPersonConfidence(Number(e.target.value))}
                className="w-36 accent-[#2563eb] cursor-pointer"
              />
              <span className="min-w-[48px] font-mono text-sm font-bold text-[var(--text-primary)] text-right">
                {personConfidence}%
              </span>
            </div>
          </div>

          {/* Audio anomaly */}
          <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)]">Audio Anomaly Noise Filter</p>
              <p className="text-xs text-[var(--text-secondary)]">Filter ambient acoustic disturbances below this threshold.</p>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="30"
                max="90"
                value={audioThreshold}
                onChange={(e) => setAudioThreshold(Number(e.target.value))}
                className="w-36 accent-[#2563eb] cursor-pointer"
              />
              <span className="min-w-[48px] font-mono text-sm font-bold text-[var(--text-primary)] text-right">
                {audioThreshold}%
              </span>
            </div>
          </div>

          {/* Tab switch */}
          <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)]">Tab Switch Grace Period</p>
              <p className="text-xs text-[var(--text-secondary)]">Allow brief accidental window defocus before logging an anomaly.</p>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={tabSwitchGrace}
                onChange={(e) => setTabSwitchGrace(Number(e.target.value))}
                className="clay-search-bar h-9 px-4 text-xs font-semibold outline-none"
              >
                <option value={0}>0 seconds (Strict)</option>
                <option value={3}>3 seconds (Standard)</option>
                <option value={5}>5 seconds (Lenient)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pt-6 flex items-center justify-between border-t border-[var(--bg-app)]">
          <button
            onClick={handleSave}
            className="clay-btn-primary px-6 py-2.5 text-xs font-bold flex items-center gap-2"
          >
            {saved ? <Check className="size-4" /> : null}
            {saved ? "Settings Saved" : "Save Preferences"}
          </button>
        </div>
      </div>
    </div>
  )
}
