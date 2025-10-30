"use client"

import { useState } from "react"
import ImageComponent from "next/image"
import ImageDetailModal from "./image-detail-modal"
import { GalleryImage } from "@/types/gallery"

interface GalleryGridProps {
  images: GalleryImage[]
}

export default function GalleryGrid({ images }: GalleryGridProps) {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)

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
              src={image.thumbnail_url || image.original_url || "/placeholder.svg"}
              alt={image.metadata.description || "No description yet"}
              fill
              className="group-hover:scale-105 transition-transform duration-300"
            />

            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
              <p className="text-white/80 text-xs mb-2 line-clamp-1">{image.metadata.description || "No description"}</p>
              <div className="flex flex-wrap gap-1"></div>
              <div>
                {image.metadata.tags && image.metadata.tags.length > 0 ? (
                  image.metadata.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="bg-primary/80 text-primary-foreground text-xs px-2 py-0.5 mr-0.5 rounded">
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-white/60 text-xs">No tags</span>
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
