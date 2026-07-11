/**
 * Wipe transactional customer data while keeping admin configuration.
 *
 * Usage (from web/):
 *   npm run db:wipe              # dry run — shows counts only
 *   npm run db:wipe -- --confirm # actually delete data and files
 *
 * Job photos created by Docker are owned by root on the host. When local
 * deletion fails, the script removes files via the elevate-exterior container
 * (or a one-off alpine container using the same data volume).
 *
 * Deletes: bookings, job photos, quotes, recurring services, customers,
 *          email send logs, and auto-added "Completed Jobs" gallery entries.
 *
 * Keeps: admin users, availability, blocked dates/slots, site settings,
 *        email templates/lists/automations, and curated gallery images.
 */

import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
import { readdir, rm, unlink } from "fs/promises";
import path from "path";
import { getDataDir, resolveDatabaseUrl } from "./data-dir.mjs";

const JOB_GALLERY_CATEGORY = "Completed Jobs";
const CONTAINER_NAME = "elevate-exterior";

const db = new PrismaClient({
  datasources: { db: { url: resolveDatabaseUrl() } },
});
const confirm = process.argv.includes("--confirm");

function getUploadsRoot() {
  return path.join(getDataDir(), "uploads");
}

function getJobsDir() {
  return path.join(getUploadsRoot(), "jobs");
}

function getGalleryImagePath(storageKey) {
  return path.join(getUploadsRoot(), "gallery", path.basename(storageKey));
}

function isDockerContainerRunning(name) {
  try {
    return (
      execSync(`docker inspect -f '{{.State.Running}}' ${name}`, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim() === "true"
    );
  } catch {
    return false;
  }
}

function removeViaDocker(hostPath) {
  const dataDir = getDataDir();
  const resolved = path.resolve(hostPath);
  const relative = path.relative(dataDir, resolved);

  if (relative.startsWith("..")) {
    throw new Error(`Refusing to delete path outside data directory: ${hostPath}`);
  }

  const containerPath = `/app/data/${relative.split(path.sep).join("/")}`;

  if (isDockerContainerRunning(CONTAINER_NAME)) {
    execSync(`docker exec ${CONTAINER_NAME} rm -rf ${JSON.stringify(containerPath)}`, {
      stdio: "inherit",
    });
    return;
  }

  execSync(
    `docker run --rm -v ${JSON.stringify(`${dataDir}:/app/data`)} alpine rm -rf ${JSON.stringify(containerPath)}`,
    { stdio: "inherit" }
  );
}

async function safeRemove(targetPath) {
  try {
    await rm(targetPath, { recursive: true, force: true });
  } catch (err) {
    if (err.code === "ENOENT") return;
    if (err.code === "EACCES" || err.code === "EPERM") {
      console.log(`  Permission denied for ${targetPath} — removing via Docker...`);
      removeViaDocker(targetPath);
      return;
    }
    throw err;
  }
}

async function safeUnlink(filePath) {
  try {
    await unlink(filePath);
  } catch (err) {
    if (err.code === "ENOENT") return;
    if (err.code === "EACCES" || err.code === "EPERM") {
      console.log(`  Permission denied for ${filePath} — removing via Docker...`);
      removeViaDocker(filePath);
      return;
    }
    throw err;
  }
}

async function countTransactionalData() {
  const [
    bookings,
    jobPhotos,
    quoteRequests,
    recurringServices,
    customers,
    emailSendLogs,
    completedJobGalleryImages,
  ] = await Promise.all([
    db.booking.count(),
    db.jobPhoto.count(),
    db.quoteRequest.count(),
    db.recurringService.count(),
    db.customer.count(),
    db.emailSendLog.count(),
    db.galleryImage.count({ where: { category: JOB_GALLERY_CATEGORY } }),
  ]);

  return {
    bookings,
    jobPhotos,
    quoteRequests,
    recurringServices,
    customers,
    emailSendLogs,
    completedJobGalleryImages,
  };
}

async function countJobPhotoFiles() {
  const jobsDir = getJobsDir();
  let fileCount = 0;

  try {
    const bookingDirs = await readdir(jobsDir, { withFileTypes: true });
    for (const entry of bookingDirs) {
      if (!entry.isDirectory()) continue;
      const files = await readdir(path.join(jobsDir, entry.name));
      fileCount += files.length;
    }
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }

  return fileCount;
}

function printCounts(counts, jobPhotoFiles) {
  console.log("\nTransactional data to wipe:");
  console.log(`  Bookings:                    ${counts.bookings}`);
  console.log(`  Job photos (DB):             ${counts.jobPhotos}`);
  console.log(`  Job photo files (disk):      ${jobPhotoFiles}`);
  console.log(`  Quote requests:              ${counts.quoteRequests}`);
  console.log(`  Recurring services:          ${counts.recurringServices}`);
  console.log(`  Customers:                   ${counts.customers}`);
  console.log(`  Email send logs:             ${counts.emailSendLogs}`);
  console.log(
    `  "Completed Jobs" gallery rows: ${counts.completedJobGalleryImages}`
  );

  console.log("\nAdmin data kept:");
  console.log("  Admin users & notification preferences");
  console.log("  Site settings, availability, blocked dates/slots");
  console.log("  Email templates, lists, members, automations");
  console.log("  Curated gallery images (non–Completed Jobs)");
}

async function wipeFilesystem() {
  const completedJobImages = await db.galleryImage.findMany({
    where: { category: JOB_GALLERY_CATEGORY, storageKey: { not: null } },
    select: { storageKey: true },
  });

  for (const image of completedJobImages) {
    await safeUnlink(getGalleryImagePath(image.storageKey));
  }

  await safeRemove(getJobsDir());

  return {
    galleryFilesRemoved: completedJobImages.length,
    jobsDirRemoved: true,
  };
}

async function wipeDatabase() {
  return db.$transaction(async (tx) => {
    const emailSendLogs = await tx.emailSendLog.deleteMany();
    const quoteRequests = await tx.quoteRequest.deleteMany();
    const recurringServices = await tx.recurringService.deleteMany();
    const completedJobGalleryImages = await tx.galleryImage.deleteMany({
      where: { category: JOB_GALLERY_CATEGORY },
    });
    const bookings = await tx.booking.deleteMany();
    const customers = await tx.customer.deleteMany();

    return {
      emailSendLogs: emailSendLogs.count,
      quoteRequests: quoteRequests.count,
      recurringServices: recurringServices.count,
      completedJobGalleryImages: completedJobGalleryImages.count,
      bookings: bookings.count,
      customers: customers.count,
    };
  });
}

async function main() {
  const counts = await countTransactionalData();
  const jobPhotoFiles = await countJobPhotoFiles();
  const totalRows =
    counts.bookings +
    counts.jobPhotos +
    counts.quoteRequests +
    counts.recurringServices +
    counts.customers +
    counts.emailSendLogs +
    counts.completedJobGalleryImages;

  printCounts(counts, jobPhotoFiles);

  if (totalRows === 0 && jobPhotoFiles === 0) {
    console.log("\nNothing to wipe — database and job photo files are already empty.");
    return;
  }

  if (!confirm) {
    console.log("\nDry run only. Re-run with --confirm to wipe this data:");
    console.log("  npm run db:wipe -- --confirm");
    return;
  }

  console.log("\nWiping filesystem...");
  const fileResult = await wipeFilesystem();
  console.log(
    `  Removed ${fileResult.galleryFilesRemoved} completed-job gallery file(s)`
  );
  console.log("  Cleared job photo uploads directory");

  console.log("\nWiping database...");
  const dbResult = await wipeDatabase();
  console.log(`  Email send logs:             ${dbResult.emailSendLogs}`);
  console.log(`  Quote requests:              ${dbResult.quoteRequests}`);
  console.log(`  Recurring services:          ${dbResult.recurringServices}`);
  console.log(
    `  "Completed Jobs" gallery rows: ${dbResult.completedJobGalleryImages}`
  );
  console.log(`  Bookings (incl. job photos): ${dbResult.bookings}`);
  console.log(`  Customers:                   ${dbResult.customers}`);

  console.log("\nDone. Admin configuration and curated gallery images were kept.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
