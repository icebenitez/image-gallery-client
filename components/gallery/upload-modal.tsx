"use client"

import { useState, useRef } from "react"
import { toast } from "sonner"
import { useAxiosClient } from "@/hooks/useAxiosClient"
import { useGallery } from "@/contexts/gallery-context"
import { useImages } from "@/hooks/useImages"
import type { Image } from "@/types/gallery"

interface UploadModalProps {
  onClose: () => void
  onSuccess: () => void
}

interface UploadFile {
  file: File
  progress: number
  status: "pending" | "uploading" | "success" | "error"
}

export default function UploadModal({ onClose, onSuccess }: UploadModalProps) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const client = useAxiosClient()
  const { query } = useGallery()
  const { mutate } = useImages(query) // 🔥 SWR hook

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.currentTarget.classList.add("bg-muted")
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("bg-muted")
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.currentTarget.classList.remove("bg-muted")
    const droppedFiles = Array.from(e.dataTransfer.files)
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => ({ file, progress: 0, status: "pending" as const }))
    setFiles((prev) => [...prev, ...droppedFiles])
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []).map((file) => ({
      file,
      progress: 0,
      status: "pending" as const,
    }))
    setFiles((prev) => [...prev, ...selectedFiles])
  }

  const handleRemoveFile = (index: number) => {
    if (isUploading) return
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (!client) return
    if (files.length === 0) {
      toast.error("Please select at least one image")
      return
    }

    setIsUploading(true)

    try {
      await Promise.all(
        files.map(async (fileItem, index) => {
          setFiles((prev) =>
            prev.map((f, i) => (i === index ? { ...f, status: "uploading" } : f))
          )

          const formData = new FormData()
          formData.append("images", fileItem.file)

          try {
            // Optimistic UI — create placeholder
            const tempId = crypto.randomUUID()
            const optimisticImage: Image = {
              id: tempId,
              originalUrl: "",
              thumbnailUrl: "",
              description: "Uploading...",
              tags: [],
              uploadedAt: new Date().toISOString(),
              colors: [],
              aiProcessingStatus: "pending",
            }

            // ⚡ Optimistically add image to cache before upload finishes
            await mutate(
              (prev) =>
                prev
                  ? {
                      ...prev,
                      data: [optimisticImage, ...(prev.data || [])],
                    }
                  : { data: [optimisticImage] },
              { revalidate: false }
            )

            const response = await client.post("/images", formData, {
              headers: { "Content-Type": "multipart/form-data" },
              onUploadProgress: (event) => {
                if (event.total) {
                  const percent = Math.round((event.loaded * 100) / event.total)
                  setFiles((prev) =>
                    prev.map((f, i) =>
                      i === index ? { ...f, progress: percent } : f
                    )
                  )
                }
              },
            })

            if (!response.data?.data) throw new Error("Invalid response from server")

            setFiles((prev) =>
              prev.map((f, i) =>
                i === index ? { ...f, status: "success", progress: 100 } : f
              )
            )

            // Finalize SWR cache with uploaded image
            const uploadedImages: Image[] = response.data.data.map((file: any) => ({
              id: file.id,
              originalUrl: file.originalUrl,
              thumbnailUrl: file.thumbnailUrl,
              description: file.description || "",
              tags: file.tags || [],
              uploadedAt: new Date().toISOString(),
              colors: file.colors || [],
              aiProcessingStatus: "processing",
            }))

            await mutate(
              (prev) =>
                prev
                  ? {
                      ...prev,
                      data: [
                        ...uploadedImages,
                        ...(prev.data || []).filter((img) => img.id !== tempId),
                      ],
                    }
                  : { data: uploadedImages },
              { revalidate: false }
            )
          } catch (err) {
            console.error("[Upload Error]", err)
            setFiles((prev) =>
              prev.map((f, i) =>
                i === index ? { ...f, status: "error" } : f
              )
            )
          }
        })
      )

      toast.success("All uploads complete")
      await mutate()
      onSuccess()
      setFiles([])
    } catch (err) {
      toast.error("One or more uploads failed")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-lg max-w-md w-full p-6 shadow-lg">
        <h2 className="text-2xl font-bold text-foreground mb-4">Upload Images</h2>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-lg p-8 text-center mb-4 transition-colors cursor-pointer hover:border-primary"
        >
          <svg
            className="w-12 h-12 mx-auto text-muted-foreground mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <p className="text-foreground font-medium mb-1">Drag and drop images here</p>
          <p className="text-muted-foreground text-sm mb-4">or click to select files</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {files.length > 0 && (
          <div className="mb-4 space-y-2 max-h-48 overflow-y-auto">
            {files.map((fileItem, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-muted p-3 rounded-md"
              >
                <div className="flex-1">
                  <span className="text-sm text-foreground truncate block">
                    {fileItem.file.name}
                  </span>
                  <div className="w-full bg-muted-foreground/20 h-2 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        fileItem.status === "error"
                          ? "bg-destructive"
                          : "bg-primary"
                      }`}
                      style={{ width: `${fileItem.progress}%` }}
                    />
                  </div>
                </div>
                <div className="ml-3 text-sm">
                  {fileItem.status === "success" && (
                    <span className="text-green-500">✓</span>
                  )}
                  {fileItem.status === "error" && (
                    <span className="text-destructive">✕</span>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveFile(index)}
                  disabled={isUploading}
                  className="ml-3 text-destructive hover:text-destructive/80 font-medium disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="flex-1 bg-muted text-muted-foreground px-4 py-2 rounded-md font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={isUploading || files.length === 0}
            className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isUploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>
    </div>
  )
}
