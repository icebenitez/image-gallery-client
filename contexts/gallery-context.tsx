"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

export type GalleryMode = "gallery" | "similar_image" | "similar_color"

export interface GalleryQuery {
  mode: GalleryMode
  query?: string
  imageId?: string
  color?: string
  page: number
}

interface GalleryContextType {
  query: GalleryQuery
  showUploadModal: boolean
  setShowUploadModal: (value: boolean) => void
  setQuery: (query: Partial<GalleryQuery>) => void
  resetFilters: () => void
}

const GalleryContext = createContext<GalleryContextType | undefined>(undefined)

export function GalleryProvider({ children }: { children: ReactNode }) {
  const [query, setQueryState] = useState<GalleryQuery>({ mode: "gallery", page: 1 })
  const [showUploadModal, setShowUploadModal] = useState(false)

  const setQuery = useCallback((partial: Partial<GalleryQuery>) => {
    setQueryState((prev) => ({ ...prev, ...partial }))
  }, [])

  const resetFilters = useCallback(() => {
    setQueryState({ mode: "gallery", page: 1 })
  }, [])

  return (
    <GalleryContext.Provider
      value={{
        query,
        showUploadModal,
        setShowUploadModal,
        setQuery,
        resetFilters,
      }}
    >
      {children}
    </GalleryContext.Provider>
  )
}

export function useGallery() {
  const context = useContext(GalleryContext)
  if (!context) throw new Error("useGallery must be used within a GalleryProvider")
  return context
}
