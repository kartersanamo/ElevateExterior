import path from "path";
import { fileURLToPath } from "url";

const WEB_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PRISMA_DIR = path.join(WEB_ROOT, "prisma");

/** SQLite path from DATABASE_URL (Prisma resolves relative paths from prisma/). */
export function resolveDatabaseFilePath() {
  const dbUrl = process.env.DATABASE_URL ?? "file:../data/db.sqlite";
  const rawPath = dbUrl.replace(/^file:/, "");
  if (path.isAbsolute(rawPath)) {
    return rawPath;
  }
  return path.resolve(PRISMA_DIR, rawPath);
}

export function resolveDatabaseUrl() {
  return `file:${resolveDatabaseFilePath()}`;
}

export function getDataDir() {
  return path.dirname(resolveDatabaseFilePath());
}
