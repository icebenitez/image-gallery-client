export interface ApiImage {
  id: string
  user_id: string
  filename: string
  original_path: string
  thumbnail_path: string
  uploaded_at: string
  metadata: {
    description: string
    tags: string[]
    colors: string[]
    ai_processing_status: string
  }
}

export interface ApiImageResponse {
  total: number
  page: number
  limit: number
  images: ApiImage[]
}
