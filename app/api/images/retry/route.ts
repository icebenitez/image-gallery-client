import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { processImageAI } from "@/lib/ai";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Server-side Supabase client (Service Role key)
 * Used only for background jobs, AI processing, and cron.
 */
export const supabaseServer = createClient(
  supabaseUrl,
  serviceKey,
  { auth: { persistSession: false } }
);

export async function PATCH(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1️⃣ Fetch all pending images
    const { data: pendingMetas, error } = await supabaseServer
      .from("image_metadata")
      .select("image_id, ai_processing_status")
      .eq("ai_processing_status", "pending");

    if (error) {
      console.error("Failed to fetch pending images:", error);
      return NextResponse.json(
        {
          success: false,
          message: "Failed to fetch pending images",
          errorCode: "INTERNAL_ERROR",
        },
        { status: 500 }
      );
    }

    if (!pendingMetas || pendingMetas.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No pending images to process",
        metadata: { totalPending: 0 },
        data: [],
      });
    }

    // 2️⃣ Fetch full image records
    const imageIds = pendingMetas.map((m) => m.image_id);
    const { data: images, error: imgErr } = await supabaseServer
      .from("images")
      .select("*")
      .in("id", imageIds);

    if (imgErr) {
      console.error("Failed to fetch images:", imgErr);
      return NextResponse.json(
        {
          success: false,
          message: "Failed to fetch images for processing",
          errorCode: "INTERNAL_ERROR",
        },
        { status: 500 }
      );
    }

    // 3️⃣ Process each image (fire and forget)
    const started: string[] = [];
    for (const image of images) {
      started.push(image.id);
      processImageAI(image)
        .then(() => console.log(`AI reprocess done: ${image.id}`))
        .catch((err) => console.error(`AI reprocess error ${image.id}:`, err));
    }

    return NextResponse.json({
      success: true,
      message: "Pending image reprocessing started",
      metadata: {
        totalPending: images.length,
        started: started.length,
      },
      data: started.map((id) => ({ imageId: id })),
    });
  } catch (err) {
    console.error("Retry cron error:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Retry job failed",
        errorCode: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
