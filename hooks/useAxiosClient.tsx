"use client"

import { useMemo } from "react"
import axios, { AxiosInstance } from "axios"
import { useUser } from "@/contexts/auth-context"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:4000"

/**
 * React hook that returns an authenticated Axios client bound to the current Supabase session token.
 * Automatically refreshes when the user's token changes.
 */
export function useAxiosClient(): AxiosInstance | null {
  const { token } = useUser()

  // ✅ Recreate the client whenever the token changes
  const client = useMemo(() => {
    if (!token) return null

    const instance = axios.create({
      baseURL: BASE_URL + "/api" + "/v1",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      timeout: 15000,
    })

    // 🧩 Optional: request logging (for dev only)
    instance.interceptors.request.use(
      (config) => {
        if (process.env.NODE_ENV === "development") {
          console.log("[Axios Request]", config.method?.toUpperCase(), config.url)
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // 🧱 Optional: global response handler
    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (process.env.NODE_ENV === "development") {
          console.error("[Axios Error]", error.response || error.message)
        }

        // 🔒 Handle auth errors globally
        if (error.response?.status === 401) {
          console.warn("Unauthorized — token may be expired or invalid.")
          // e.g., optional global logout or toast
        }

        return Promise.reject(error)
      }
    )

    return instance
  }, [token])

  return client
}
