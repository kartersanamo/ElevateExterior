import type { Metadata, Viewport } from "next";
import { DM_Sans, Outfit } from "next/font/google";
import "./globals.css";
import { site } from "@/lib/site-config";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://elevateexterior.org";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#013c83" },
    { media: "(prefers-color-scheme: dark)", color: "#013c83" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${site.name} — Pressure Washing Done Right`,
    template: `%s | ${site.shortName}`,
  },
  description: site.description,
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/logo.png", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: site.shortName,
  },
  formatDetection: {
    telephone: true,
    email: true,
    address: false,
  },
  openGraph: {
    title: site.name,
    description: site.description,
    url: siteUrl,
    siteName: site.name,
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${dmSans.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
