import { NextRequest, NextResponse } from "next/server";
import { getUserSupabaseClient } from "@/lib/supabaseClient";
import { verifyUser } from "@/lib/verifyUser";
import { MAX_UPLOAD_SIZE } from "@/lib/constants";
import { processImageAI } from "@/lib/ai";
import sharp from "sharp";
import { getMetaField, safeCreateSignedUrl } from "@/lib/helpers";

async function uploadToSupabase(userId, token, file: File) {
  if (!["image/jpeg", "image/png"].includes(file.type)) {
    throw new Error("Unsupported file format. Only JPEG/PNG allowed.");
  }

  const supabase = getUserSupabaseClient(token);

  const timestamp = Date.now();
  const baseName = `${timestamp}_${file.name.replace(/\s+/g, "_")}`;
  const originalPath = `${userId}/originals/${baseName}`;
  const thumbnailPath = `${userId}/thumbnails/${baseName}.jpg`;

  // Convert File -> Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  const thumbnailBuffer = await sharp(buffer)
    .resize(300, 300, { fit: "cover" })
    .toFormat("jpeg")
    .toBuffer();

  // Upload original and thumbnail in parallel
  const [origRes, thumbRes] = await Promise.all([
    supabase.storage.from("images").upload(originalPath, buffer, {
      contentType: file.type,
      upsert: false,
    }),
    supabase.storage.from("images").upload(thumbnailPath, thumbnailBuffer, {
      contentType: "image/jpeg",
      upsert: false,
    }),
  ]);

  if (origRes.error) throw origRes.error;
  if (thumbRes.error) throw thumbRes.error;

  const [origSignedUrl, thumbSignedUrl] = await Promise.all([
    supabase.storage
      .from("images")
      .createSignedUrl(originalPath, 60 * 60 * 24), // 24 hours
    supabase.storage
      .from("images")
      .createSignedUrl(thumbnailPath, 60 * 60 * 24) // 24 hours
  ])

  if (origSignedUrl.error) throw origSignedUrl.error;
  if (thumbSignedUrl.error) throw thumbSignedUrl.error;

  // Insert into images table
  const { data: imageData, error: insertErr } = await supabase
    .from("images")
    .insert({
      user_id: userId,
      filename: file.name,
      original_path: originalPath,
      thumbnail_path: thumbnailPath,
    })
    .select()
    .single();

  if (insertErr) throw insertErr;

  // Insert metadata row with processing status
  const { error: metaErr } = await supabase.from("image_metadata").insert({
    image_id: imageData.id,
    user_id: userId,
    ai_processing_status: "processing",
  });

  if (metaErr) throw metaErr;

  // Return image info + signed URLs
  return {
    ...imageData,
    originalUrl: origSignedUrl?.data?.signedUrl || null,
    thumbnailUrl: thumbSignedUrl?.data?.signedUrl || null
  };
}

export async function GET(req: NextRequest) {
  try {
    const verified = await verifyUser(req);
    if (!verified) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user, token } = verified;

    if (!user.id) {
      return NextResponse.json(
        { success: false, message: "User not authenticated" },
        { status: 401 }
      );
    }

    const supabase = getUserSupabaseClient(token);

    // 🔍 2️⃣ Extract query params
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || null;
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 20);
    const order = searchParams.get("order") || "desc";
    const offset = (page - 1) * limit;

    // 🧠 3️⃣ Fetch images using RPC
    const { data, error } = await supabase.rpc("search_images_v2", {
      user_uuid: user.id,
      search_text: q || null,
      sort_order: order,
      limit_count: limit,
      offset_count: offset,
    });

    if (error) throw error;

    // 🧮 4️⃣ Count total matching images (for pagination)
    const { count, error: countError } = await supabase
      .from("images")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (countError) throw countError;

    const totalImages = count || 0;
    const totalPages = Math.max(1, Math.ceil(totalImages / limit));

    // 🪄 5️⃣ Generate signed URLs
    const signedImages = await Promise.all(
      (data || []).map(async (img: any) => {
        const origSignedUrl = await safeCreateSignedUrl(supabase, img.original_path);
        const thumbSignedUrl = await safeCreateSignedUrl(supabase, img.thumbnail_path);
        const meta = img.metadata || {};

        return {
          id: img.id,
          tags: getMetaField(meta, "tags", []),
          description: getMetaField(meta, "description", null),
          colors: getMetaField(meta, "colors", []),
          createdAt: getMetaField(meta, "created_at", null),
          aiProcessingStatus: getMetaField(meta, "ai_processing_status", "pending"),
          originalUrl: origSignedUrl,
          thumbnailUrl: thumbSignedUrl,
        };
      })
    );

    // ✅ 6️⃣ Return paginated response
    return NextResponse.json(
      {
        success: true,
        message: "OK",
        metadata: {
          currentPage: page,
          totalPages,
          nextPage: page < totalPages ? page + 1 : null,
          prevPage: page > 1 ? page - 1 : null,
          limit,
          totalItems: totalImages,
        },
        data: signedImages,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("GET /images error:", err?.message || err);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch images",
        errorCode: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("images");

    if (!files?.length) {
      return NextResponse.json(
        { success: false, message: "No images uploaded" },
        { status: 400 }
      );
    }

    // 🔐 Replace with your auth logic or middleware extraction
    const verified = await verifyUser(req);
    if (!verified) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user, token } = verified;

    const results = [];

    for (const file of files) {
      if (!file || !(file instanceof Blob)) continue;

      if (file.size > MAX_UPLOAD_SIZE) {
        results.push({ error: `${file.name} exceeds upload size limit` });
        continue;
      }

      console.log('file', file.name)

      try {
        // uploadToSupabase handles bucket upload + DB insert
        const image = await uploadToSupabase(user.id, token, file);

        // Fire and forget AI processing
        processImageAI(image)
          .then(() => console.log(`AI done for ${image.id}`))
          .catch((err) => console.error(`AI error ${image.id}:`, err));

        results.push({
          id: image.id,
          originalUrl: image.originalUrl,
          thumbnailUrl: image.thumbnailUrl,
          aiProcessingStatus: "processing",
        });
      } catch (upErr) {
        console.error("Upload error:", upErr);
        results.push({
          error: upErr?.message || `Upload failed for ${file.name}`,
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Upload started. AI processing running in background.",
        data: results,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Upload route error:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Upload failed",
        errorCode: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}