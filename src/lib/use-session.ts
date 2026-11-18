"use client"

import { useCallback, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { getSupabase, missingSupabaseEnv } from "@/lib/supabase"

export function useSession() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [configError, setConfigError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const missing = missingSupabaseEnv()
    setConfigError(missing)

    if (missing) {
      setUser(null)
      setLoading(false)
      return null
    }

    const supabase = getSupabase()
    if (!supabase) {
      setUser(null)
      setLoading(false)
      return null
    }

    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user) {
      setUser(null)
      setLoading(false)
      return null
    }

    const fullName =
      typeof data.user.user_metadata?.full_name === "string" &&
      data.user.user_metadata.full_name.trim()
        ? data.user.user_metadata.full_name.trim()
        : data.user.email ?? "Usuário"

    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: data.user.id,
        full_name: fullName,
        email: data.user.email ?? "",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )

    if (profileError) {
      setConfigError(profileError.message)
    }

    setUser(data.user)
    setLoading(false)
    return data.user
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { user, loading, configError, refresh }
}
