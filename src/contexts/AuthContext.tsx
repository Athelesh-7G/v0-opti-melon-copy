"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { getFirebaseClient, type FirebaseUser } from "@/src/lib/firebase"

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

  const firebaseClientPromise = useMemo(() => getFirebaseClient(), [])

  const openSignIn = useCallback(() => setIsOpen(true), [])
  const closeSignIn = useCallback(() => {
    setIsOpen(false)
    setError(null)
  }, [])
  const clearError = useCallback(() => setError(null), [])

  useEffect(() => {
    let isSubscribed = true
    let unsubscribe: (() => void) | null = null

    void firebaseClientPromise.then((client) => {
      if (!isSubscribed) return
      if (!client) {
        setAuthReady(false)
        return
      }

      const { auth, authModule, db, firestoreModule } = client

      unsubscribe = authModule.onAuthStateChanged(
        auth,
        (firebaseUser: FirebaseUser | null) => {
          if (!isSubscribed) return
          if (firebaseUser) {
            const nextUser = {
              name: firebaseUser.displayName ?? "OptiMelon User",
              email: firebaseUser.email ?? undefined,
              avatarUrl: firebaseUser.photoURL ?? undefined,
            }
            setUser(nextUser)

            if (db && firestoreModule) {
              void firestoreModule
                .setDoc(
                  firestoreModule.doc(db, "users", firebaseUser.uid),
                  {
                    name: nextUser.name,
                    email: nextUser.email ?? null,
                    avatarUrl: nextUser.avatarUrl ?? null,
                    updatedAt: firestoreModule.serverTimestamp(),
                  },
                  { merge: true }
                )
                .catch((syncError) => {
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
    })

    return () => {
      isSubscribed = false
      if (unsubscribe) unsubscribe()
    }
  }, [firebaseClientPromise])

  const signOut = useCallback(() => {
    void firebaseClientPromise
      .then((client) => {
        if (!client) {
          setUser(null)
          return
        }
        return client.authModule.signOut(client.auth).catch((signOutError) => {
          if (process.env.NODE_ENV !== "production") {
            console.error("Failed to sign out.", signOutError)
          }
        })
      })
      .finally(() => setUser(null))
  }, [firebaseClientPromise])

  const signInWithGoogle = useCallback(async () => {
    setError(null)
    setIsLoading(true)

    try {
      const client = await firebaseClientPromise
      if (!client) return

      const provider = new client.authModule.GoogleAuthProvider()
      provider.setCustomParameters({ prompt: "select_account" })
      await client.authModule.signInWithPopup(client.auth, provider)
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Google sign-in failed.", err)
      }
      setError("Failed to sign in with Google.")
    } finally {
      setIsLoading(false)
    }
  }, [firebaseClientPromise])

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
