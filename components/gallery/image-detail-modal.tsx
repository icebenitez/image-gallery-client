"use client"

import NextImage from "next/image"

interface GalleryImage {
  id: string
  url: string
  title: string
  description: string
  tags: string[]
  uploadDate: string
  color?: string
  colorSwatches?: string[]
}

interface ImageDetailModalProps {
  image: GalleryImage
  onClose: () => void
}

export default function ImageDetailModal({ image, onClose }: ImageDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full aspect-video">
          <NextImage
            src={image.original_url}
            alt={image.metadata.description}
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
          <h2 className="text-2xl font-bold text-foreground mb-2">{image.metadata.description || "Generating description for this image..."}</h2>
          <p className="text-muted-foreground mb-4">{image.description}</p>

          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">Tags</h3>
            {image.metadata.tags && image.metadata.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {image.metadata.tags?.map((tag) => (
                  <span key={tag} className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Generating tags for this image...</p>
            )}
          </div>

          {image.metadata.colors && image.metadata.colors.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-foreground mb-2">Color Palette</h3>
              <div className="flex gap-3">
                {image.metadata.colors.map((hex, index) => (
                  <div key={index} className="flex flex-col items-center gap-1">
                    <div
                      className="w-12 h-12 rounded-lg border border-border shadow-sm"
                      style={{ backgroundColor: hex }}
                      title={hex}
                    />
                    <span className="text-xs text-muted-foreground font-mono">{hex}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
