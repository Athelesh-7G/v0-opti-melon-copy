"use client"

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  memo,
} from "react"
import type { User } from "@supabase/supabase-js"
import { getSupabaseClient } from "@/src/lib/supabase"

/**
 * Supabase schema + RLS (run in Supabase SQL editor):
 *
 * CREATE TABLE profiles (
 *   id UUID REFERENCES auth.users PRIMARY KEY,
 *   email TEXT UNIQUE,
 *   full_name TEXT,
 *   avatar_url TEXT,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
 *   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 * );
 * ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
 * CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
 */

interface AuthContextValue {
  user: User | null
  loading: boolean
  authReady: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function AuthProviderBase({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = useMemo(() => getSupabaseClient(), [])
  const authReady = useMemo(() => Boolean(supabase), [supabase])

  const syncProfile = useCallback(async (nextUser: User) => {
    if (!supabase) return
    try {
      const profile = {
        id: nextUser.id,
        email: nextUser.email ?? null,
        full_name: nextUser.user_metadata?.full_name ?? nextUser.user_metadata?.name ?? null,
        avatar_url: nextUser.user_metadata?.avatar_url ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      await supabase.from("profiles").upsert(profile, { onConflict: "id" })
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Supabase profile sync failed.", error)
      }
    }
  }, [supabase])

  useEffect(() => {
    let isMounted = true

    if (!supabase) {
      setLoading(false)
      setUser(null)
      return () => {
        isMounted = false
      }
    }

    supabase.auth.getSession()
      .then(({ data }) => {
        if (!isMounted) return
        setUser(data.session?.user ?? null)
        setLoading(false)
      })
      .catch((error) => {
        if (process.env.NODE_ENV !== "production") {
          console.error("Failed to read Supabase session.", error)
        }
        if (isMounted) setLoading(false)
      })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return
      const nextUser = session?.user ?? null
      setUser(nextUser)
      setLoading(false)
      if (nextUser) {
        void syncProfile(nextUser)
      }
    })

    return () => {
      isMounted = false
      subscription?.subscription.unsubscribe()
    }
  }, [supabase, syncProfile])

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) return
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      })
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Supabase Google sign-in failed.", error)
      }
    }
  }, [supabase])

  const signOut = useCallback(async () => {
    if (!supabase) return
    try {
      await supabase.auth.signOut()
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Supabase sign-out failed.", error)
      }
    }
  }, [supabase])

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

export const AuthProvider = memo(AuthProviderBase)

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
