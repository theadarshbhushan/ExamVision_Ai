"use client"

import { useState } from "react"
import { Eye, EyeOff, Lock, Mail, User as UserIcon, Shield, X, AlertCircle, Loader2, CheckCircle2, ChevronDown } from "lucide-react"
import { login, register, type User, type UserRole } from "@/lib/api-client"
import { Logo } from "./primitives"
import { cn } from "@/lib/utils"

export function AuthModal({
  isOpen,
  initialMode = "login",
  onClose,
  onSuccess,
}: {
  isOpen: boolean
  initialMode?: "login" | "register"
  onClose: () => void
  onSuccess: (user: User) => void
}) {
  const [mode, setMode] = useState<"login" | "register">(initialMode)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [role, setRole] = useState<UserRole>("reviewer")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (!email || !password) {
      setError("Please fill in all required fields.")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.")
      return
    }

    setLoading(true)

    try {
      if (mode === "register") {
        if (!fullName.trim()) {
          setError("Please enter your full name.")
          setLoading(false)
          return
        }

        // Register user
        await register({
          email,
          password,
          full_name: fullName,
          role,
        })

        // Auto log in after registration
        const { user } = await login(email, password)
        setSuccessMessage("Account created successfully!")
        setTimeout(() => {
          onSuccess(user)
        }, 400)
      } else {
        // Sign in
        const { user } = await login(email, password)
        onSuccess(user)
      }
    } catch (err: any) {
      console.error("Auth error:", err)
      setError(err.message || "Authentication failed. Please check your credentials.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Soft Blur Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[#0f1e36]/35 backdrop-blur-md transition-opacity duration-300 animate-fade-in"
      />

      {/* Modal Clay Card */}
      <div className="relative w-full max-w-md rounded-[32px] bg-white/95 p-8 sm:p-9 shadow-[0_25px_60px_-15px_rgba(100,145,195,0.4),0_8px_20px_rgba(100,145,195,0.18),inset_0_2px_4px_rgba(255,255,255,1),inset_0_-2px_4px_rgba(160,190,220,0.2)] border border-white/90 animate-fade-in z-10">
        {/* Clay Close Button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="clay-btn-secondary absolute right-5 top-5 flex size-9 items-center justify-center rounded-full text-[var(--text-muted)] transition-all hover:scale-105 hover:text-[var(--text-primary)] cursor-pointer"
        >
          <X className="size-4.5" />
        </button>

        {/* Header Branding */}
        <div className="flex flex-col items-center text-center">
          <Logo />
          <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-[var(--text-primary)]">
            {mode === "login" ? "Sign in to ExamVision" : "Create an Account"}
          </h2>
          <p className="mt-1.5 text-xs font-medium text-[var(--text-secondary)] max-w-xs leading-relaxed">
            {mode === "login"
              ? "Access the AI-powered assessment integrity & proctoring dashboard"
              : "Register to manage exams, investigate events, and generate audit reports"}
          </p>
        </div>

        {/* Clay Segmented Tab Switch */}
        <div className="mt-6 grid grid-cols-2 gap-1.5 rounded-2xl bg-[var(--bg-card-inset)] p-1.5 shadow-[inset_0_2px_5px_rgba(140,175,210,0.25),inset_0_-1px_2px_rgba(255,255,255,0.9)] border border-white/60">
          <button
            type="button"
            onClick={() => {
              setMode("login")
              setError(null)
              setSuccessMessage(null)
            }}
            className={cn(
              "py-2.5 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer",
              mode === "login"
                ? "bg-white text-[#2563eb] shadow-[0_4px_12px_rgba(37,99,235,0.22),inset_0_2px_3px_rgba(255,255,255,1)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/40"
            )}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register")
              setError(null)
              setSuccessMessage(null)
            }}
            className={cn(
              "py-2.5 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer",
              mode === "register"
                ? "bg-white text-[#2563eb] shadow-[0_4px_12px_rgba(37,99,235,0.22),inset_0_2px_3px_rgba(255,255,255,1)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/40"
            )}
          >
            Create Account
          </button>
        </div>

        {/* Error / Success Alerts */}
        {error && (
          <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-red-200/80 bg-gradient-to-r from-red-50/90 to-rose-50/90 p-3.5 text-xs font-semibold text-[#e11d48] shadow-[0_4px_12px_rgba(225,29,72,0.12),inset_0_1.5px_2px_rgba(255,255,255,0.8)] animate-fade-in">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/90 to-teal-50/90 p-3.5 text-xs font-semibold text-[#059669] shadow-[0_4px_12px_rgba(5,150,105,0.12),inset_0_1.5px_2px_rgba(255,255,255,0.8)] animate-fade-in">
            <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {mode === "register" && (
            <div>
              <label className="text-xs font-bold text-[var(--text-primary)] block mb-1.5">
                Full Name
              </label>
              <div className="relative rounded-2xl bg-[var(--bg-card-inset)] shadow-[inset_0_2px_4px_rgba(140,175,210,0.22),inset_0_-1px_2px_rgba(255,255,255,0.9)] border border-white/60 focus-within:ring-2 focus-within:ring-[#3b82f6]/40 focus-within:bg-white transition-all">
                <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Dr. Lena Sørensen"
                  required
                  className="h-11 w-full bg-transparent pl-10 pr-4 text-xs font-semibold text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-[var(--text-primary)] block mb-1.5">
              Email address
            </label>
            <div className="relative rounded-2xl bg-[var(--bg-card-inset)] shadow-[inset_0_2px_4px_rgba(140,175,210,0.22),inset_0_-1px_2px_rgba(255,255,255,0.9)] border border-white/60 focus-within:ring-2 focus-within:ring-[#3b82f6]/40 focus-within:bg-white transition-all">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[var(--text-muted)]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@university.edu"
                required
                className="h-11 w-full bg-transparent pl-10 pr-4 text-xs font-semibold text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-[var(--text-primary)]">
                Password
              </label>
              <span className="text-[11px] text-[var(--text-muted)] font-medium">
                Min. 8 characters
              </span>
            </div>
            <div className="relative rounded-2xl bg-[var(--bg-card-inset)] shadow-[inset_0_2px_4px_rgba(140,175,210,0.22),inset_0_-1px_2px_rgba(255,255,255,0.9)] border border-white/60 focus-within:ring-2 focus-within:ring-[#3b82f6]/40 focus-within:bg-white transition-all">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[var(--text-muted)]" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                className="h-11 w-full bg-transparent pl-10 pr-10 text-xs font-semibold text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1 cursor-pointer"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {mode === "register" && (
            <div>
              <label className="text-xs font-bold text-[var(--text-primary)] block mb-1.5">
                Account Role
              </label>
              <div className="relative rounded-2xl bg-[var(--bg-card-inset)] shadow-[inset_0_2px_4px_rgba(140,175,210,0.22),inset_0_-1px_2px_rgba(255,255,255,0.9)] border border-white/60 focus-within:ring-2 focus-within:ring-[#3b82f6]/40 focus-within:bg-white transition-all">
                <Shield className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[var(--text-muted)]" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="h-11 w-full bg-transparent pl-10 pr-10 text-xs font-semibold text-[var(--text-primary)] outline-none appearance-none cursor-pointer"
                >
                  <option value="reviewer">Reviewer / Investigator</option>
                  <option value="admin">Administrator / Faculty</option>
                  <option value="student">Student / Examinee</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-[var(--text-muted)]" />
              </div>
            </div>
          )}

          {/* Primary Clay Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="clay-btn-primary mt-3 h-12 w-full flex items-center justify-center gap-2 rounded-2xl text-xs font-extrabold text-white shadow-[0_10px_24px_-4px_rgba(37,99,235,0.45),inset_0_2px_4px_rgba(255,255,255,0.5),inset_0_-2px_4px_rgba(0,0,0,0.18)] hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-4px_rgba(37,99,235,0.55)] active:translate-y-0.5 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>{mode === "login" ? "Authenticating…" : "Creating account…"}</span>
              </>
            ) : (
              <span>{mode === "login" ? "Sign In" : "Create Account"}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
