"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut } from "firebase/auth"
import { doc, serverTimestamp, setDoc } from "firebase/firestore"
import { getFirebaseAuth, getFirebaseDb } from "@/src/lib/firebase"

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
  authReady: boolean
  openSignIn: () => void
  closeSignIn: () => void
  signInWithGoogle: () => Promise<void>
  signOut: () => void
  clearError: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [authReady, setAuthReady] = useState(false)

  const auth = useMemo(() => getFirebaseAuth(), [])
  const db = useMemo(() => getFirebaseDb(), [])

  const openSignIn = useCallback(() => setIsOpen(true), [])
  const closeSignIn = useCallback(() => {
    setIsOpen(false)
    setError(null)
  }, [])
  const clearError = useCallback(() => setError(null), [])

  useEffect(() => {
    if (!auth) {
      setAuthReady(false)
      return
    }

    let isSubscribed = true
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        if (!isSubscribed) return
        if (firebaseUser) {
          const nextUser = {
            name: firebaseUser.displayName ?? "OptiMelon User",
            email: firebaseUser.email ?? undefined,
            avatarUrl: firebaseUser.photoURL ?? undefined,
          }
          setUser(nextUser)

          if (db) {
            void setDoc(
              doc(db, "users", firebaseUser.uid),
              {
                name: nextUser.name,
                email: nextUser.email ?? null,
                avatarUrl: nextUser.avatarUrl ?? null,
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            ).catch((syncError) => {
              if (process.env.NODE_ENV !== "production") {
                console.error("Failed to sync user profile.", syncError)
              }
            })
          }
        } else {
          setUser(null)
        }
        setAuthReady(true)
      },
      (authError) => {
        if (!isSubscribed) return
        if (process.env.NODE_ENV !== "production") {
          console.error("Firebase auth observer error.", authError)
        }
        setAuthReady(true)
      }
    )

    return () => {
      isSubscribed = false
      unsubscribe()
    }
  }, [auth, db])

  const signOut = useCallback(() => {
    if (!auth) {
      setUser(null)
      return
    }
    void firebaseSignOut(auth)
      .catch((signOutError) => {
        if (process.env.NODE_ENV !== "production") {
          console.error("Failed to sign out.", signOutError)
        }
      })
      .finally(() => setUser(null))
  }, [auth])

  const signInWithGoogle = useCallback(async () => {
    if (!auth) return
    setError(null)
    setIsLoading(true)

    try {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: "select_account" })
      await signInWithPopup(auth, provider)
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Google sign-in failed.", err)
      }
      setError("Failed to sign in with Google.")
    } finally {
      setIsLoading(false)
    }
  }, [auth])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      error,
      isOpen,
      authReady,
      openSignIn,
      closeSignIn,
      signInWithGoogle,
      signOut,
      clearError,
    }),
    [user, isLoading, error, isOpen, authReady, openSignIn, closeSignIn, signInWithGoogle, signOut, clearError]
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
