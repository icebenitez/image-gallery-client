"use client"

import NextImage from "next/image"
import { ERROR_FALLBACK_MESSAGE } from "@/lib/constants"
import type { Image } from "@/types/gallery"
import { useGallery } from "@/contexts/gallery-context"
import { useState } from "react"

interface ImageDetailModalProps {
  image: Image
  onClose: () => void
}

export default function ImageDetailModal({ image, onClose }: ImageDetailModalProps) {
  const { setQuery } = useGallery()
  const [isLoading, setIsLoading] = useState(true);

  const handleFindSimilarByImage = () => {
    setQuery({
      mode: "similar_image",
      imageId: image.id,
      page: 1,
    })
    onClose()
  }

  const handleFindSimilarByColor = (hex: string) => {
    setQuery({
      mode: "similar_color",
      color: hex,
      page: 1,
    })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image Preview */}
        <div className="relative w-full flex items-center justify-center bg-black rounded-t-lg min-h-[200px]">
          {/* Skeleton Loader */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-pulse bg-muted rounded-lg w-full h-full max-h-[80vh]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-muted-foreground animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 000 16v-4l3 3-3 3v-4a8 8 0 01-8-8z"
                  />
                </svg>
              </div>
            </div>
          )}

          {/* Actual Image */}
          <NextImage
            src={image.originalUrl || ""}
            alt={image.description || "Uploaded image"}
            width={0}
            height={0}
            sizes="100vw"
            className={`w-auto h-auto max-w-full max-h-[80vh] object-contain rounded-t-lg transition-opacity duration-500 ${isLoading ? "opacity-0" : "opacity-100"
              }`}
            priority
            onLoad={() => setIsLoading(false)}
          />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors z-10"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Details */}
        <div className="p-6">
          <h2 className="text-2xl font-bold text-foreground mb-2 text-center sm:text-left break-words">
            {image.description || "Untitled"}
          </h2>

          {/* Tags */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">Tags</h3>
            {image.tags?.length ? (
              <div className="flex flex-wrap gap-2">
                {image.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No tags available</p>
            )}
          </div>

          {/* Color Palette */}
          {image.colors?.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-foreground mb-2">Color Palette</h3>
              <div className="flex flex-wrap gap-3">
                {image.colors.map((hex, index) => (
                  <button
                    key={index}
                    onClick={() => handleFindSimilarByColor(hex)}
                    className="flex flex-col items-center gap-1 hover:opacity-80 transition-opacity"
                    title={`Find images with color ${hex}`}
                  >
                    <div
                      className="w-12 h-12 rounded-lg border border-border shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                      style={{ backgroundColor: hex }}
                    />
                    <span className="text-xs text-muted-foreground font-mono">{hex}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-border gap-2">
            <p className="text-sm text-muted-foreground">
              Uploaded on {new Date(image.uploadedAt).toLocaleDateString()}
            </p>
            {image.aiProcessingStatus && (
              <span
                className={`text-xs font-medium ${image.aiProcessingStatus === "completed"
                    ? "text-green-600"
                    : "text-amber-600"
                  }`}
              >
                {image.aiProcessingStatus}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 pt-4 border-t border-border">
            <button
              onClick={handleFindSimilarByImage}
              className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:opacity-90 transition-opacity"
            >
              Find Similar Images
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
