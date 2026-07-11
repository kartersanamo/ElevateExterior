import path from "path";

const PRISMA_DIR = path.join(process.cwd(), "prisma");

/** SQLite path from DATABASE_URL (Prisma resolves relative paths from prisma/). */
export function resolveDatabaseFilePath(): string {
  const dbUrl = process.env.DATABASE_URL ?? "file:../data/db.sqlite";
  const rawPath = dbUrl.replace(/^file:/, "");
  if (path.isAbsolute(rawPath)) {
    return rawPath;
  }
  return path.resolve(PRISMA_DIR, rawPath);
}

export function resolveDatabaseUrl(): string {
  return `file:${resolveDatabaseFilePath()}`;
}

export function getDataDir(): string {
  return path.dirname(resolveDatabaseFilePath());
}
