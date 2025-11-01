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
import { useAxiosClient } from "@/hooks/useAxiosClient"
import { useDebounce } from "@/hooks/useDebounce"
import { useGallery } from "@/contexts/gallery-context"

const ITEMS_PER_PAGE = 4

export default function GalleryPage() {
  const router = useRouter()
  const { data, error: userError } = useCurrentUser()
  const client = useAxiosClient()

  const {
    images,
    searchQuery,
    selectedColor,
    isLoading,
    showUploadModal,
    currentPage,
    totalPages,
    similarSearch,
    setImages,
    setSearchQuery,
    setSelectedColor,
    setIsLoading,
    setShowUploadModal,
    setCurrentPage,
    setTotalPages,
    // findSimilarImages,
    resetFilters,
  } = useGallery();
  const [error, setError] = useState<string | null>(null)
  const debouncedQuery = useDebounce(searchQuery, 400)
  const debouncedColor = useDebounce(selectedColor, 400)

  // 🚪 Redirect unauthenticated users
  useEffect(() => {
    if (userError && !data?.user) {
      router.push("/auth/login")
    }
  }, [userError, data, router])

  // 🧠 Fetch images
  useEffect(() => {
    if (similarSearch) return;
    const controller = new AbortController()

    async function fetchImages() {
      setIsLoading(true)
      setError(null)

      try {
        if (!client) return
        const response = await client.get("/images", {
          signal: controller.signal,
          params: {
            q: debouncedQuery || undefined,
            color: debouncedColor || undefined,
            page: currentPage,
            limit: ITEMS_PER_PAGE,
            sort: "uploaded_at",
          },
        })

        setImages(response.data.data)
        setTotalPages(response.data.metadata.totalItems / ITEMS_PER_PAGE)
        
      } catch (err: any) {
        if (err.name !== "CanceledError" && err.name !== "AbortError") {
          console.error("[GalleryPage]", err)
          setError("Failed to load images")
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchImages()
    return () => controller.abort()
  }, [client, debouncedQuery, debouncedColor, currentPage, similarSearch])

  // 🧩 Upload success reloads images
  const handleUploadSuccess = useCallback(() => {
    setShowUploadModal(false)
    toast("Success", { description: "Image uploaded successfully" })
    // Trigger reload
    setCurrentPage(1)
  }, [])

  const getSimilarContextDisplay = () => {
    if (!similarSearch) return null
    if (similarSearch.startsWith("image-")) {
      const imageId = similarSearch.substring(6)
      const image = images.find((img) => img.id === imageId)
      return image ? `Images similar to "${image.description}"` : "Similar images"
    }
    if (similarSearch.startsWith("color-")) {
      const hex = similarSearch.substring(6)
      return `Color: ${hex}`
    }
    return null
  }

  const hasNoImages = !isLoading && images.length === 0

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

        {similarSearch && (
          <div className="mb-6 p-4 bg-muted rounded-lg flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Viewing similar images:</p>
              <p className="text-lg font-semibold text-foreground">{getSimilarContextDisplay()}</p>
            </div>
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 transition-opacity"
            >
              Back to Gallery
            </button>
          </div>
        )}

        {/* Search + Filter */}
        {!similarSearch && (
          <div className="mb-8 space-y-4">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
            <ColorFilter selectedColor={selectedColor} onColorChange={setSelectedColor} />
          </div>
        )}

        {/* Gallery */}
        {isLoading ? (
          <GallerySkeleton />
        ) : hasNoImages ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {similarSearch ? "No similar images found" : "No images found"}
            </p>
            {!similarSearch && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:opacity-90 transition-opacity"
              >
                Upload your first image
              </button>
            )}
          </div>
        ) : (
          <>
            <GalleryGrid images={images} />

            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-md border border-border text-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                >
                  Previous
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
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
