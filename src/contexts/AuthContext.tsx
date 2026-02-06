"use client"

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { getFirebaseClient, type FirebaseUser } from "@/src/lib/firebase"

type AuthUser = {
  id: string
  name: string
  email?: string
  avatarUrl?: string
}

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  authReady: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function toAuthUser(user: FirebaseUser): AuthUser {
  return {
    id: user.uid,
    name: user.displayName ?? "OptiMelon User",
    email: user.email ?? undefined,
    avatarUrl: user.photoURL ?? undefined,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [authReady, setAuthReady] = useState(false)

  const initClient = useMemo(() => getFirebaseClient(), [])

  useEffect(() => {
    let isMounted = true
    let unsubscribe: (() => void) | null = null

    initClient.then((client) => {
      if (!isMounted) return
      if (!client) {
        setAuthReady(false)
        setLoading(false)
        return
      }

      const { auth, authModule, db, firestoreModule } = client

      unsubscribe = authModule.onAuthStateChanged(
        auth,
        (firebaseUser) => {
          if (!isMounted) return
          if (firebaseUser) {
            const nextUser = toAuthUser(firebaseUser)
            setUser(nextUser)
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
              .catch(() => {
                // Silent failure
              })
          } else {
            setUser(null)
          }
          setAuthReady(true)
          setLoading(false)
        },
        () => {
          if (!isMounted) return
          setAuthReady(true)
          setLoading(false)
        }
      )
    })

    return () => {
      isMounted = false
      if (unsubscribe) unsubscribe()
    }
  }, [initClient])

  const signInWithGoogle = useCallback(async () => {
    const client = await initClient
    if (!client) return

    const { auth, authModule } = client
    const provider = new authModule.GoogleAuthProvider()
    provider.setCustomParameters({ prompt: "select_account" })
    try {
      await authModule.signInWithPopup(auth, provider)
    } catch {
      // Silent failure
    }
  }, [initClient])

  const signOut = useCallback(async () => {
    const client = await initClient
    if (!client) return
    try {
      await client.authModule.signOut(client.auth)
    } catch {
      // Silent failure
    }
  }, [initClient])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      authReady,
      signInWithGoogle,
      signOut,
    }),
    [user, loading, authReady, signInWithGoogle, signOut]
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
