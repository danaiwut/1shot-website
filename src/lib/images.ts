/** Image files staff may upload (indicator posters, blog images). The magic bytes must match the declared type. */
export const IMAGE_TYPES: Record<string, { ext: string; magic: (b: Uint8Array) => boolean }> = {
  "image/png": { ext: "png", magic: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  "image/jpeg": { ext: "jpg", magic: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  "image/webp": { ext: "webp", magic: (b) => String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP" },
};
export const MAX_IMAGE = 5 * 1024 * 1024;

/** The image type of these bytes (by content, not by name), or null when it isn't an allowed image. */
export function sniffImage(bytes: Uint8Array): { type: string; ext: string } | null {
  for (const [type, t] of Object.entries(IMAGE_TYPES)) if (t.magic(bytes)) return { type, ext: t.ext };
  return null;
}
