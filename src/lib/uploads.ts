import "server-only";
import path from "node:path";
import fs from "node:fs";
import { randomBytes } from "node:crypto";
import { DATA_DIR } from "./db";

// Uploaded pictures live in data/uploads (not public/, which Next only serves as of build time)
// and are served by app/uploads/[file]/route.ts.
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const UPLOAD_NAME_RE = /^[a-z0-9]{20,40}\.(jpg|png|webp|gif|avif)$/;

export const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
};

/** Detect the real image type from the file's first bytes (never trust the file name). */
function sniff(buf: Buffer): keyof typeof CONTENT_TYPES | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return "webp";
  if (buf.subarray(0, 6).toString("ascii") === "GIF87a" || buf.subarray(0, 6).toString("ascii") === "GIF89a") return "gif";
  if (buf.subarray(4, 8).toString("ascii") === "ftyp" && /avi[fs]/.test(buf.subarray(8, 12).toString("ascii"))) return "avif";
  return null;
}

export async function saveUpload(file: File): Promise<{ url: string } | { error: string }> {
  if (!file || typeof file.arrayBuffer !== "function" || file.size === 0) return { error: "Не е избран файл." };
  if (file.size > MAX_UPLOAD_BYTES) return { error: "Снимката е по-голяма от 10 MB. Намалете я и опитайте пак." };
  const buf = Buffer.from(await file.arrayBuffer());
  const ext = sniff(buf);
  if (!ext) return { error: "Файлът не е снимка. Използвайте JPG, PNG, WEBP, GIF или AVIF." };
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const name = `${randomBytes(12).toString("hex")}.${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, name), buf);
  return { url: `/uploads/${name}` };
}
