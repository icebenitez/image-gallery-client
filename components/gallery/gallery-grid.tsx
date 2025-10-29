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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map((image) => (
          <div
            key={image.id}
            onClick={() => setSelectedImage(image)}
            className="group relative overflow-hidden rounded-lg bg-muted cursor-pointer aspect-square"
          >
            <ImageComponent
              src={image.thumbnail_url || image.original_url || "/placeholder.svg"}
              alt={image.filename}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />

            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
              <h3 className="text-white font-semibold text-lg mb-1">{image.filename}</h3>
              <p className="text-white/80 text-sm mb-3 line-clamp-2">{image.description}</p>
              <div className="flex flex-wrap gap-2">
                {image.image_metadata.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="bg-primary/80 text-primary-foreground text-xs px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>
              <p className="text-white/60 text-xs mt-3">{new Date(image.uploadDate).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Image Detail Modal */}
      {selectedImage && <ImageDetailModal image={selectedImage} onClose={() => setSelectedImage(null)} />}
    </>
  )
}
