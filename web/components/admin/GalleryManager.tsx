"use client";

import {
  createGalleryImage,
  deleteGalleryImage,
  reorderGalleryImage,
  updateGalleryImage,
} from "@/lib/actions/gallery";
import { JOB_GALLERY_CATEGORY } from "@/lib/gallery";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface GalleryRow {
  id: string;
  src: string;
  alt: string;
  category: string;
  sortOrder: number;
  published: boolean;
}

function GalleryImageList({
  images,
  section,
  pending,
  run,
}: {
  images: GalleryRow[];
  section: "site" | "jobs";
  pending: boolean;
  run: (fn: () => Promise<unknown>) => void;
}) {
  if (images.length === 0) {
    return (
      <p className="mt-4 text-sm text-slate/60">
        {section === "jobs"
          ? "Photos from completed jobs will appear here, unpublished, until you toggle them on."
          : "No images yet. The public gallery will show placeholder images until you add some."}
      </p>
    );
  }

  return (
    <ul className="mt-4 space-y-6">
      {images.map((img, index) => (
        <li
          key={img.id}
          className="flex flex-col gap-4 border-b border-slate/10 pb-6 last:border-0 last:pb-0 lg:flex-row"
        >
          <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-xl bg-slate/5 lg:w-48">
            <Image
              src={img.src}
              alt={img.alt}
              fill
              className="object-cover"
              sizes="192px"
            />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <input
              type="text"
              defaultValue={img.alt}
              onBlur={(e) => {
                if (e.target.value !== img.alt) {
                  run(() => updateGalleryImage(img.id, { alt: e.target.value }));
                }
              }}
              className="w-full rounded-lg border border-slate/20 px-3 py-1.5 text-sm font-semibold text-forest"
            />
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                defaultValue={img.category}
                onBlur={(e) => {
                  if (e.target.value !== img.category) {
                    run(() =>
                      updateGalleryImage(img.id, { category: e.target.value })
                    );
                  }
                }}
                className="rounded-lg border border-slate/20 px-3 py-1.5 text-sm"
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  defaultChecked={img.published}
                  onChange={(e) =>
                    run(() =>
                      updateGalleryImage(img.id, { published: e.target.checked })
                    )
                  }
                />
                Published
              </label>
            </div>
            <p className="truncate text-xs text-slate/50">{img.src}</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 lg:flex-col">
            <button
              type="button"
              disabled={pending || index === 0}
              onClick={() => run(() => reorderGalleryImage(img.id, "up", section))}
              className="rounded-lg border border-slate/20 px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
            >
              Move up
            </button>
            <button
              type="button"
              disabled={pending || index === images.length - 1}
              onClick={() => run(() => reorderGalleryImage(img.id, "down", section))}
              className="rounded-lg border border-slate/20 px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
            >
              Move down
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (confirm("Delete this image?")) {
                  run(() => deleteGalleryImage(img.id));
                }
              }}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700"
            >
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function GalleryManager({
  images,
  categories,
}: {
  images: GalleryRow[];
  categories: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    src: "",
    alt: "",
    category: categories.find((c) => c !== JOB_GALLERY_CATEGORY) ?? categories[0] ?? "",
    published: true,
    storageKey: "" as string | undefined,
  });
  const [uploading, setUploading] = useState(false);

  const siteImages = images.filter((img) => img.category !== JOB_GALLERY_CATEGORY);
  const jobImages = images.filter((img) => img.category === JOB_GALLERY_CATEGORY);

  const run = (fn: () => Promise<unknown>) => {
    setError("");
    setMessage("");
    startTransition(async () => {
      try {
        await fn();
        setMessage("Saved.");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  };

  return (
    <div className="mt-8 space-y-8">
      {message ? (
        <p className="rounded-lg bg-mint px-4 py-2 text-sm text-forest">{message}</p>
      ) : null}
      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-800">{error}</p>
      ) : null}

      <section className="rounded-2xl border border-slate/10 bg-white p-6">
        <h2 className="font-display text-lg font-bold text-forest">Add image</h2>
        <p className="mt-1 text-sm text-slate/60">
          Upload from your phone or computer, or paste an image URL.
        </p>

        <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate/20 bg-slate/5 px-6 py-8 text-center hover:border-teal/40">
          <span className="text-sm font-semibold text-forest">Choose photo</span>
          <span className="mt-1 text-xs text-slate/50">JPEG, PNG, or WebP · max 10 MB</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            disabled={uploading || pending}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setUploading(true);
              setError("");
              try {
                const body = new FormData();
                body.append("file", file);
                const res = await fetch("/api/admin/gallery/upload", {
                  method: "POST",
                  body,
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error ?? "Upload failed.");
                setForm((f) => ({
                  ...f,
                  src: data.url,
                  storageKey: data.storageKey,
                  alt: f.alt || file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
                }));
                setMessage("Photo uploaded. Add alt text and category, then save.");
              } catch (err) {
                setError(err instanceof Error ? err.message : "Upload failed.");
              } finally {
                setUploading(false);
                e.target.value = "";
              }
            }}
          />
        </label>
        {uploading ? (
          <p className="mt-2 text-sm text-slate/60">Uploading…</p>
        ) : null}

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="text-slate/60">Image URL</span>
            <input
              type="url"
              value={form.src}
              onChange={(e) => setForm({ ...form, src: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate/20 px-3 py-2"
              placeholder="https://..."
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate/60">Alt text</span>
            <input
              type="text"
              value={form.alt}
              onChange={(e) => setForm({ ...form, alt: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate/20 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate/60">Category</span>
            <input
              type="text"
              list="gallery-categories"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate/20 px-3 py-2"
            />
            <datalist id="gallery-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm({ ...form, published: e.target.checked })}
            />
            Published on site
          </label>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            run(async () => {
              await createGalleryImage({
                ...form,
                storageKey: form.storageKey,
              });
              setForm({
                src: "",
                alt: "",
                category: form.category,
                published: true,
                storageKey: undefined,
              });
            })
          }
          className="mt-4 rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal/90 disabled:opacity-50"
        >
          Add image
        </button>
      </section>

      <section className="rounded-2xl border border-slate/10 bg-white p-6">
        <h2 className="font-display text-lg font-bold text-forest">
          Site gallery ({siteImages.length})
        </h2>
        <p className="mt-1 text-sm text-slate/60">
          Published images appear on the public gallery page.
        </p>
        <GalleryImageList
          images={siteImages}
          section="site"
          pending={pending}
          run={run}
        />
      </section>

      <section className="rounded-2xl border border-amber-200/60 bg-amber-50/30 p-6">
        <h2 className="font-display text-lg font-bold text-forest">
          From completed jobs ({jobImages.length})
        </h2>
        <p className="mt-1 text-sm text-slate/60">
          Photos added when marking a job complete. These are unpublished by default — toggle
          Published when you want them on the main website gallery.
        </p>
        <GalleryImageList
          images={jobImages}
          section="jobs"
          pending={pending}
          run={run}
        />
      </section>
    </div>
  );
}
