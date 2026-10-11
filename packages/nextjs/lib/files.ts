// Helpers shared by the browser (before uploading) and the server (before accepting a file).

// Must match the limits of the buckets in Supabase (dao-logos and task-images: 1 MB, task-details: 100 KB)
export const IMAGE_MAX_BYTES = 1024 * 1024;
export const DETAILS_MAX_BYTES = 90 * 1000;

/** SHA-256 of some bytes, in lowercase hexadecimal (64 characters). */
export const sha256Hex = async (data: ArrayBuffer | Uint8Array): Promise<string> => {
  const digest = await crypto.subtle.digest("SHA-256", data as BufferSource);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
};

export const isSha256Hex = (value: string) => /^[a-f0-9]{64}$/.test(value);

/**
 * Looks at the first bytes of a file to know what it really is, whatever name or type it claims to have.
 * Only PNG and JPG are accepted (an SVG, for example, can carry scripts).
 */
export const detectImageType = (bytes: Uint8Array): "png" | "jpg" | undefined => {
  const isPng =
    bytes.length >= 8 &&
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value);
  if (isPng) return "png";

  const isJpg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (isJpg) return "jpg";

  return undefined;
};

/** Files are named after their hash, so the same content always has the same name and cannot be replaced. */
export const IMAGE_NAME_PATTERN = /^[a-f0-9]{64}\.(png|jpg)$/;
