import fs from "node:fs";

const ALLOWED_MIME = new Set(["application/pdf", "image/png", "image/jpeg"]);

const EXT_BY_MIME: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/png": ".png",
  "image/jpeg": ".jpg",
};

/** Magic-byte signatures for allowed upload types (defense in depth beyond multer MIME). */
function detectMimeFromBuffer(buf: Buffer): string | null {
  if (buf.length >= 4 && buf.subarray(0, 4).toString("ascii") === "%PDF") {
    return "application/pdf";
  }
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return "image/png";
  }
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "image/jpeg";
  }
  return null;
}

export function extensionForMime(mime: string): string {
  return EXT_BY_MIME[mime] ?? "";
}

export function assertAllowedUploadMime(declaredMime: string, filePath: string): string {
  const normalized = declaredMime.toLowerCase().split(";")[0]!.trim();
  if (!ALLOWED_MIME.has(normalized)) {
    throw new Error("Invalid file type");
  }

  const head = fs.readFileSync(filePath);
  const detected = detectMimeFromBuffer(head);
  if (!detected || detected !== normalized) {
    throw new Error("File content does not match declared type");
  }

  return detected;
}

export const STOP_ORDER_MAX_BYTES = 10 * 1024 * 1024;
