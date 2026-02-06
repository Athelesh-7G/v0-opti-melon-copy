"use client"

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? ""
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? ""

let supabaseClient: SupabaseClient | null = null

function logMissingSupabaseConfig() {
  if (process.env.NODE_ENV === "production") return
  console.warn("Supabase env vars missing: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY")
}

export function getSupabaseClient(): SupabaseClient | null {
  if (typeof window === "undefined") return null

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    logMissingSupabaseConfig()
    return null
  }

  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  }

  return supabaseClient
}

export const supabase = getSupabaseClient()
