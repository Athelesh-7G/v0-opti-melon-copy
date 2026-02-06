"use client"

import React from "react"
import { useAuth } from "@/src/contexts/AuthContext"

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
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

export function SignInCard() {
  const { authReady, user, signInWithGoogle, loading } = useAuth()

  if (!authReady || user) return null

  return (
    <div className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-background/50 px-4 py-6 backdrop-blur-sm">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-2xl sm:p-10">
        <div className="mb-6 flex justify-center">
          <div className="h-12 w-12 rounded-full bg-primary/10 text-primary">
            <span className="flex h-full w-full items-center justify-center text-xl font-bold">
              O
            </span>
          </div>
        </div>
        <h1 className="mb-2 text-center text-3xl font-bold text-foreground">
          Welcome to OptiMelon
        </h1>
        <p className="mb-8 text-center text-sm text-foreground/70">
          Sign in to save chats, sync history, and personalize your AI
        </p>

        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={loading}
          className="flex min-h-[48px] w-full items-center justify-center gap-3 rounded-xl border-2 border-border bg-card px-6 py-3.5 text-base font-semibold text-foreground shadow-md transition hover:border-primary/40 hover:bg-secondary"
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
      </section>
    </div>
  )
}
