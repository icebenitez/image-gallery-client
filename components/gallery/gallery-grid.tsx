"use client"

import { useState } from "react"
import Image from "next/image"
import ImageDetailModal from "./image-detail-modal"
import type { Image as GalleryImage } from "@/types/gallery"
import { ERROR_FALLBACK_MESSAGE } from "@/lib/constants"
import { Skeleton } from "./skeleton"

interface GalleryGridProps {
  images: GalleryImage[]
}

export default function GalleryGrid({ images }: GalleryGridProps) {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)

  const handleSelect = (image: GalleryImage) => setSelectedImage(image)
  const handleCloseModal = () => setSelectedImage(null)

  if (!images || images.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No images found.
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image) => {
          const isProcessing =
            !image.originalUrl && !image.thumbnailUrl;

          return (
            <div
              key={image.id}
              onClick={() => handleSelect(image)}
              className="group relative overflow-hidden rounded-lg bg-muted cursor-pointer aspect-square"
            >
              {isProcessing ? (
                <Skeleton />
              ) : (
                <>
                  <Image
                    src={image.thumbnailUrl || image.originalUrl || "/placeholder.svg"}
                    alt={image.description || ERROR_FALLBACK_MESSAGE}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
                  />

                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                    <p className="text-white/80 text-xs mb-2 line-clamp-1">
                      {image.description || ERROR_FALLBACK_MESSAGE}
                    </p>

                    <div className="flex flex-wrap gap-1">
                      {image.tags?.length ? (
                        image.tags.map((tag) => (
                          <span
                            key={tag}
                            className="bg-primary/80 text-primary-foreground text-[10px] px-2 py-0.5 rounded"
                          >
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="text-white/60 text-xs">
                          {ERROR_FALLBACK_MESSAGE}
                        </span>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>


      {selectedImage && (
        <ImageDetailModal
          image={selectedImage}
          onClose={handleCloseModal}
        />
      )}
    </>
  )
}
