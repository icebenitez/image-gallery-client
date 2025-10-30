"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import GalleryGrid from "@/components/gallery/gallery-grid"
import SearchBar from "@/components/gallery/search-bar"
import ColorFilter from "@/components/gallery/color-filter"
import UploadModal from "@/components/gallery/upload-modal"
import GallerySkeleton from "@/components/gallery/skeleton"
import UserAvatar from "@/components/gallery/user-avatar"

import { useCurrentUser } from "@/hooks/useAuth"
import { useSignedImages } from "@/hooks/useSignedImages"

export default function GalleryPage() {
  const router = useRouter()
  const { data, error } = useCurrentUser()

  const [showUploadModal, setShowUploadModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // ✅ now using your new hook
  const {
    images,
    loading: imagesLoading,
    error: imagesError,
    metadata
  } = useSignedImages(searchQuery, selectedColor, currentPage)

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

  const hasNoImages = !imagesLoading && images.length === 0

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Image Gallery</h1>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:opacity-90 transition-opacity"
            >
              Upload Image
            </button>
            <UserAvatar />
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
          <GallerySkeleton />
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
          <>
            <GalleryGrid images={images} />

            {metadata.totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-md border border-border text-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                >
                  Previous
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: metadata.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-md font-medium transition-colors ${currentPage === page
                          ? "bg-primary text-primary-foreground"
                          : "border border-border text-foreground hover:bg-muted"
                        }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-md border border-border text-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal onClose={() => setShowUploadModal(false)} onSuccess={handleUploadSuccess} />
      )}
    </main>
  )
}
