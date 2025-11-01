/**
 * Represents one row of image metadata.
 */
export interface ImageMetadata {
  tags?: string[] | null;
}

/**
 * Create a binary vector for tag presence.
 * @param tags - The tags for one image
 * @param all - All image_metadata rows
 * @returns binary vector
 */
export function vectorizeTags(tags: string[], all: ImageMetadata[]): number[] {
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
export function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, ai, i) => sum + ai * (b[i] || 0), 0);
  const magA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const magB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return magA && magB ? dot / (magA * magB) : 0;
}

/**
 * Convert HEX color to RGB array [r, g, b].
 * @param hex - Hex color string (e.g. "#FF00AA")
 * @returns RGB array
 */
export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
}

/**
 * Compute Euclidean color distance between two RGB colors.
 * @param a - first color as [r, g, b]
 * @param b - second color as [r, g, b]
 * @returns distance
 */
export function colorDistance(
  a: [number, number, number],
  b: [number, number, number]
): number {
  const [r1, g1, b1] = a;
  const [r2, g2, b2] = b;
  return Math.sqrt(
    Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2)
  );
}
