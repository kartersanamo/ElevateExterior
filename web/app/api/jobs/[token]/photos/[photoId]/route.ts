import { db } from "@/lib/db";
import { readJobPhoto } from "@/lib/uploads";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string; photoId: string }> }
) {
  const { token, photoId } = await params;

  const booking = await db.booking.findUnique({
    where: { publicToken: token },
    include: { photos: true },
  });

  if (!booking) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const photo = booking.photos.find((p) => p.id === photoId);
  if (!photo) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  try {
    const buffer = await readJobPhoto(booking.id, photo.filename);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": photo.mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
}
