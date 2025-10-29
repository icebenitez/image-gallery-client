import axios, { AxiosInstance } from "axios"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:4000"

/**
 * Creates an authenticated Axios client bound to a Supabase JWT.
 * All API requests require a valid token.
 */
export const createAxiosClient = (token: string): AxiosInstance => {
  if (!token) {
    throw new Error("Missing Supabase token: createAxiosClient requires a valid JWT.")
  }

  const client = axios.create({
    baseURL: BASE_URL,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    timeout: 15000,
  })

  // Optional logging and global error handling
  client.interceptors.request.use(
    (config) => {
      if (process.env.NODE_ENV === "development") {
        console.log("[Axios Request]", config.method?.toUpperCase(), config.url)
      }
      return config
    },
    (error) => Promise.reject(error)
  )

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (process.env.NODE_ENV === "development") {
        console.error("[Axios Error]", error.response || error.message)
      }

      if (error.response?.status === 401) {
        console.warn("Unauthorized — token may be invalid or expired.")
        // Optional: trigger global logout or redirect
      }

      return Promise.reject(error)
    }
  )

  return client
}
