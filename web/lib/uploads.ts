import { mkdir, writeFile, readFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const MAX_BYTES = 10 * 1024 * 1024;

export function getUploadsRoot(): string {
  const dbUrl = process.env.DATABASE_URL ?? "file:./data/db.sqlite";
  const dbPath = dbUrl.replace(/^file:/, "");
  const dataDir = path.dirname(dbPath);
  return path.join(dataDir, "uploads");
}

export function getJobPhotoDir(bookingId: string): string {
  return path.join(getUploadsRoot(), "jobs", bookingId);
}

export function getJobPhotoPath(bookingId: string, filename: string): string {
  return path.join(getJobPhotoDir(bookingId), filename);
}

export async function saveJobPhotos(
  bookingId: string,
  files: File[]
): Promise<Array<{ filename: string; mimeType: string }>> {
  if (files.length === 0) {
    throw new Error("Add at least one photo of the completed work.");
  }

  const dir = getJobPhotoDir(bookingId);
  await mkdir(dir, { recursive: true });

  const saved: Array<{ filename: string; mimeType: string }> = [];

  for (const file of files) {
    if (!(file instanceof File) || file.size === 0) continue;

    if (!ALLOWED_TYPES.has(file.type)) {
      throw new Error("Photos must be JPEG, PNG, or WebP.");
    }
    if (file.size > MAX_BYTES) {
      throw new Error("Each photo must be under 10 MB.");
    }

    const ext =
      file.type === "image/png"
        ? ".png"
        : file.type === "image/webp"
          ? ".webp"
          : ".jpg";
    const filename = `${randomUUID()}${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(getJobPhotoPath(bookingId, filename), buffer);
    saved.push({ filename, mimeType: file.type });
  }

  if (saved.length === 0) {
    throw new Error("Add at least one photo of the completed work.");
  }

  return saved;
}

export async function readJobPhoto(
  bookingId: string,
  filename: string
): Promise<Buffer> {
  const safeName = path.basename(filename);
  return readFile(getJobPhotoPath(bookingId, safeName));
}
