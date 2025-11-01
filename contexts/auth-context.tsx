"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { supabase } from "@/lib/supabaseClient"
import type { AuthError, User } from "@supabase/supabase-js"

interface UserContextType {
  user: User | null
  token: string | null
  error: AuthError | null
  isLoading: boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<AuthError | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const getUserAndToken = async () => {
      setIsLoading(true)
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        setError(error)
        setUser(null)
        setToken(null)
      } else {
        setUser(session?.user ?? null)
        setToken(session?.access_token ?? null)
        setError(null)
      }

      setIsLoading(false)
    }

    getUserAndToken()

    // Subscribe to auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      getUserAndToken()
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo(() => ({ user, token, error, isLoading }), [user, token, error, isLoading]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
