"use client"

import React, { createContext, useCallback, useContext, useMemo, useState } from "react"
import { buildGoogleOAuthUrl, isFirebaseConfigured, parseGoogleHash } from "@/src/lib/firebase"

interface AuthUser {
  name: string
  email?: string
  avatarUrl?: string
}

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  error: string | null
  isOpen: boolean
  openSignIn: () => void
  closeSignIn: () => void
  signInWithGoogle: () => Promise<void>
  signOut: () => void
  clearError: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const POPUP_FEATURES = "width=520,height=640,left=200,top=120,resizable=yes,scrollbars=yes,status=no"

function buildStateSeed(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const openSignIn = useCallback(() => setIsOpen(true), [])
  const closeSignIn = useCallback(() => {
    setIsOpen(false)
    setError(null)
  }, [])
  const clearError = useCallback(() => setError(null), [])

  const signOut = useCallback(() => {
    setUser(null)
  }, [])

  const signInWithGoogle = useCallback(async () => {
    setError(null)

    if (typeof window === "undefined") return
    if (!isFirebaseConfigured()) {
      setError("Auth is not configured yet. Add Firebase and Google env variables to continue.")
      return
    }

    setIsLoading(true)
    const state = buildStateSeed()

    try {
      const authUrl = buildGoogleOAuthUrl(state)
      const popup = window.open(authUrl, "optimelon-google-signin", POPUP_FEATURES)

      if (!popup) {
        throw new Error("Popup blocked. Please allow popups and try again.")
      }

      await new Promise<void>((resolve, reject) => {
        const timeout = window.setTimeout(() => {
          reject(new Error("Google sign-in timed out. Please try again."))
        }, 90_000)

        const tick = window.setInterval(() => {
          if (popup.closed) {
            window.clearInterval(tick)
            window.clearTimeout(timeout)
            reject(new Error("Sign-in cancelled."))
            return
          }

          try {
            if (!popup.location.href.startsWith(window.location.origin)) return
            const parsed = parseGoogleHash(popup.location.hash)
            if (!parsed.idToken && !parsed.accessToken) return
            if (parsed.state !== state) {
              throw new Error("Security validation failed. Please retry sign-in.")
            }

            setUser({ name: "Athelesh", email: "authenticated@google" })
            popup.close()
            window.clearInterval(tick)
            window.clearTimeout(timeout)
            resolve()
          } catch (err) {
            if (err instanceof DOMException) return
            window.clearInterval(tick)
            window.clearTimeout(timeout)
            reject(err)
          }
        }, 250)
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to sign in with Google."
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      error,
      isOpen,
      openSignIn,
      closeSignIn,
      signInWithGoogle,
      signOut,
      clearError,
    }),
    [user, isLoading, error, isOpen, openSignIn, closeSignIn, signInWithGoogle, signOut, clearError]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
