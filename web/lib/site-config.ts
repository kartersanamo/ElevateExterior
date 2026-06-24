import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Droplets,
  Fence,
  Home,
  Layers,
  Sparkles,
  Square,
  Trees,
} from "lucide-react";

export interface Service {
  id: string;
  title: string;
  shortDescription: string;
  description: string;
  icon: LucideIcon;
  method: "soft-wash" | "pressure" | "both";
}

export interface GalleryImage {
  src: string;
  alt: string;
  category: string;
  before?: boolean;
}

export interface Testimonial {
  quote: string;
  name: string;
}

export interface TrustBadge {
  label: string;
}

export const site = {
  name: "Elevate Exterior Cleaning",
  shortName: "Elevate Exterior",
  legalName: "Elevate Exterior Cleaning",
  tagline:
    "Professional pressure washing & soft washing that restores curb appeal in a single afternoon",
  description:
    "Fully insured, locally owned pressure washing and soft washing for homes and businesses in Greater Houston. Eco-safe detergents, satisfaction guaranteed.",
  phone: "(832) 779-4639",
  phoneHref: "tel:+18327794639",
  email: "kylelesso@gmail.com",
  serviceArea: "Greater Houston & surrounding communities",
  quotePromise: "Free, no-pressure quotes within 24 hours",
  socialProof: "5.0 stars · 200+ happy neighbors",
  slotDurationMinutes: 180,
  bookingLeadDays: 1,
  bookingHorizonDays: 60,
} as const;

export const trustBadges: TrustBadge[] = [
  { label: "Fully Insured" },
  { label: "5-Star Rated" },
  { label: "Eco-Safe Detergents" },
  { label: "Locally Owned" },
];

export const services: Service[] = [
  {
    id: "house-soft-wash",
    title: "House Soft Washing",
    shortDescription:
      "Safe, low-pressure wash that lifts dirt, mildew, and algae from siding without damage.",
    description:
      "Our soft-wash system uses low pressure and biodegradable detergents to safely clean vinyl, stucco, brick, and painted surfaces. We treat organic growth at the root so your home stays cleaner longer.",
    icon: Home,
    method: "soft-wash",
  },
  {
    id: "driveway-concrete",
    title: "Driveway & Concrete",
    shortDescription:
      "Surface-cleaner finish that erases oil stains, tire marks, and years of grime.",
    description:
      "Commercial-grade surface cleaners deliver even, streak-free results on driveways, sidewalks, and garage floors. We match pressure to the concrete age and condition.",
    icon: Square,
    method: "pressure",
  },
  {
    id: "roof-cleaning",
    title: "Roof Cleaning",
    shortDescription:
      "Remove black streaks, moss, and algae with a gentle soft-wash treatment.",
    description:
      "Roof cleaning uses a dedicated soft-wash process that won't damage shingles or tiles. Black streaks and organic growth are treated and rinsed away for a like-new appearance.",
    icon: Layers,
    method: "soft-wash",
  },
  {
    id: "deck-patio",
    title: "Deck & Patio",
    shortDescription:
      "Wood-safe cleaning that restores natural color and preps surfaces for sealing.",
    description:
      "We adjust technique for wood, composite, and stone patios — lifting mildew and weathering without splintering boards or etching stone.",
    icon: Trees,
    method: "both",
  },
  {
    id: "fence-gate",
    title: "Fence & Gate Cleaning",
    shortDescription:
      "Restore wood and vinyl fencing with the right pressure and brightening agents.",
    description:
      "Fences collect mildew and pollen fast. We clean wood, vinyl, and metal fencing to brighten your property line and complement a freshly washed home.",
    icon: Fence,
    method: "both",
  },
  {
    id: "gutter-brightening",
    title: "Gutter Brightening",
    shortDescription:
      "Remove tiger stripes and oxidation from gutters and fascia.",
    description:
      "Exterior gutter brightening targets the dark streaks on gutter faces and fascia boards, often paired with a full house wash for a cohesive finish.",
    icon: Droplets,
    method: "soft-wash",
  },
  {
    id: "commercial",
    title: "Commercial Exteriors",
    shortDescription:
      "Storefronts, walkways, and building exteriors for businesses of all sizes.",
    description:
      "Flexible scheduling for retail, offices, and multi-unit properties. We work around your hours and can set up recurring maintenance plans.",
    icon: Building2,
    method: "both",
  },
];

export const differentiators = [
  "Soft-wash certified technicians",
  "Commercial-grade equipment",
  "Plant- and pet-safe solutions",
  "Satisfaction guarantee",
] as const;

export const testimonials: Testimonial[] = [
  {
    quote: "My driveway looks like it was just poured. Worth every penny.",
    name: "Sarah M.",
  },
  {
    quote:
      "Showed up on time, explained everything, and left the place spotless.",
    name: "Derek R.",
  },
  {
    quote: "The black streaks on our roof are gone. House looks brand new.",
    name: "Priya K.",
  },
];

export const galleryImages: GalleryImage[] = [
  {
    src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
    alt: "Clean modern home exterior after soft washing",
    category: "House Soft Washing",
  },
  {
    src: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cd12?w=800&q=80",
    alt: "Freshly cleaned concrete driveway",
    category: "Driveway & Concrete",
  },
  {
    src: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
    alt: "Restored wooden deck and patio",
    category: "Deck & Patio",
  },
  {
    src: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80",
    alt: "Bright home with clean siding",
    category: "House Soft Washing",
  },
  {
    src: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80",
    alt: "Residential property curb appeal",
    category: "Roof Cleaning",
  },
  {
    src: "https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&q=80",
    alt: "Outdoor living space after cleaning",
    category: "Deck & Patio",
  },
];

export const galleryCategories = [
  "All",
  ...Array.from(new Set(galleryImages.map((img) => img.category))),
];

export const navLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export function getServiceById(id: string): Service | undefined {
  return services.find((s) => s.id === id);
}

export function formatMethod(method: Service["method"]): string {
  switch (method) {
    case "soft-wash":
      return "Soft wash";
    case "pressure":
      return "Pressure wash";
    case "both":
      return "Soft wash or pressure";
  }
}
