"use client"

import { useGallery } from "@/contexts/gallery-context"

const COLORS = [
  { name: "Red", value: "red", hex: "#ef4444" },
  { name: "Orange", value: "orange", hex: "#f97316" },
  { name: "Yellow", value: "yellow", hex: "#eab308" },
  { name: "Green", value: "green", hex: "#22c55e" },
  { name: "Blue", value: "blue", hex: "#3b82f6" },
  { name: "Purple", value: "purple", hex: "#a855f7" },
  { name: "Pink", value: "pink", hex: "#ec4899" },
]

export default function ColorFilter() {
  const { query, setQuery, resetFilters } = useGallery()

  const handleColorSelect = (color: string, hex: string) => {
    setQuery({
      mode: "similar_color",
      color: hex,
      page: 1,
    })
  }

  const handleReset = () => {
    resetFilters()
  }

  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
      {/* All Button */}
      <button
        onClick={handleReset}
        className={`flex-shrink-0 px-4 py-2 rounded-full font-medium whitespace-nowrap transition-colors ${query.mode === "gallery"
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
      >
        All
      </button>

      {/* Color Buttons */}
      <div className="flex flex-shrink-0 gap-3 sm:gap-4">
        {COLORS.map((color) => (
          <button
            key={color.value}
            onClick={() => handleColorSelect(color.value, color.hex)}
            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full transition-transform hover:scale-110 ${query.color === color.hex ? "ring-2 ring-offset-2 ring-foreground" : ""
              }`}
            style={{ backgroundColor: color.hex }}
            title={color.name}
          />
        ))}
      </div>
    </div>

  )
}
