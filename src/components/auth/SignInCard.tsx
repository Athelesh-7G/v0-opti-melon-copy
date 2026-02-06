"use client"

import React, { memo, useEffect, useMemo, useState } from "react"
import { useAuth } from "@/src/contexts/AuthContext"

function WatermelonIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className="h-12 w-12 text-primary"
      fill="currentColor"
    >
      <path d="M32 6C18.1 6 6 18.1 6 32c0 14.3 11.7 26 26 26s26-11.7 26-26C58 18.1 45.9 6 32 6zm0 46C20.4 52 12 43.6 12 32S20.4 12 32 12s20 8.4 20 20-8.4 20-20 20z" />
      <path d="M32 16c-8.8 0-16 7.2-16 16h32c0-8.8-7.2-16-16-16z" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
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
  )
}

function SignInCardBase() {
  const { authReady, user, signInWithGoogle, loading } = useAuth()
  const [isExiting, setIsExiting] = useState(false)
  const [showToast, setShowToast] = useState(false)

  const shouldRender = useMemo(() => authReady && (!user || isExiting), [authReady, user, isExiting])

  useEffect(() => {
    if (!user) return
    setIsExiting(true)
    setShowToast(true)
    const exitTimer = window.setTimeout(() => setIsExiting(false), 300)
    const toastTimer = window.setTimeout(() => setShowToast(false), 2000)
    return () => {
      window.clearTimeout(exitTimer)
      window.clearTimeout(toastTimer)
    }
  }, [user])

  if (!shouldRender) return null

  const welcomeName = user?.user_metadata?.full_name || user?.user_metadata?.name || "there"

  return (
    <div className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-background/50 px-4 py-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] backdrop-blur-sm sm:px-6">
      <section
        className={`mx-4 w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-2xl sm:p-10 ${
          isExiting
            ? "animate-[fade-out_0.3s_ease-in_forwards]"
            : "opacity-0 scale-95 animate-[fade-in_0.4s_ease-out_forwards,scale_0.4s_ease-out_forwards]"
        }`}
        aria-live="polite"
        role="dialog"
      >
        <div className="flex flex-col items-center">
          <div className="mb-6">
            <WatermelonIcon />
          </div>
          <h1 className="mb-2 text-center text-3xl font-bold tracking-tight text-foreground">
            Welcome to OptiMelon
          </h1>
          <p className="mb-8 text-center text-sm text-foreground/70">
            Sign in to save chats, sync history, and personalize your AI
          </p>
        </div>

        <button
          type="button"
          onClick={signInWithGoogle}
          aria-label="Continue with Google"
          disabled={loading}
          className="flex min-h-[48px] w-full items-center justify-center gap-3 rounded-xl border-2 border-border bg-card px-6 py-3.5 text-base font-semibold text-foreground shadow-md transition-all duration-200 hover:border-primary/40 hover:bg-secondary hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <div className="my-6 flex items-center gap-3 text-foreground/50">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs uppercase tracking-widest">or</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <p className="text-center text-xs text-foreground/50">
          Your data is secure and private
        </p>

        {user && (
          <p className="mt-4 text-center text-sm font-semibold text-green-400 animate-pulse">
            Welcome back, {welcomeName}!
          </p>
        )}
      </section>

      {showToast && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-border bg-card/90 px-4 py-2 text-xs text-foreground shadow-lg backdrop-blur">
          Signed in successfully.
        </div>
      )}
    </div>
  )
}

export const SignInCard = memo(SignInCardBase)
