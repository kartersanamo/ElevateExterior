import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

const quoteInclude = { booking: true } satisfies Prisma.QuoteRequestInclude;

export type QuoteWithBooking = Prisma.QuoteRequestGetPayload<{
  include: typeof quoteInclude;
}>;

export async function findQuoteByLinkToken(
  token: string
): Promise<QuoteWithBooking | null> {
  const byPublicToken = await db.quoteRequest.findUnique({
    where: { publicToken: token },
    include: quoteInclude,
  });
  if (byPublicToken) return byPublicToken;

  return db.quoteRequest.findUnique({
    where: { id: token },
    include: quoteInclude,
  });
}
