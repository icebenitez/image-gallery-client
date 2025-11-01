import { NextRequest, NextResponse } from "next/server";
import { getMetaField, safeCreateSignedUrl } from "@/lib/helpers";
import { getUserSupabaseClient } from "@/lib/supabaseClient";
import { verifyUser } from "@/lib/verifyUser";

interface MatchedImage {
  image_id: string;
  meta: any;
  minDistance: number;
  avgDistance: number;
  isMatch: boolean;
  confidence: number;
}

interface SignedImage {
  id: string;
  tags: string[];
  description: string | null;
  colors: string[];
  createdAt: string | null;
  aiProcessingStatus: "pending" | "completed" | "error";
  originalUrl: string | null;
  thumbnailUrl: string | null;
  colorMatch: {
    minDistance: number;
    avgDistance: number;
    threshold: number;
  };
}

/**
 * Convert HEX color to RGB array [r, g, b].
 * @param hex - Hex color string (e.g. "#FF00AA")
 * @returns RGB array
 */
function hexToRgb(hex: string) {
  const sanitized = hex.replace('#', '');
  const bigint = parseInt(sanitized, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

// RGB → XYZ → LAB conversion helpers
function rgbToXyz({ r, g, b }: { r: number; g: number; b: number }) {
  [r, g, b] = [r, g, b].map(v => {
    v /= 255;
    return v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92;
  });
  const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) * 100;
  const y = (r * 0.2126 + g * 0.7152 + b * 0.0722) * 100;
  const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) * 100;
  return { x, y, z };
}

function xyzToLab({ x, y, z }: { x: number; y: number; z: number }) {
  const refX = 95.047;
  const refY = 100.0;
  const refZ = 108.883;
  x /= refX; y /= refY; z /= refZ;

  [x, y, z] = [x, y, z].map(v => v > 0.008856 ? Math.cbrt(v) : (7.787 * v) + (16 / 116));
  const L = (116 * y) - 16;
  const a = 500 * (x - y);
  const b = 200 * (y - z);
  return { L, a, b };
}

// 🎨 CIEDE2000 difference formula
function colorDistance(rgb1: { r: number; g: number; b: number }, rgb2: { r: number; g: number; b: number }) {
  const lab1 = xyzToLab(rgbToXyz(rgb1));
  const lab2 = xyzToLab(rgbToXyz(rgb2));

  const avgL = (lab1.L + lab2.L) / 2;
  const C1 = Math.sqrt(lab1.a ** 2 + lab1.b ** 2);
  const C2 = Math.sqrt(lab2.a ** 2 + lab2.b ** 2);
  const avgC = (C1 + C2) / 2;

  const G = 0.5 * (1 - Math.sqrt((avgC ** 7) / ((avgC ** 7) + (25 ** 7))));
  const a1p = lab1.a * (1 + G);
  const a2p = lab2.a * (1 + G);
  const C1p = Math.sqrt(a1p ** 2 + lab1.b ** 2);
  const C2p = Math.sqrt(a2p ** 2 + lab2.b ** 2);
  const avgCp = (C1p + C2p) / 2;

  const h1p = Math.atan2(lab1.b, a1p) * 180 / Math.PI + (Math.atan2(lab1.b, a1p) < 0 ? 360 : 0);
  const h2p = Math.atan2(lab2.b, a2p) * 180 / Math.PI + (Math.atan2(lab2.b, a2p) < 0 ? 360 : 0);
  let deltahp = h2p - h1p;
  if (Math.abs(deltahp) > 180) deltahp -= Math.sign(deltahp) * 360;

  const deltaLp = lab2.L - lab1.L;
  const deltaCp = C2p - C1p;
  const deltaHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((deltahp * Math.PI / 180) / 2);

  const SL = 1 + ((0.015 * ((avgL - 50) ** 2)) / Math.sqrt(20 + ((avgL - 50) ** 2)));
  const SC = 1 + 0.045 * avgCp;
  const SH = 1 + 0.015 * avgCp * (1 - 0.17 * Math.cos((h1p + h2p - 30) * Math.PI / 180)
    + 0.24 * Math.cos((2 * (h1p + h2p)) * Math.PI / 180)
    + 0.32 * Math.cos(((3 * (h1p + h2p) + 6) * Math.PI / 180))
    - 0.20 * Math.cos(((4 * (h1p + h2p) - 63) * Math.PI / 180)));

  const deltaTheta = 30 * Math.exp(-(((((h1p + h2p) / 2) - 275) / 25) ** 2));
  const RC = 2 * Math.sqrt((avgCp ** 7) / ((avgCp ** 7) + (25 ** 7)));
  const RT = -RC * Math.sin(2 * deltaTheta * Math.PI / 180);

  return Math.sqrt(
    (deltaLp / SL) ** 2 +
    (deltaCp / SC) ** 2 +
    (deltaHp / SH) ** 2 +
    RT * (deltaCp / SC) * (deltaHp / SH)
  );
}

const parseNum = (v: string | null, fallback: number): number =>
  v && !isNaN(Number(v)) ? Number(v) : fallback;


export async function GET(
  req: NextRequest,
  context: RouteContext<'/api/images/color/[colorCode]'>
) {
  try {
    // 🧩 1️⃣ Auth and params
    const verified = await verifyUser(req);
    if (!verified) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user, token } = verified;
    const { colorCode } = await context.params;
    const supabase = getUserSupabaseClient(token);
    const searchParams = req.nextUrl.searchParams;

    const queryThreshold = searchParams.get("threshold");
    const queryPage = searchParams.get("page");
    const queryLimit = searchParams.get("limit");

    // 🧩 2️⃣ Validate input
    if (!user.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized", errorCode: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    if (!colorCode || !/^#?[0-9A-Fa-f]{6}$/.test(colorCode)) {
      return NextResponse.json(
        { success: false, message: "Invalid HEX color code", errorCode: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    // 🧠 Normalize color
    const normalizedHex = colorCode.startsWith("#") ? colorCode : `#${colorCode}`;
    const targetRgb = hexToRgb(normalizedHex);

    // ⚙️ Defaults + parsed values
    const THRESHOLD = parseNum(queryThreshold, 60);
    const page = parseNum(queryPage, 1);
    const limit = parseNum(queryLimit, 10);
    const offset = (page - 1) * limit;

    // 🖼️ 3️⃣ Fetch all user image metadata
    const { data: metadataList, error: metaError } = await supabase
      .from("image_metadata")
      .select("image_id, tags, description, colors, created_at, ai_processing_status")
      .eq("user_id", user.id)
      .not("colors", "is", null)
      .not("colors", "eq", "{}");

    if (metaError) throw metaError;

    if (!metadataList?.length) {
      return NextResponse.json(
        {
          success: false,
          message: "No images found for this user",
          errorCode: "NOT_FOUND",
        },
        { status: 404 }
      );
    }

    // 🎨 4️⃣ Compute distances and filter matches
    const matched: MatchedImage[] = metadataList
      .map((meta) => {
        const colorsArr = Array.isArray(meta.colors) ? meta.colors : [];
        if (colorsArr.length === 0) return null;

        const distances = colorsArr.map((hex) => {
          try {
            return colorDistance(targetRgb, hexToRgb(hex));
          } catch (e) {
            console.error("colorDistance error for", hex, e);
            return Number.POSITIVE_INFINITY;
          }
        });

        const minDistance = Math.min(...distances);
        const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
        const matched = Number.isFinite(minDistance) && minDistance <= THRESHOLD;

        return {
          image_id: meta.image_id,
          meta,
          minDistance,
          avgDistance,
          isMatch: matched,
          confidence: Number((1 - minDistance / 100).toFixed(2)),
        };
      })
      .filter((m): m is MatchedImage => !!m && m.isMatch)
      .sort((a, b) => a.minDistance - b.minDistance);

    if (!matched.length) {
      return NextResponse.json({
        success: true,
        message: "No similar colors found within threshold",
        metadata: {
          currentPage: 1,
          totalPages: 1,
          nextPage: null,
          prevPage: null,
          limit,
          totalItems: 0,
        },
        data: [],
      });
    }

    // 🧮 5️⃣ Pagination
    const totalItems = matched.length;
    const totalPages = Math.ceil(totalItems / limit);
    const paginatedMatches = matched.slice(offset, offset + limit);
    const matchedIds = paginatedMatches.map((m) => m.image_id);

    // 🧾 6️⃣ Fetch image records
    const { data: images, error: imgError } = await supabase
      .from("images")
      .select("id, filename, original_path, thumbnail_path")
      .in("id", matchedIds);

    if (imgError) throw imgError;

    if (!images?.length) {
      console.warn("No matching image records found for IDs", matchedIds);
    }

    // 🪄 7️⃣ Merge + signed URLs + colorMatch info
    const signedImages: SignedImage[] = await Promise.all(
      (images || []).map(async (img) => {
        const match = paginatedMatches.find((m) => m.image_id === img.id);
        const meta = match?.meta;

        const origSignedUrl = await safeCreateSignedUrl(supabase, img.original_path);
        const thumbSignedUrl = await safeCreateSignedUrl(supabase, img.thumbnail_path);

        return {
          id: img.id,
          tags: getMetaField(meta, "tags", []),
          description: getMetaField(meta, "description", null),
          colors: getMetaField(meta, "colors", []),
          createdAt: getMetaField(meta, "created_at", null),
          aiProcessingStatus: getMetaField(meta, "ai_processing_status", "pending"),
          originalUrl: origSignedUrl,
          thumbnailUrl: thumbSignedUrl,
          colorMatch: {
            minDistance: Number(match?.minDistance.toFixed(2)),
            avgDistance: Number(match?.avgDistance.toFixed(2)),
            threshold: THRESHOLD,
          },
        };
      })
    );

    // ✅ 8️⃣ Response
    return NextResponse.json({
      success: true,
      message: `Images with similar color to ${normalizedHex}`,
      metadata: {
        currentPage: page,
        totalPages,
        nextPage: page < totalPages ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null,
        limit,
        totalItems,
      },
      data: signedImages,
    });
  } catch (err) {
    console.error("GET /api/images/color/[colorCode] error:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch color-matched images",
        errorCode: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
