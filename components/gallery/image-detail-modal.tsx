"use client"

import { ERROR_FALLBACK_MESSAGE } from "@/lib/constants"
import NextImage from "next/image"
import type { Image } from "@/types/gallery"
import { useGallery } from "@/contexts/gallery-context"

interface ImageDetailModalProps {
  image: Image
  onClose: () => void
}

export default function ImageDetailModal({ image, onClose }: ImageDetailModalProps) {
  const { findSimilarImages } = useGallery()

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full aspect-video">
          <NextImage
            src={image.originalUrl || ""}
            alt={image.description}
            fill
            className="object-cover"
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">Image Details</h2>
          <h2 className="text-2xl font-bold text-foreground mb-2">{image.description || ERROR_FALLBACK_MESSAGE}</h2>
          <p className="text-muted-foreground mb-4">{image.description}</p>

          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">Tags</h3>
            {image.tags && image.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {image.tags?.map((tag) => (
                  <span key={tag} className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{ERROR_FALLBACK_MESSAGE}</p>
            )}
          </div>

          {image.colors && image.colors.length > 0 && (
            <div className="mb-4" >
              <h3 className="text-sm font-semibold text-foreground mb-2">Color Palette</h3>
              <div className="flex gap-3">
                {image.colors.map((hex, index) => (
                  <button
                    key={index}
                    onClick={async () => {
                      await findSimilarImages("color", image.id, hex)
                      onClose()
                    }}
                    className="flex flex-col items-center gap-1 hover:opacity-80 transition-opacity"
                    title={`Find images with color ${hex}`}
                  >
                    <div
                      className="w-12 h-12 rounded-lg border border-border shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                      style={{ backgroundColor: hex }}
                      title={hex}
                    />
                    <span className="text-xs text-muted-foreground font-mono">{hex}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Uploaded on {new Date(image.createdAt).toLocaleDateString()}
            </p>
            {image.aiProcessingStatus && (
              <span
                className={`text-xs font-medium ${image.aiProcessingStatus === "completed" ? "text-green-600" : "text-amber-600"
                  }`}
              >
                {image.aiProcessingStatus}
              </span>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-border">
            <button
              onClick={async () => {
                await findSimilarImages("image", image.id)
                onClose()
              }}
              className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:opacity-90 transition-opacity"
            >
              Find Similar Images
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
