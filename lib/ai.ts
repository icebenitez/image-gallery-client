import { createClient } from "@supabase/supabase-js"
import axios from "axios"
import OpenAI from "openai"

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

const MAX_UPLOAD_SIZE = Number(process.env.MAX_UPLOAD_SIZE || 5 * 1024 * 1024);

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

// 🧠 Initialize OpenAI and Supabase clients
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

/**
 * Helper: update image metadata record
 */
async function updateMetadata(imageId, fields) {
    await supabaseServer
        .from("image_metadata")
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq("image_id", imageId)
}

/**
 * Extract dominant color using Sharp
 */
async function extractDominantColors(imageBuffer, count = 3, contentType) {
    try {
        const format = contentType.includes("png") ? "image/png" : "image/jpeg";
        const colors = await getColors(imageBuffer, format);
        return colors.slice(0, count).map((c) => c.hex());
    } catch (err) {
        console.warn("⚠️ get-image-colors failed, using Sharp fallback:", err.message);
        try {
            const stats = await sharp(imageBuffer).stats();
            const d = stats.dominant;
            const toHex = (v) => v.toString(16).padStart(2, "0");
            return [`#${toHex(d.r)}${toHex(d.g)}${toHex(d.b)}`];
        } catch (fallbackErr) {
            console.warn("⚠️ Sharp fallback failed:", fallbackErr.message);
            return [];
        }
    }
}

/**
 * Main AI processor: generates tags + description + colors
 */
export async function processImageAI(imageRecord) {
    const imageId = imageRecord.id
    const expiry = SIGNED_URL_EXPIRY

    try {
        // 1️⃣ Get signed URL from Supabase
        const { data: signed } = await supabaseServer.storage
            .from("images")
            .createSignedUrl(imageRecord.original_path, expiry)

        // await supabaseServer
        //   .from("image_metadata")
        //   .update({
        //     ai_processing_status: "processing",
        //     updated_at: new Date().toISOString(),
        //   })
        //   .eq("image_id", imageId);

        if (!signed?.signedUrl) throw new Error("Failed to create signed URL from Supabase.")

        // 2️⃣ Fetch image buffer for color extraction later
        const imageResponse = await axios.get(signed.signedUrl, { responseType: "arraybuffer" })
        console.log("Downloaded:", imageResponse.status, imageResponse.headers["content-type"]);
        const contentType = imageResponse.headers["content-type"] || "image/jpeg";

        const imageBuffer = Buffer.from(imageResponse.data)

        // 3️⃣ Ask OpenAI Vision for description + tags
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
            // temperature: 0.6,
        })

        // 4️⃣ Parse OpenAI output safely
        let description = ""
        let tags = []
        const rawOutput = completion.choices[0].message.content?.trim() || ""

        try {
            const parsed = JSON.parse(rawOutput)
            description = parsed.description || ""
            tags = parsed.tags || []
        } catch (err) {
            console.warn("⚠️ Failed to parse AI JSON:", err.message)
            description = rawOutput
            tags = []
        }

        // 5️⃣ Extract colors locally
        const colors = await extractDominantColors(imageBuffer, 3, contentType)
        console.log('colors', colors)

        // 6️⃣ Update metadata in Supabase
        await updateMetadata(imageId, {
            description,
            tags,
            colors,
            ai_processing_status: "completed",
        })

        console.log(`✅ OpenAI AI processing completed for image ${imageId}`)
        return { ok: true, description, tags }
    } catch (err) {
        console.error(`❌ OpenAI AI processing failed for ${imageId}:`, err.message)
        await updateMetadata(imageId, { ai_processing_status: "error" })
        return { ok: false, error: err.message }
    }
}
