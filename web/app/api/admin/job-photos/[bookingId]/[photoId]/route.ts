import { db } from "@/lib/db";
import { readJobPhoto } from "@/lib/uploads";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ bookingId: string; photoId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { bookingId, photoId } = await params;

  const photo = await db.jobPhoto.findFirst({
    where: { id: photoId, bookingId },
  });

  if (!photo) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  try {
    const buffer = await readJobPhoto(bookingId, photo.filename);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": photo.mimeType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
}
