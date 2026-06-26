import { db } from "@/lib/db";

export async function getGoogleReviewUrl(): Promise<string | null> {
  const fromEnv = process.env.GOOGLE_REVIEW_URL?.trim();
  if (fromEnv) return fromEnv;

  const settings = await db.siteSettings.findUnique({
    where: { id: "default" },
  });
  return settings?.googleReviewUrl?.trim() || null;
}
