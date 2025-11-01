"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { toast } from "sonner"
import { useUser } from "@/contexts/auth-context"

export default function UserAvatar() {
    const router = useRouter()
    const [showDropdown, setShowDropdown] = useState(false)
    const { user } = useUser()
    const [isDarkMode, setIsDarkMode] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)


    useEffect(() => {
        // Check for dark mode preference
        const isDark = document.documentElement.classList.contains("dark")
        setIsDarkMode(isDark)
    }, [])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleToggleDarkMode = () => {
        const html = document.documentElement
        if (isDarkMode) {
            html.classList.remove("dark")
            localStorage.setItem("theme", "light")
        } else {
            html.classList.add("dark")
            localStorage.setItem("theme", "dark")
        }
        setIsDarkMode(!isDarkMode)
    }

    // 🚪 Logout
    const handleLogout = useCallback(async () => {
        try {
            const { error } = await supabase.auth.signOut()
            if (error) {
                console.error("Signout error:", error.message)
                return
            }
            router.push("/auth/login")
        } catch (err) {
            toast("Error", { description: "Logout failed" })
        }
    }, [router])

    const getInitials = (email: string) => {
        if (!email) { return "no email found" }
        return email
            .split("@")[0]
            .split(".")
            .map((part) => part[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold hover:opacity-90 transition-opacity"
            >
                {getInitials(user?.email || "")}
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-50">
                    {/* Email Display */}
                    <div className="px-4 py-3 border-b border-border">
                        <p className="text-sm text-muted-foreground">Signed in as {user?.email}</p>
                        <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
                    </div>

                    {/* Dark Mode Toggle */}
                    <button
                        onClick={handleToggleDarkMode}
                        className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted transition-colors flex items-center justify-between"
                    >
                        <span>Dark Mode</span>
                        <span className="text-xs">{isDarkMode ? "On" : "Off"}</span>
                    </button>

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-muted transition-colors border-t border-border"
                    >
                        Logout
                    </button>
                </div>
            )}
        </div>
    )
}
