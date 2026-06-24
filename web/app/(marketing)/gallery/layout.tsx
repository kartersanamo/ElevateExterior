import type { Metadata } from "next";
import { site } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Gallery",
  description: `Before and after pressure washing results from ${site.name}.`,
};

export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
