import useSWR from "swr"
import { useAxiosClient } from "@/hooks/useAxiosClient"
import type { Image } from "@/types/gallery"
import { ITEMS_PER_PAGE } from "@/lib/constants"
import { GalleryQuery } from "@/contexts/gallery-context"

export function useImages(query: GalleryQuery) {
  const client = useAxiosClient()

  const getKey = () => {
    if (!client) return null

    const params = new URLSearchParams({
      page: String(query.page),
      limit: String(ITEMS_PER_PAGE),
      ...(query.query ? { q: query.query } : {}),
    })

    switch (query.mode) {
      case "similar_image":
        console.log('similar_image')
        return `/images/${query.imageId}/similar/tags?${params}`
      case "similar_color":
        console.log('similar_color')
        return `/images/color/${encodeURIComponent(query.color || "")}?${params}`
      case "gallery":
      default:
        console.log('gallery')
        return `/images?${params}`
    }
  }

  const key = getKey()

  const fetcher = async (url: string) => {
    const res = await client!.get(url)
    return res.data
  }

  const swr = useSWR(key, fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
    refreshInterval: (data) => {
      if (!data?.data) return 0
      const stillProcessing = data.data.some(
        (img: Image) => img.aiProcessingStatus !== "completed"
      )
      return stillProcessing ? 30000 : 0 // 🔁 poll every 30s until done
    },
  })

  // console.log('data.message', swr.data)

  return {
    images: swr.data?.data as Image[] || [],
    totalItems: swr.data?.metadata?.totalItems ?? 0,
    totalPages: Math.ceil((swr.data?.metadata?.totalItems ?? 0) / ITEMS_PER_PAGE),
    isLoading: swr.isLoading,
    isError: !!swr.error,
    mutate: swr.mutate,
  }
}
