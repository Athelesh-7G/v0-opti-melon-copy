"use client"

export type User = {
  id: string
  email?: string | null
  user_metadata?: Record<string, unknown>
}

export type Session = {
  access_token: string
  token_type: string
  expires_in: number
  expires_at: number
  refresh_token?: string
  user?: User | null
}

export type AuthChangeEvent = "INITIAL_SESSION" | "SIGNED_IN" | "SIGNED_OUT"

export type SupabaseClient = {
  auth: {
    getSession: () => Promise<{ data: { session: Session | null } }>
    onAuthStateChange: (
      callback: (event: AuthChangeEvent, session: Session | null) => void
    ) => { data: { subscription: { unsubscribe: () => void } } }
    signInWithOAuth: (options: {
      provider: "google"
      options?: { redirectTo?: string }
    }) => Promise<void>
    signOut: () => Promise<void>
  }
  from: (table: string) => {
    upsert: (
      values: Record<string, unknown>,
      options?: { onConflict?: string }
    ) => Promise<{ data: unknown; error: Error | null }>
  }
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".")
  if (parts.length < 2) return null
  try {
    const payload = parts[1]
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/")
    const decoded = atob(normalized)
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

export function createClient(url: string, anonKey: string): SupabaseClient {
  const storageKey = `sb-${new URL(url).hostname.replace(/\./g, "-")}-auth-token`
  const listeners = new Set<(event: AuthChangeEvent, session: Session | null) => void>()
  let session: Session | null = null

  const readSession = () => {
    try {
      const raw = localStorage.getItem(storageKey)
      session = raw ? (JSON.parse(raw) as Session) : null
    } catch {
      session = null
    }
    return session
  }

  const notify = (event: AuthChangeEvent) => {
    listeners.forEach((callback) => callback(event, session))
  }

  const persistSession = (nextSession: Session | null, event: AuthChangeEvent) => {
    session = nextSession
    if (nextSession) {
      localStorage.setItem(storageKey, JSON.stringify(nextSession))
    } else {
      localStorage.removeItem(storageKey)
    }
    notify(event)
  }

  const parseSessionFromUrl = () => {
    if (typeof window === "undefined") return
    const hash = window.location.hash
    if (!hash) return
    const params = new URLSearchParams(hash.replace("#", ""))
    const accessToken = params.get("access_token")
    if (!accessToken) return

    const refreshToken = params.get("refresh_token") ?? undefined
    const expiresIn = Number(params.get("expires_in") || "0")
    const tokenType = params.get("token_type") || "bearer"
    const payload = decodeJwtPayload(accessToken)
    const user = payload
      ? {
          id: String(payload.sub ?? ""),
          email: payload.email ? String(payload.email) : undefined,
          user_metadata: (payload.user_metadata as Record<string, unknown>) ?? {},
        }
      : undefined
    const nextSession: Session = {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: expiresIn,
      expires_at: Math.floor(Date.now() / 1000) + expiresIn,
      token_type: tokenType,
      user,
    }
    persistSession(nextSession, "SIGNED_IN")
    window.history.replaceState({}, document.title, window.location.pathname + window.location.search)
  }

  parseSessionFromUrl()
  readSession()

  const auth = {
    getSession: async () => ({ data: { session: readSession() } }),
    onAuthStateChange: (callback: (event: AuthChangeEvent, session: Session | null) => void) => {
      listeners.add(callback)
      callback("INITIAL_SESSION", session)
      return {
        data: {
          subscription: {
            unsubscribe: () => listeners.delete(callback),
          },
        },
      }
    },
    signInWithOAuth: async ({ provider, options }: { provider: "google"; options?: { redirectTo?: string } }) => {
      const redirectTo = options?.redirectTo || window.location.origin
      const authUrl = new URL(`${url}/auth/v1/authorize`)
      authUrl.searchParams.set("provider", provider)
      authUrl.searchParams.set("redirect_to", redirectTo)
      authUrl.searchParams.set("response_type", "token")
      window.location.assign(authUrl.toString())
    },
    signOut: async () => {
      persistSession(null, "SIGNED_OUT")
    },
  }

  const from = (table: string) => ({
    upsert: async (values: Record<string, unknown>, options: { onConflict?: string } = {}) => {
      const query = new URLSearchParams()
      if (options.onConflict) {
        query.set("on_conflict", options.onConflict)
      }
      const endpoint = `${url}/rest/v1/${table}${query.toString() ? `?${query}` : ""}`
      const token = session?.access_token || anonKey
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify(values),
      })
      if (!response.ok) {
        const message = await response.text()
        return { data: null, error: new Error(message || "Supabase upsert failed") }
      }
      const data = await response.json().catch(() => null)
      return { data, error: null }
    },
  })

  return { auth, from }
}
