"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import GalleryGrid from "@/components/gallery/gallery-grid"
import SearchBar from "@/components/gallery/search-bar"
import ColorFilter from "@/components/gallery/color-filter"
import UploadModal from "@/components/gallery/upload-modal"
import { toast } from "sonner"
import { useCurrentUser } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabaseClient"
import { useSignedImages } from "@/hooks/useSignedImages"

export default function GalleryPage() {
  const router = useRouter()
  const { data, error } = useCurrentUser()

  const [showUploadModal, setShowUploadModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  // ✅ now using your new hook
  const {
    images,
    loading: imagesLoading,
    error: imagesError,
  } = useSignedImages(searchQuery, selectedColor, page)

  // 🚪 Redirect unauthenticated users
  useEffect(() => {
    if (error && !data?.user) {
      router.push("/auth/login")
    }
  }, [error, data, router])

  // 🧩 Upload success reloads images
  const handleUploadSuccess = useCallback(() => {
    setShowUploadModal(false)
    toast("Success", { description: "Image uploaded successfully" })
  }, [])

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

  const hasNoImages = !imagesLoading && images.length === 0

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Image Gallery</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:opacity-90 transition-opacity"
            >
              Upload Image
            </button>
            <button
              onClick={handleLogout}
              className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md font-medium hover:opacity-90 transition-opacity"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search + Filter */}
        <div className="mb-8 space-y-4">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <ColorFilter selectedColor={selectedColor} onColorChange={setSelectedColor} />
        </div>

        {/* Gallery */}
        {imagesLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-muted-foreground">Loading images...</div>
          </div>
        ) : hasNoImages ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No images found</p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:opacity-90 transition-opacity"
            >
              Upload your first image
            </button>
          </div>
        ) : (
          <GalleryGrid images={images} />
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal onClose={() => setShowUploadModal(false)} onSuccess={handleUploadSuccess} />
      )}
    </main>
  )
}
