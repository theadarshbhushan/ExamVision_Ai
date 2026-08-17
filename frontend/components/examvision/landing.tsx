"use client"

import {
  ArrowRight,
  Upload,
  Cpu,
  FileCheck2,
  ShieldCheck,
  Eye,
  BellRing,
  BarChart3,
  Users,
  Lock,
} from "lucide-react"
import { Logo } from "./primitives"

const NAV_LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Security", href: "#security" },
  { label: "Pricing", href: "#pricing" },
]

const STEPS = [
  {
    icon: Upload,
    title: "Upload session video",
    body: "Drop in proctoring recordings individually or as a batch. We support every major exam platform export.",
  },
  {
    icon: Cpu,
    title: "AI analyzes every frame",
    body: "Our models track gaze, faces, audio and environment signals to surface anomalies with confidence scores.",
  },
  {
    icon: FileCheck2,
    title: "Review & report",
    body: "Investigators confirm or dismiss flags in one click, then export audit-ready integrity reports.",
  },
]

const FEATURES = [
  {
    icon: Eye,
    title: "Gaze & attention tracking",
    body: "Detect repeated off-screen glances and attention loss without punishing natural movement.",
  },
  {
    icon: Users,
    title: "Second-person detection",
    body: "Instantly flag additional faces or voices that appear during a monitored session.",
  },
  {
    icon: BellRing,
    title: "Real-time alerts",
    body: "Prioritized, deduplicated notifications so your team focuses on what actually matters.",
  },
  {
    icon: BarChart3,
    title: "Integrity analytics",
    body: "Understand flag trends across exams, cohorts and terms with clear dashboards.",
  },
  {
    icon: Lock,
    title: "Privacy by design",
    body: "Role-based access, retention controls and full evidence chains keep candidate data protected.",
  },
  {
    icon: ShieldCheck,
    title: "Audit-ready reports",
    body: "Every decision is logged with reviewer, timestamp and evidence for defensible outcomes.",
  },
]

function PrimaryButton({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 ${className}`}
    >
      {children}
    </button>
  )
}

export function Landing({
  onLogin,
  onGetStarted,
}: {
  onLogin: () => void
  onGetStarted: () => void
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Logo />
          <nav className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button
              onClick={onLogin}
              className="inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Log in
            </button>
            <button
              onClick={onGetStarted}
              className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Get started
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-8 pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
            <span className="size-1.5 rounded-full bg-success" />
            Trusted by 240+ academic institutions
          </span>
          <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Exam integrity, backed by intelligent video analysis
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
            ExamVision AI reviews proctoring footage frame by frame, surfaces the
            moments that matter, and gives your team defensible, audit-ready
            decisions — without watching hours of video.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <PrimaryButton onClick={onGetStarted}>
              Get started free
              <ArrowRight className="size-4" />
            </PrimaryButton>
            <button
              onClick={onLogin}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-card px-5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
            >
              Book a demo
            </button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            No credit card required · SOC 2 Type II · FERPA aligned
          </p>
        </div>

        {/* Hero preview card */}
        <div className="mx-auto mt-16 max-w-5xl">
          <div className="rounded-2xl border border-border bg-card p-2 shadow-sm">
            <div className="rounded-xl border border-border bg-secondary/50">
              <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
                <span className="size-2.5 rounded-full bg-border" />
                <span className="size-2.5 rounded-full bg-border" />
                <span className="size-2.5 rounded-full bg-border" />
                <span className="ml-3 text-xs text-muted-foreground">
                  app.examvision.ai/dashboard
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 p-4 sm:grid-cols-4">
                {[
                  { k: "Sessions analyzed", v: "1,284" },
                  { k: "Active investigations", v: "37" },
                  { k: "Flags this week", v: "92" },
                  { k: "Integrity score", v: "94.2%" },
                ].map((s) => (
                  <div
                    key={s.k}
                    className="rounded-lg border border-border bg-card p-4 shadow-sm last:hidden sm:last:block"
                  >
                    <p className="text-xs text-muted-foreground">{s.k}</p>
                    <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                      {s.v}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20 mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-primary">How it works</p>
          <h2 className="mt-2 text-balance text-3xl font-semibold tracking-tight text-foreground">
            From raw footage to a defensible decision in three steps
          </h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className="rounded-xl border border-border bg-card p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <step.icon className="size-5" />
                </span>
                <span className="text-sm font-medium text-muted-foreground">
                  0{i + 1}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="security" className="scroll-mt-20 border-y border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-primary">Platform</p>
            <h2 className="mt-2 text-balance text-3xl font-semibold tracking-tight text-foreground">
              Everything your integrity team needs in one workspace
            </h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <f.icon className="size-5" />
                </span>
                <h3 className="mt-5 text-base font-semibold text-foreground">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-20 mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary">Pricing</p>
          <h2 className="mt-2 text-balance text-3xl font-semibold tracking-tight text-foreground">
            Plans that scale with your exam program
          </h2>
          <p className="mt-4 text-pretty text-muted-foreground">
            Start with the essentials, then expand review capacity and reporting as your team grows.
          </p>
        </div>
        <div className="mx-auto mt-10 max-w-md rounded-xl border border-border bg-card p-6 text-center shadow-sm">
          <p className="text-lg font-semibold text-foreground">Institutional plans</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Flexible pricing based on candidate volume, integrations, and support needs.
          </p>
          <PrimaryButton onClick={onLogin} className="mt-6">
            Request pricing
          </PrimaryButton>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="overflow-hidden rounded-2xl border border-border bg-primary px-8 py-14 text-center shadow-sm">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-primary-foreground">
            Ready to give your exams the integrity they deserve?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-pretty text-primary-foreground/80">
            Start analyzing sessions in minutes. Bring your existing recordings —
            no infrastructure changes required.
          </p>
          <div className="mt-8 flex justify-center">
            <button
              onClick={onGetStarted}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-card px-6 text-sm font-medium text-foreground shadow-sm transition-transform hover:-translate-y-0.5"
            >
              Get started free
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <Logo />
          <p className="text-sm text-muted-foreground">
            © 2026 ExamVision AI, Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
              Privacy
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
              Terms
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
              Security
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
