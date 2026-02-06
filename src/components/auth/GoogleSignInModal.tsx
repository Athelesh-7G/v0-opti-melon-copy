"use client"

import React, { useMemo, useState } from "react"
import { X } from "lucide-react"
import { useAuth } from "@/src/contexts/AuthContext"

function GoogleIcon() {
  return (
    <span className="relative inline-flex h-5 w-5 items-center justify-center">
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-full animate-pulse"
        style={{ boxShadow: "0 0 10px rgba(229,57,53,0.35)" }}
      />
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="relative z-10 h-5 w-5"
      >
        <path
          fill="#EA4335"
          d="M12 10.2v3.9h5.5c-.2 1.2-.9 2.3-2 3v2.5h3.2c1.9-1.8 3-4.5 3-7.6 0-.7-.1-1.2-.2-1.8H12z"
        />
        <path
          fill="#34A853"
          d="M12 22c2.7 0 4.9-.9 6.5-2.4l-3.2-2.5c-.9.6-2 .9-3.3.9-2.5 0-4.7-1.7-5.4-4.1H3.3v2.6C4.9 19.8 8.2 22 12 22z"
        />
        <path
          fill="#FBBC05"
          d="M6.6 13.9c-.2-.6-.3-1.3-.3-1.9s.1-1.3.3-1.9V7.5H3.3C2.5 9 2 10.5 2 12s.5 3 1.3 4.5l3.3-2.6z"
        />
        <path
          fill="#4285F4"
          d="M12 6.8c1.5 0 2.8.5 3.8 1.5l2.8-2.8C16.9 3.9 14.7 3 12 3 8.2 3 4.9 5.2 3.3 8.5l3.3 2.6c.7-2.4 2.9-4.3 5.4-4.3z"
        />
      </svg>
    </span>
  )
}

export function GoogleSignInModal({ triggerLabel = "Sign In" }: { triggerLabel?: string }) {
  const { isOpen, openSignIn, closeSignIn, signInWithGoogle, isLoading, error, clearError } = useAuth()
  const [showWelcome, setShowWelcome] = useState(false)

  const modalClasses = useMemo(
    () =>
      `w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 ${
        isOpen ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-2 scale-95 pointer-events-none"
      }`,
    [isOpen]
  )

  const handleGoogleSignIn = async () => {
    clearError()
    try {
      await signInWithGoogle()
      setShowWelcome(true)
      window.setTimeout(() => {
        setShowWelcome(false)
        closeSignIn()
      }, 1200)
    } catch {
      // error is set in context for inline display
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openSignIn}
        className="text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        {triggerLabel}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            onClick={closeSignIn}
            className="absolute inset-0 bg-background/60 backdrop-blur-sm"
            aria-label="Close sign-in modal"
          />

          <section className={modalClasses} role="dialog" aria-modal="true" aria-label="Sign in to OptiMelon">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Welcome to OptiMelon</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Continue with Google for a zero-friction sign-in.
                </p>
              </div>
              <button
                type="button"
                onClick={closeSignIn}
                className="rounded-full border border-border p-2 text-muted-foreground hover:bg-secondary"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full min-h-[44px] rounded-full border-2 border-border bg-card px-5 py-3 text-sm font-medium text-foreground shadow-sm transition-all hover:bg-secondary hover:border-primary/30 hover:scale-[1.02] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span className="flex items-center justify-center gap-3">
                <GoogleIcon />
                {isLoading ? "Connecting to Google..." : "Continue with Google"}
              </span>
            </button>

            {showWelcome && (
              <p className="mt-3 text-sm text-primary animate-in fade-in duration-300">
                Welcome back, Athelesh!
              </p>
            )}

            {error && (
              <p className="mt-3 text-sm text-destructive">
                {error}
              </p>
            )}
          </section>
        </div>
      )}
    </>
  )
}
