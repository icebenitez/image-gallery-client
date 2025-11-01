"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import type { Image } from "@/types/gallery"
import { useAxiosClient } from "@/hooks/useAxiosClient"

const ITEMS_PER_PAGE = 4

interface GalleryContextType {
  images: Image[]
  // filteredImages: Image[]
  searchQuery: string
  selectedColor: string | null
  isLoading: boolean
  showUploadModal: boolean
  totalPages: number
  currentPage: number
  similarSearch: string | null

  setImages: (images: Image[]) => void
  // setFilteredImages: (images: Image[]) => void
  setSearchQuery: (query: string) => void
  setSelectedColor: (color: string | null) => void
  setIsLoading: (loading: boolean) => void
  setShowUploadModal: (show: boolean) => void
  setCurrentPage: (page: number) => void
  setTotalPages: (page: number) => void
  setSimilarSearch: (context: string | null) => void
  findSimilarImages: (type: "image" | "color", imageId: string, colorHex?: string) => Promise<void>
  resetFilters: () => void
}

const GalleryContext = createContext<GalleryContextType | undefined>(undefined)

export function GalleryProvider({ children }: { children: ReactNode }) {
  const [images, setImages] = useState<Image[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [similarSearch, setSimilarSearch] = useState<string | null>(null)

  const client = useAxiosClient()

  /**
   * Fetches similar images via API depending on search type.
   */
  const findSimilarImages = useCallback(
    async (type: "image" | "color", imageId: string, colorHex?: string) => {
      if (!client) {
        return;
      }
      setIsLoading(true)
      try {
        let similar: Image[] = []

        if (type === "image") {
          const response = await client.get(`/images/${imageId}/similar/tags`)
          console.log('response.data', response.data)
          similar = response.data.data
          setSimilarSearch(`image-${imageId}`)
          setTotalPages(response.data.metadata.totalItems / ITEMS_PER_PAGE)
          
        } else if (type === "color" && colorHex) {
          const response = await client.get(`/images/color/${encodeURIComponent(colorHex)}`)
          console.log('response.data', response.data)
          similar = response.data.data
          setSimilarSearch(`color-${colorHex}`)
          setTotalPages(response.data.metadata.totalItems / ITEMS_PER_PAGE)
        }

        setImages(similar)
        setCurrentPage(1)
        setSearchQuery("")
        setSelectedColor(null)
      } catch (err) {
        console.error("[findSimilarImages]", err)
      } finally {
        setIsLoading(false)
      }
    },
    [client],
  )

  const resetFilters = useCallback(() => {
    setSimilarSearch(null)
    setImages(images)
    setCurrentPage(1)
    setSearchQuery("")
    setSelectedColor(null)
  }, [images])

  return (
    <GalleryContext.Provider
      value={{
        images,
        // filteredImages,
        searchQuery,
        selectedColor,
        isLoading,
        showUploadModal,
        currentPage,
        similarSearch,
        totalPages,
        // nextPage,
        // prevPage,

        setImages,
        // setFilteredImages,
        setSearchQuery,
        setSelectedColor,
        setIsLoading,
        setShowUploadModal,
        setCurrentPage,
        // setNextPage,
        // setPrevPage,
        setTotalPages,
        setSimilarSearch,
        findSimilarImages,
        resetFilters,
      }}
    >
      {children}
    </GalleryContext.Provider>
  )
}

export function useGallery() {
  const context = useContext(GalleryContext)
  if (!context) {
    throw new Error("useGallery must be used within a GalleryProvider")
  }
  return context
}
