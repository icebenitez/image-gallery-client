"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { toast } from "sonner"

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase v2 automatically reads tokens from the URL hash
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("Error getting session:", error)
          toast.error("Failed to complete sign-in")
          return router.replace("/auth/login")
        }

        if (data?.session) {
          toast.success("Email confirmed! You're now signed in.")
          router.replace("/")
          return
        }

        // If no session, fallback: force sign-in manually
        toast.error("No session found. Please log in manually.")
        router.replace("/auth/login")
      } catch (err) {
        console.error("Unexpected callback error:", err)
        toast.error("Something went wrong.")
        router.replace("/auth/login")
      }
    }

    handleCallback()
  }, [router])

  return (
    <main className="flex items-center justify-center h-screen">
      <p className="text-muted-foreground">Verifying your email...</p>
    </main>
  )
}
