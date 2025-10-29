"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { AuthError } from "@supabase/supabase-js"

export function useCurrentUser() {
  const [data, setData] = useState<{
    user: any
    token: string | null
  } | null>(null)
  const [error, setError] = useState<AuthError | null>(null)

  useEffect(() => {
    const getUserAndToken = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        setError(error)
        setData(null)
      } else {
        setData({
          user: session?.user || null,
          token: session?.access_token || null,
        })
        setError(null)
      }
    }

    getUserAndToken()

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      getUserAndToken()
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  return { data, error }
}
