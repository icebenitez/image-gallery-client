// Helper: safely create a signed URL and return null on failure or when path is falsy
export async function safeCreateSignedUrl(supabaseClient: any, path?: string | null): Promise<string | null> {
  try {
    if (!path) return null;
    const result = await supabaseClient.storage
      .from("images")
      .createSignedUrl(path, Number(process.env.SIGNED_URL_EXPIRY || 86400));
    return result?.data?.signedUrl || null;
  } catch (err: any) {
    console.error("createSignedUrl error for path", path, err?.message || err);
    return null;
  }
}

// Helper: safe access to metadata fields (keeps code compact)
export function getMetaField(meta: any, field: string, fallback: any = null) {
  try {
    if (!meta) return fallback;
    return meta[field] ?? fallback;
  } catch {
    return fallback;
  }
}