"use client"

import React, { memo } from "react"
import { useAuth } from "@/src/contexts/AuthContext"

function GoogleSignInModalBase({ triggerLabel = "Sign In" }: { triggerLabel?: string }) {
  const { authReady, signInWithGoogle } = useAuth()

  if (!authReady) return null

  return (
    <button
      type="button"
      onClick={signInWithGoogle}
      className="text-sm text-muted-foreground hover:text-primary transition-colors"
      aria-label={triggerLabel}
    >
      {triggerLabel}
    </button>
  )
}

export const GoogleSignInModal = memo(GoogleSignInModalBase)
