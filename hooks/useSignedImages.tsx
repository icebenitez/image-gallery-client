"use client"

import { useEffect, useState } from "react"
import { useDebounce } from "@/hooks/useDebounce" // optional helper
import { createAxiosClient } from "@/lib/axios"
import { useCurrentUser } from "@/hooks/useAuth"

interface GalleryImage {
  id: string
  url: string
  title: string
  description: string
  tags: string[]
  uploadDate: string
  color?: string
}

export function useSignedImages(
  searchQuery?: string,
  selectedColor?: string | null,
  page: number = 1
) {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { data } = useCurrentUser()

  // debounce search and filter
  const debouncedQuery = useDebounce(searchQuery, 400)
  const debouncedColor = useDebounce(selectedColor, 400)

  useEffect(() => {
    if (!data?.token) return
    const controller = new AbortController()
    const client = createAxiosClient(data.token)

    async function fetchImages() {
      setLoading(true)
      setError(null)

      try {
        const response = await client.get("/api/v1/images", {
          signal: controller.signal,
          params: {
            q: debouncedQuery || undefined,
            color: debouncedColor || undefined,
            page,
            limit: 20,
            sort: "uploaded_at",
            order: "desc",
          },
        })

        console.log('response.data.images', response.data.images)

        setImages(response.data.images)
      } catch (err: any) {
        if (err.name !== "CanceledError" && err.name !== "AbortError") {
          console.error("[useSignedImages]", err)
          setError("Failed to load images")
        }
      } finally {
        setLoading(false)
      }
    }

    fetchImages()
    return () => controller.abort()
  }, [debouncedQuery, debouncedColor, page, data?.token])

  return { images, loading, error }
}
