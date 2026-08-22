"use client"

import React, { useState } from "react"
import {
  ArrowRight,
  TrendingUp,
  TrendingDown,
  User as UserIcon,
  Flag,
  Shield,
  Upload,
  Cpu,
  FileCheck2,
  Eye,
  Users,
  BellRing,
  BarChart3,
  Lock,
  ShieldCheck,
  Check,
} from "lucide-react"
import { Logo, ClayCard } from "./primitives"
import { AuthModal } from "./auth-modal"
import type { User } from "@/lib/api-client"

const NAV_LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Security", href: "#security" },
  { label: "Pricing", href: "#pricing" },
]

export function Landing({
  onAuthenticated,
}: {
  onAuthenticated: (user: User) => void
}) {
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "register">("login")

  function openAuth(mode: "login" | "register") {
    setAuthMode(mode)
    setAuthModalOpen(true)
  }

  function handleDemoAccess() {
    const demoUser: User = {
      id: "demo-reviewer-1",
      email: "reviewer@examvision.ai",
      full_name: "Lead Reviewer",
      role: "reviewer",
      is_active: true,
      created_at: new Date().toISOString(),
    }
    onAuthenticated(demoUser)
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#eef6fc] via-[#e8f3f8] to-[#e4f4f1] text-[var(--text-primary)]">
      {/* Decorative 3D Clay Shapes Floating in Background (as in landing.png) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Left top mint/cyan prism & sphere */}
        <div className="animate-float-slow absolute -left-12 top-24 size-44 rounded-full bg-gradient-to-tr from-[#93e4c8] to-[#6ee7b7] opacity-60 blur-sm shadow-[0_20px_50px_rgba(16,185,129,0.3),inset_0_4px_10px_rgba(255,255,255,0.8)]" />
        <div className="animate-float-reverse absolute left-16 top-52 size-20 rounded-2xl rotate-45 bg-gradient-to-br from-[#93c5fd] to-[#60a5fa] opacity-70 shadow-[0_16px_36px_rgba(59,130,246,0.3),inset_0_4px_8px_rgba(255,255,255,0.8)]" />
        
        {/* Left bottom large soft blue/mint clay spheres */}
        <div className="animate-float-slow absolute -left-20 bottom-12 size-72 rounded-full bg-gradient-to-tr from-[#60a5fa] via-[#93c5fd] to-[#bfdbfe] opacity-50 shadow-[0_30px_70px_rgba(59,130,246,0.35),inset_0_8px_16px_rgba(255,255,255,0.9)]" />
        <div className="animate-float-reverse absolute left-36 bottom-4 size-32 rounded-full bg-gradient-to-tr from-[#34d399] to-[#6ee7b7] opacity-60 shadow-[0_20px_40px_rgba(16,185,129,0.3),inset_0_6px_12px_rgba(255,255,255,0.9)]" />

        {/* Right top blue & mint clay spheres */}
        <div className="animate-float-slow absolute right-16 top-16 size-24 rounded-full bg-gradient-to-tr from-[#3b82f6] to-[#93c5fd] opacity-60 shadow-[0_16px_36px_rgba(37,99,235,0.3),inset_0_4px_8px_rgba(255,255,255,0.9)]" />
        <div className="animate-float-reverse absolute -right-16 top-36 size-60 rounded-full bg-gradient-to-tr from-[#10b981] to-[#a7f3d0] opacity-45 shadow-[0_25px_60px_rgba(16,185,129,0.3),inset_0_6px_14px_rgba(255,255,255,0.9)]" />
        
        {/* Right bottom spheres */}
        <div className="animate-float-slow absolute right-12 bottom-36 size-20 rounded-full bg-gradient-to-tr from-[#34d399] to-[#6ee7b7] opacity-50 shadow-[0_12px_30px_rgba(16,185,129,0.25)]" />
        <div className="animate-float-reverse absolute -right-24 bottom-6 size-80 rounded-full bg-gradient-to-tr from-[#60a5fa] to-[#bfdbfe] opacity-40 shadow-[0_30px_70px_rgba(59,130,246,0.3)]" />
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(user) => {
          setAuthModalOpen(false)
          onAuthenticated(user)
        }}
      />

      {/* Top Navbar matching landing.png */}
      <header className="relative z-30 mx-auto max-w-7xl px-6 pt-6 sm:px-10">
        <div className="flex h-16 items-center justify-between">
          <Logo />

          <nav className="hidden items-center gap-10 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-[15px] font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={() => openAuth("login")}
              className="text-[15px] font-semibold text-[var(--text-primary)] transition-colors hover:text-[#2563eb]"
            >
              Log in
            </button>
            <button
              onClick={() => openAuth("register")}
              className="clay-btn-primary px-6 py-2.5 text-[15px]"
            >
              Get started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section matching landing.png */}
      <main className="relative z-20 mx-auto max-w-5xl px-6 pt-16 pb-24 text-center sm:px-8 sm:pt-20">
        <h1 className="mx-auto max-w-4xl text-balance text-4xl font-extrabold tracking-tight text-[#0f1e36] sm:text-5xl md:text-[56px] md:leading-[1.18]">
          Exam integrity, backed by intelligent video analysis
        </h1>

        <p className="mx-auto mt-6 max-w-3xl text-pretty text-base font-normal leading-relaxed text-[#5a718d] sm:text-lg">
          ExamVision AI reviews proctoring footage frame by frame, surfaces the moments that matter, and gives your team defensible, audit-ready decisions — without watching hours of video.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button
            onClick={() => openAuth("register")}
            className="clay-btn-primary flex items-center gap-2.5 px-8 py-3.5 text-base font-semibold shadow-lg hover:scale-105"
          >
            Get started free
            <ArrowRight className="size-4" strokeWidth={2.5} />
          </button>
          <button
            onClick={handleDemoAccess}
            className="clay-btn-secondary px-8 py-3.5 text-base font-semibold transition-transform hover:scale-105"
          >
            Book a demo
          </button>
        </div>

        {/* Hero Clay Dock Card (matching landing.png exactly) */}
        <div className="mx-auto mt-16 max-w-3xl">
          <div className="clay-card relative overflow-hidden p-8 sm:p-10 border border-white/60 bg-white/95">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Tile 1: Sessions analyzed */}
              <div className="flex items-center gap-4.5 rounded-2xl bg-[#f6faff] p-4 transition-transform hover:scale-[1.02] shadow-[inset_0_2px_4px_rgba(180,205,235,0.2)] border border-blue-50">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#cbe4ff] to-[#9ecbff] text-[#1d4ed8] shadow-[0_6px_14px_rgba(59,130,246,0.25),inset_0_2px_3px_rgba(255,255,255,0.8)]">
                  <TrendingUp className="size-7" strokeWidth={2.5} />
                </span>
                <div className="text-left">
                  <p className="text-sm font-medium text-[#5a718d]">Sessions analyzed</p>
                  <p className="mt-0.5 text-2xl font-bold tracking-tight text-[#0f1e36] flex items-center gap-1.5">
                    1,284 <span className="text-lg font-bold text-[#10b981]">↗</span>
                  </p>
                </div>
              </div>

              {/* Tile 2: Active investigations */}
              <div className="flex items-center gap-4.5 rounded-2xl bg-[#f6faff] p-4 transition-transform hover:scale-[1.02] shadow-[inset_0_2px_4px_rgba(180,205,235,0.2)] border border-blue-50">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#c8f7dc] to-[#99eec3] text-[#065f46] shadow-[0_6px_14px_rgba(16,185,129,0.25),inset_0_2px_3px_rgba(255,255,255,0.8)]">
                  <UserIcon className="size-7" strokeWidth={2.5} />
                </span>
                <div className="text-left">
                  <p className="text-sm font-medium text-[#5a718d]">Active investigations</p>
                  <p className="mt-0.5 text-2xl font-bold tracking-tight text-[#0f1e36]">
                    37
                  </p>
                </div>
              </div>

              {/* Tile 3: Flags this week */}
              <div className="flex items-center gap-4.5 rounded-2xl bg-[#f6faff] p-4 transition-transform hover:scale-[1.02] shadow-[inset_0_2px_4px_rgba(180,205,235,0.2)] border border-blue-50">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ffd5d5] to-[#ffa8a8] text-[#c92a2a] shadow-[0_6px_14px_rgba(239,68,68,0.25),inset_0_2px_3px_rgba(255,255,255,0.8)]">
                  <Flag className="size-7" strokeWidth={2.5} />
                </span>
                <div className="text-left">
                  <p className="text-sm font-medium text-[#5a718d]">Flags this week</p>
                  <p className="mt-0.5 text-2xl font-bold tracking-tight text-[#0f1e36] flex items-center gap-1.5">
                    92 <span className="text-lg font-bold text-[#e03131]">↘</span>
                  </p>
                </div>
              </div>

              {/* Tile 4: Integrity score */}
              <div className="flex items-center gap-4.5 rounded-2xl bg-[#f6faff] p-4 transition-transform hover:scale-[1.02] shadow-[inset_0_2px_4px_rgba(180,205,235,0.2)] border border-blue-50">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#c8f7dc] to-[#99eec3] text-[#065f46] shadow-[0_6px_14px_rgba(16,185,129,0.25),inset_0_2px_3px_rgba(255,255,255,0.8)]">
                  <Shield className="size-7" strokeWidth={2.5} />
                </span>
                <div className="text-left">
                  <p className="text-sm font-medium text-[#5a718d]">Integrity score</p>
                  <p className="mt-0.5 text-2xl font-bold tracking-tight text-[#0f1e36] flex items-center gap-1.5">
                    94.2% <span className="text-lg font-bold text-[#10b981]">↗</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlights Section */}
        <section id="how-it-works" className="mt-28 text-left">
          <div className="text-center">
            <span className="clay-pill-blue px-4 py-1 text-xs font-bold uppercase tracking-wider">
              Workflows
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#0f1e36]">
              Intelligent Proctoring in Three Simple Steps
            </h2>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Upload,
                step: "01",
                title: "Upload session video",
                desc: "Drop in proctoring recordings individually or as a batch. Supports MP4, MOV, and AVI.",
              },
              {
                icon: Cpu,
                step: "02",
                title: "AI analyzes every frame",
                desc: "Computer vision models track gaze, extra persons, audio anomalies, and tab changes.",
              },
              {
                icon: FileCheck2,
                step: "03",
                title: "Defensible decisions",
                desc: "Reviewers confirm or dismiss flagged events with 1 click and export audit-ready PDF/CSV reports.",
              },
            ].map((s) => (
              <div key={s.step} className="clay-card p-7 border border-white/80 bg-white/90">
                <div className="flex items-center justify-between">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#3b82f6] to-[#60a5fa] text-white shadow-md">
                    <s.icon className="size-6" />
                  </span>
                  <span className="text-2xl font-black text-[#93c5fd]">{s.step}</span>
                </div>
                <h3 className="mt-5 text-lg font-bold text-[#0f1e36]">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#5a718d]">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-20 border-t border-blue-100 bg-white/60 py-8 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 sm:flex-row sm:px-10">
          <Logo />
          <p className="text-sm text-[#5a718d]">
            © {new Date().getFullYear()} ExamVision AI. Defensible proctoring intelligence.
          </p>
          <div className="flex items-center gap-6 text-sm font-medium text-[#5a718d]">
            <a href="#" className="hover:text-[#0f1e36]">Security</a>
            <a href="#" className="hover:text-[#0f1e36]">Privacy Policy</a>
            <a href="#" className="hover:text-[#0f1e36]">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
