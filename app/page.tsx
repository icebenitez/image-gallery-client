"use client"

import { toast } from "sonner"
import { useGallery } from "@/contexts/gallery-context"
import { useImages } from "@/hooks/useImages"

import GalleryGrid from "@/components/gallery/gallery-grid"
import SearchBar from "@/components/gallery/search-bar"
import ColorFilter from "@/components/gallery/color-filter"
import UploadModal from "@/components/gallery/upload-modal"
import GallerySkeleton from "@/components/gallery/skeleton"
import UserAvatar from "@/components/gallery/user-avatar"

export default function GalleryPage() {
  const { query, setQuery, resetFilters, showUploadModal, setShowUploadModal } = useGallery()
  const { images, totalPages, isLoading } = useImages(query)

  const handleUploadSuccess = () => {
    setShowUploadModal(false)
    toast.success("Image uploaded successfully")
  }

  const hasNoImages = !isLoading && images.length === 0

  const getSimilarContextDisplay = () => {
    if (query.mode === "similar_image") return "Similar images"
    if (query.mode === "similar_color") return `Color: ${query.color}`
    return null
  }

  return (
    <main className="min-h-screen bg-background">
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

      <div className="max-w-7xl mx-auto px-4 py-8">
        {query.mode !== "gallery" && (
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

        {query.mode === "gallery" && (
          <div className="mb-8 space-y-4">
            <SearchBar/>
            <ColorFilter/>
          </div>
        )}

        {isLoading ? (
          <GallerySkeleton />
        ) : hasNoImages ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {query.mode !== "gallery" ? "No similar images found" : "No images found"}
            </p>
            {query.mode === "gallery" && (
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
                  onClick={() => setQuery({ page: Math.max(1, query.page - 1) })}
                  disabled={query.page === 1}
                  className="px-4 py-2 rounded-md border border-border text-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                >
                  Previous
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setQuery({ page })}
                      className={`w-10 h-10 rounded-md font-medium transition-colors ${query.page === page
                          ? "bg-primary text-primary-foreground"
                          : "border border-border text-foreground hover:bg-muted"
                        }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setQuery({ page: Math.min(totalPages, query.page + 1) })}
                  disabled={query.page === totalPages}
                  className="px-4 py-2 rounded-md border border-border text-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showUploadModal && (
        <UploadModal onClose={() => setShowUploadModal(false)} onSuccess={handleUploadSuccess} />
      )}
    </main>
  )
}
