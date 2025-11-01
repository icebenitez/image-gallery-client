import { NextRequest, NextResponse } from "next/server";
import { getUserSupabaseClient } from "@/lib/supabaseClient";
import { ImageMetadata } from "@/lib/similarity";
import { verifyUser } from "@/lib/verifyUser";
import { getMetaField, safeCreateSignedUrl } from "@/lib/helpers";

const MIN_SCORE = 0.3;

/**
 * Create a binary vector for tag presence.
 * @param tags - The tags for one image
 * @param all - All image_metadata rows
 * @returns binary vector
 */
function vectorizeTags(tags: string[], all: ImageMetadata[]): number[] {
  // Build global tag vocabulary
  const allTags = Array.from(new Set(all.flatMap((img) => img.tags || [])));
  return allTags.map((t) => (tags.includes(t) ? 1 : 0));
}

/**
 * Compute cosine similarity between two binary vectors.
 * @param a - first vector
 * @param b - second vector
 * @returns cosine similarity (0–1)
 */
function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, ai, i) => sum + ai * (b[i] || 0), 0);
  const magA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const magB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return magA && magB ? dot / (magA * magB) : 0;
}

export async function GET(
    req: NextRequest, 
    context: RouteContext<'/api/images/[id]/similar/tags'>
) {
    try {
        const { id } = await context.params;
        const searchParams = req.nextUrl.searchParams;
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "10", 10);
        const offset = (page - 1) * limit;

        // 🧩 You might get the user + token from headers or cookies
        const verified = await verifyUser(req);
        if (!verified) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { user, token } = verified;
        if (!user.id) {
            return NextResponse.json(
                { success: false, message: "Unauthorized", errorCode: "UNAUTHORIZED" },
                { status: 401 }
            );
        }

        if (!id || isNaN(Number(id))) {
            return NextResponse.json(
                { success: false, message: "Invalid image ID", errorCode: "BAD_REQUEST" },
                { status: 400 }
            );
        }

        const supabase = getUserSupabaseClient(token);

        // 🧠 1️⃣ Fetch target image metadata
        const { data: targetData, error: targetError } = await supabase
            .from("image_metadata")
            .select("tags")
            .eq("image_id", id)
            .eq("user_id", user.id)
            .single();

        if (targetError || !targetData) {
            return NextResponse.json(
                { success: false, message: "Image not found or no metadata", errorCode: "NOT_FOUND" },
                { status: 404 }
            );
        }

        const targetTags = targetData.tags || [];
        if (!targetTags.length) {
            return NextResponse.json({
                success: true,
                message: "No tags to compare",
                metadata: { currentPage: 1, totalPages: 1, nextPage: null, prevPage: null, limit, totalItems: 0 },
                data: [],
            });
        }

        // 🖼️ 2️⃣ Fetch all other images for same user
        const { data: others, error: othersError } = await supabase
            .from("image_metadata")
            .select("image_id, tags")
            .eq("user_id", user.id)
            .neq("image_id", id)
            .not("tags", "is", null)
            .not("tags", "eq", "{}");

        if (othersError) throw othersError;
        if (!others?.length) {
            return NextResponse.json({
                success: true,
                message: "No other images",
                metadata: { currentPage: page, totalPages: 1, nextPage: null, prevPage: null, limit, totalItems: 0, imageId: id },
                data: [],
            });
        }

        // 📐 3️⃣ Compute cosine similarity
        const targetVector = vectorizeTags(targetTags, others);
        const similarities = others.map((img: any) => ({
            image_id: img.image_id,
            score: cosineSimilarity(targetVector, vectorizeTags(img.tags || [], others)),
        }));

        const sortedSimilarities = similarities
            .filter((s) => s.score >= MIN_SCORE)
            .sort((a, b) => b.score - a.score);

        const totalItems = sortedSimilarities.length;
        const totalPages = Math.ceil(totalItems / limit);
        const paginated = sortedSimilarities.slice(offset, offset + limit);
        const similarIds = paginated.map((s) => s.image_id);

        if (!similarIds.length) {
            return NextResponse.json({
                success: true,
                message: "No similar images within threshold",
                metadata: { currentPage: page, totalPages, nextPage: null, prevPage: null, limit, totalItems: 0, imageId: id },
                data: [],
            });
        }

        // 🧾 4️⃣ Fetch image + metadata
        const [{ data: imageData, error: imageError }, { data: metadataData, error: metadataError }] =
            await Promise.all([
                supabase.from("images").select("id, original_path, thumbnail_path").in("id", similarIds),
                supabase
                    .from("image_metadata")
                    .select("image_id, tags, description, colors, created_at, ai_processing_status")
                    .in("image_id", similarIds),
            ]);

        if (imageError) throw imageError;
        if (metadataError) throw metadataError;

        // 🪄 5️⃣ Merge + signed URLs
        const merged = await Promise.all(
            (imageData || []).map(async (img: any) => {
                const meta = (metadataData || []).find((m: any) => m.image_id === img.id) || {};
                const origSignedUrl = await safeCreateSignedUrl(supabase, img.original_path);
                const thumbSignedUrl = await safeCreateSignedUrl(supabase, img.thumbnail_path);
                const score = sortedSimilarities.find((s) => s.image_id === img.id)?.score || 0;

                return {
                    id: img.id,
                    tags: getMetaField(meta, "tags", []),
                    description: getMetaField(meta, "description", null),
                    colors: getMetaField(meta, "colors", []),
                    createdAt: getMetaField(meta, "created_at", null),
                    aiProcessingStatus: getMetaField(meta, "ai_processing_status", "pending"),
                    originalUrl: origSignedUrl,
                    thumbnailUrl: thumbSignedUrl,
                    similarityScore: Number(score.toFixed(3)),
                };
            })
        );

        return NextResponse.json({
            success: true,
            message: "Similar images fetched successfully",
            metadata: {
                currentPage: page,
                totalPages,
                nextPage: page < totalPages ? page + 1 : null,
                prevPage: page > 1 ? page - 1 : null,
                limit,
                totalItems,
                imageId: id,
            },
            data: merged,
        });
    } catch (err) {
        console.error("GET /api/images/[id]/similar/tags error:", err);
        return NextResponse.json(
            { success: false, message: "Failed to fetch similar images", errorCode: "INTERNAL_ERROR" },
            { status: 500 }
        );
    }
}
