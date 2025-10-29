"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import GalleryGrid from "@/components/gallery/gallery-grid"
import SearchBar from "@/components/gallery/search-bar"
import ColorFilter from "@/components/gallery/color-filter"
import UploadModal from "@/components/gallery/upload-modal"
import { toast } from "sonner"

interface Image {
  id: string
  url: string
  title: string
  description: string
  tags: string[]
  uploadDate: string
  color?: string
}

export default function GalleryPage() {
  const router = useRouter()
  const [images, setImages] = useState<Image[]>([])
  const [filteredImages, setFilteredImages] = useState<Image[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)

  // useEffect(() => {
  //   const checkAuth = async () => {
  //     try {
  //       const response = await fetch("/api/auth/check")
  //       if (!response.ok) {
  //         router.push("/auth/login")
  //       } else {
  //         loadImages()
  //       }
  //     } catch (error) {
  //       router.push("/auth/login")
  //     }
  //   }

  //   checkAuth()
  // }, [router])

  const loadImages = async () => {
    try {
      const response = await fetch("/api/images")
      if (response.ok) {
        const data = await response.json()
        setImages(data)
        setFilteredImages(data)
      }
    } catch (error) {
      toast("Error", {
        description: "Failed to load images",
        // variant: "destructive" 
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let filtered = images

    if (searchQuery) {
      filtered = filtered.filter(
        (img) =>
          img.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          img.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          img.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }

    if (selectedColor) {
      filtered = filtered.filter((img) => img.color === selectedColor)
    }

    setFilteredImages(filtered)
  }, [searchQuery, selectedColor, images])

  const handleUploadSuccess = () => {
    setShowUploadModal(false)
    // loadImages()
    toast("Success", { description: "Image uploaded successfully" })
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/")
    } catch (error) {
      toast("Error", {
        description: "Logout failed",
        // variant: "destructive" 
      })
    }
  }

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
        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <ColorFilter selectedColor={selectedColor} onColorChange={setSelectedColor} />
        </div>

        {/* Gallery Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-muted-foreground">Loading images...</div>
          </div>
        ) : filteredImages.length === 0 ? (
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
          <GalleryGrid images={filteredImages} />
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && <UploadModal onClose={() => setShowUploadModal(false)} onSuccess={handleUploadSuccess} />}
    </main>
  )
}
