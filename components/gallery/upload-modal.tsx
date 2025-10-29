"use client"

import type React from "react"

import { useState, useRef } from "react"
// import { useToast } from "@/hooks/use-toast"
import { toast } from "sonner"

interface UploadModalProps {
    onClose: () => void
    onSuccess: () => void
}

export default function UploadModal({ onClose, onSuccess }: UploadModalProps) {
    //   const { toast } = useToast()
    const [files, setFiles] = useState<File[]>([])
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const fileInputRef = useRef<HTMLInputElement>(null)

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
        const droppedFiles = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith("image/"))
        setFiles((prev) => [...prev, ...droppedFiles])
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || [])
        setFiles((prev) => [...prev, ...selectedFiles])
    }

    const handleRemoveFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index))
    }

    const handleUpload = async () => {
        if (files.length === 0) {
            toast("Error",
                {
                    description: "Please select at least one image",
                })
            return
        }

        setIsUploading(true)
        setUploadProgress(0)

        try {
            const formData = new FormData()
            files.forEach((file) => {
                formData.append("files", file)
            })

            const response = await fetch("/api/images/upload", {
                method: "POST",
                body: formData,
            })

            if (response.ok) {
                setFiles([])
                setUploadProgress(0)
                onSuccess()
            } else {
                toast("Error",
                    {
                        description: "Upload failed",
                    })
            }
        } catch (error) {
            toast("Error",
                {
                    description: "An error occurred during upload",
                })
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-card rounded-lg max-w-md w-full p-6">
                <h2 className="text-2xl font-bold text-foreground mb-4">Upload Images</h2>

                {/* Drag and Drop Area */}
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
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
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:opacity-90 transition-opacity"
                    >
                        Select Files
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </div>

                {/* File List */}
                {files.length > 0 && (
                    <div className="mb-4 space-y-2 max-h-48 overflow-y-auto">
                        {files.map((file, index) => (
                            <div key={index} className="flex items-center justify-between bg-muted p-3 rounded-md">
                                <span className="text-sm text-foreground truncate">{file.name}</span>
                                <button
                                    onClick={() => handleRemoveFile(index)}
                                    className="text-destructive hover:text-destructive/80 font-medium"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Progress Bar */}
                {isUploading && (
                    <div className="mb-4">
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                            <div className="bg-primary h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 text-center">{uploadProgress}%</p>
                    </div>
                )}

                {/* Actions */}
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
                        {isUploading ? `Uploading... ${uploadProgress}%` : "Upload"}
                    </button>
                </div>
            </div>
        </div>
    )
}
