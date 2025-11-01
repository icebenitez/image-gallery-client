"use client"

import { useGallery } from "@/contexts/gallery-context"

export default function SearchBar() {
  const { query, setQuery, setShowUploadModal } = useGallery()

  return (
    <div className="flex flex-col-reverse sm:flex-row gap-3 sm:items-center sm:justify-between w-full">
      {/* Search Input */}
      <div className="relative flex-1">
        <input
          type="text"
          placeholder="Search by title, description, or tags..."
          value={query.query || ""}
          onChange={(e) =>
            setQuery({
              query: e.target.value,
              mode: "gallery", // ensure we go back to gallery mode when searching
              page: 1,
            })
          }
          className="w-full px-4 py-3 rounded-md border border-input bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary pr-10"
        />
        <svg
          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Upload Button */}
      <button
        onClick={() => setShowUploadModal(true)}
        className="w-full sm:w-auto bg-primary text-primary-foreground px-4 py-3 rounded-md font-medium hover:opacity-90 transition-opacity"
      >
        Upload Image
      </button>
    </div>

  )
}
