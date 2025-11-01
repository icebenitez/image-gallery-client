import { createClient, SupabaseClient } from "@supabase/supabase-js"
import axios from "axios"
import OpenAI from "openai"
import getColors from "get-image-colors"
import sharp, { Stats } from "sharp"

// 🧩 Types
interface ImageRecord {
  id: string
  user_id: string
  original_path: string
  thumbnail_path?: string
}

interface MetadataFields {
  description?: string
  tags?: string[]
  colors?: string[]
  ai_processing_status?: "pending" | "processing" | "completed" | "error"
  updated_at?: string
}

interface AIResult {
  ok: boolean
  description?: string
  tags?: string[]
  error?: string
}

const supabaseServer: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

// 🔧 Configurable constants
const MODEL = process.env.OPENAI_MODEL || "gpt-5-nano"
const SIGNED_URL_EXPIRY = Number(process.env.AI_SIGNED_URL_EXPIRY || 120)
const PROMPT = `
You are an AI vision assistant that analyzes images.
Return your response strictly in JSON format with the following structure:

{
  "description": "A natural, concise sentence describing the image.",
  "tags": ["relevant", "keywords", "about", "the", "image"]
}

Guidelines:
- The description must sound human, not robotic (avoid "An image of..." or "This is a picture of...").
- Keep it short and natural (max 1 sentence).
`

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

/**
 * Update image metadata in Supabase
 */
async function updateMetadata(imageId: string, fields: MetadataFields): Promise<void> {
  await supabaseServer
    .from("image_metadata")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("image_id", imageId)
}

/**
 * Extract dominant colors from an image buffer
 */
async function extractDominantColors(
  imageBuffer: Buffer,
  count = 3,
  contentType: string
): Promise<string[]> {
  try {
    const format = contentType.includes("png") ? "image/png" : "image/jpeg"
    const colors = await getColors(imageBuffer, format)
    return colors.slice(0, count).map((c) => c.hex())
  } catch (err: any) {
    console.warn("⚠️ get-image-colors failed, using Sharp fallback:", err.message)
    try {
      const stats: Stats = await sharp(imageBuffer).stats()
      const d = stats.dominant
      const toHex = (v: number) => v.toString(16).padStart(2, "0")
      return [`#${toHex(d.r)}${toHex(d.g)}${toHex(d.b)}`]
    } catch (fallbackErr: any) {
      console.warn("⚠️ Sharp fallback failed:", fallbackErr.message)
      return []
    }
  }
}

/**
 * Process an image with OpenAI + local color extraction
 */
export async function processImageAI(imageRecord: ImageRecord): Promise<AIResult> {
  const imageId = imageRecord.id
  const expiry = SIGNED_URL_EXPIRY

  try {
    // 1️⃣ Get signed URL from Supabase
    const { data: signed } = await supabaseServer.storage
      .from("images")
      .createSignedUrl(imageRecord.original_path, expiry)

    if (!signed?.signedUrl)
      throw new Error("Failed to create signed URL from Supabase.")

    // 2️⃣ Download image
    const imageResponse = await axios.get<ArrayBuffer>(signed.signedUrl, {
      responseType: "arraybuffer",
    })

    console.log("Downloaded:", imageResponse.status, imageResponse.headers["content-type"])
    const contentType = imageResponse.headers["content-type"] || "image/jpeg"
    const imageBuffer = Buffer.from(imageResponse.data)

    // 3️⃣ Get description + tags from OpenAI
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: PROMPT },
            { type: "image_url", image_url: { url: signed.signedUrl } },
          ],
        },
      ],
    })

    // 4️⃣ Parse AI output
    let description = ""
    let tags: string[] = []
    const rawOutput = completion.choices[0].message?.content?.trim() || ""

    try {
      const parsed = JSON.parse(rawOutput)
      description = parsed.description || ""
      tags = parsed.tags || []
    } catch (err: any) {
      console.warn("⚠️ Failed to parse AI JSON:", err.message)
      description = rawOutput
      tags = []
    }

    // 5️⃣ Extract colors locally
    const colors = await extractDominantColors(imageBuffer, 3, contentType)
    console.log("colors", colors)

    // 6️⃣ Update metadata
    await updateMetadata(imageId, {
      description,
      tags,
      colors,
      ai_processing_status: "completed",
    })

    console.log(`✅ AI processing completed for image ${imageId}`)
    return { ok: true, description, tags }
  } catch (err: any) {
    console.error(`❌ AI processing failed for ${imageId}:`, err.message)
    await updateMetadata(imageId, { ai_processing_status: "error" })
    return { ok: false, error: err.message }
  }
}
