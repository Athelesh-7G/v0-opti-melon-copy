"use client"

import React, { useState } from "react"
import { useAuth } from "@/src/contexts/AuthContext"

export function GoogleSignInModal({ triggerLabel = "Sign In" }: { triggerLabel?: string }) {
  const { authReady, signInWithGoogle } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  if (!authReady) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        {triggerLabel}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 p-4">
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Close sign-in"
            onClick={() => setIsOpen(false)}
          />
          <section className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-foreground">
              Continue with Google
            </h2>
            <p className="mt-2 text-sm text-foreground/70">
              Sign in to save and sync your chats.
            </p>
            <button
              type="button"
              onClick={signInWithGoogle}
              className="mt-6 w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-secondary"
            >
              Continue with Google
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="mt-3 w-full text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </section>
        </div>
      )}
    </>
  )
}
