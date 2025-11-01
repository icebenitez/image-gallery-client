"use client"

import { useState } from "react"
import ImageComponent from "next/image"
import ImageDetailModal from "./image-detail-modal"
import { Image } from "@/types/gallery"
import { ERROR_FALLBACK_MESSAGE } from "@/lib/constants"

interface GalleryGridProps {
  images: Image[]
}

export default function GalleryGrid({ images }: GalleryGridProps) {
  const [selectedImage, setSelectedImage] = useState<Image | null>(null)
  
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {images.map((image) => (
          <div
            key={image.id}
            onClick={() => setSelectedImage(image)}
            className="group relative overflow-hidden rounded-lg bg-muted cursor-pointer aspect-square"
          >
            <ImageComponent
              src={image.thumbnailUrl || image.originalUrl || "/placeholder.svg"}
              alt={image.description || ERROR_FALLBACK_MESSAGE}
              fill
              className="group-hover:scale-105 transition-transform duration-300"
            />

            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
              <p className="text-white/80 text-xs mb-2 line-clamp-1">{image.description || ERROR_FALLBACK_MESSAGE}</p>
              <div className="flex flex-wrap gap-1"></div>
              <div>
                {image.tags && image.tags.length > 0 ? (
                  image.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="bg-primary/80 text-primary-foreground text-xs px-2 py-0.5 mr-0.5 rounded">
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-white/60 text-xs">{ERROR_FALLBACK_MESSAGE}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div >

      {/* Image Detail Modal */}
      {selectedImage && <ImageDetailModal image={selectedImage} onClose={() => setSelectedImage(null)} />}
    </>
  )
}
