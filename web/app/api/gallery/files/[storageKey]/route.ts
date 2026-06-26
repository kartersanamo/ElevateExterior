import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { readGalleryImage } from "@/lib/uploads";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ storageKey: string }> }
) {
  const { storageKey } = await params;
  const safeKey = storageKey.replace(/[^a-zA-Z0-9._-]/g, "");

  const session = await auth();
  const image = await db.galleryImage.findFirst({
    where: {
      storageKey: safeKey,
      ...(session?.user ? {} : { published: true }),
    },
  });
  if (!image) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const buffer = await readGalleryImage(safeKey);
    const mime =
      safeKey.endsWith(".png")
        ? "image/png"
        : safeKey.endsWith(".webp")
          ? "image/webp"
          : "image/jpeg";
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
