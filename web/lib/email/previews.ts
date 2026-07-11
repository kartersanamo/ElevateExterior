import {
  buttonGroup,
  detailCard,
  emailDivider,
  emailEyebrow,
  emailGreeting,
  emailHeading,
  emailParagraph,
  emailSignature,
  linkFallback,
  messageBlock,
  statusPanel,
  wrapBrandedContent,
  wrapTemplateContent,
} from "@/lib/email/design";
import { buildInvoiceSection } from "@/lib/invoice";
import {
  buildReviewRewardEmailSection,
  reviewClaimUrl,
} from "@/lib/review-reward";
import { site } from "@/lib/site-config";
import type { Booking } from "@prisma/client";

export interface EmailPreview {
  id: string;
  name: string;
  audience: "customer" | "admin";
  html: string;
  text: string;
}

const sampleQuote = {
  customerName: "Sarah Mitchell",
  customerEmail: "sarah@example.com",
  customerPhone: "(713) 555-0142",
  address: "1842 Oak Valley Dr, Houston, TX 77008",
  services: '["house-soft-wash","driveway-concrete"]',
  message: "We have some mildew on the north side of the house. Would love a quote for this weekend if possible.",
  proposedDate: new Date("2026-07-15"),
  proposedStartTime: "09:00",
  proposedEndTime: "12:00",
};

const sampleBooking = {
  id: "bk_sample123",
  customerName: "Sarah Mitchell",
  customerEmail: "sarah@example.com",
  customerPhone: "(713) 555-0142",
  address: "1842 Oak Valley Dr, Houston, TX 77008",
  services: ["House Soft Washing", "Driveway & Concrete"],
  notes: "Gate code is 4521. Dog in backyard.",
  scheduledDate: "2026-07-18",
  startTime: "09:00",
  endTime: "12:00",
  status: "CONFIRMED" as const,
  publicToken: "sample-token-abc",
};

const sampleBookingRecord: Booking = {
  id: "bk_sample123",
  customerName: "Sarah Mitchell",
  customerEmail: "sarah@example.com",
  customerPhone: "(713) 555-0142",
  address: "1842 Oak Valley Dr, Houston, TX 77008",
  services: '["house-soft-wash","driveway-concrete"]',
  scheduledDate: new Date("2026-07-18"),
  startTime: "09:00",
  endTime: "12:00",
  status: "COMPLETED",
  publicToken: "sample-token-abc",
  amountChargedCents: 42500,
  invoiceNumber: "INV-20260718-SAMPLE",
  invoiceHtml: null,
  paidAt: new Date("2026-07-18"),
  completedAt: new Date("2026-07-18"),
  reviewRequestSentAt: null,
  reviewDiscountCode: null,
  reviewDiscountClaimedAt: null,
  reviewDiscountRedeemedAt: null,
  stripeCheckoutSessionId: null,
  stripeProductId: null,
  stripePriceId: null,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function bookingRows() {
  return [
    { label: "Date", value: "Friday, July 18, 2026" },
    { label: "Time", value: "9:00 AM – 12:00 PM" },
    { label: "Services", value: sampleBooking.services.join(", ") },
    { label: "Address", value: sampleBooking.address },
    { label: "Phone", value: sampleBooking.customerPhone },
    { label: "Booking ID", value: sampleBooking.id },
  ];
}

export function generateAllEmailPreviews(): EmailPreview[] {
  const quoteUrl = `${siteUrl}/quote/sample-token`;
  const appointmentUrl = `${siteUrl}/appointments/sample-token-abc`;
  const adminQuotesUrl = `${siteUrl}/admin/quotes`;
  const reviewUrl = "https://g.page/r/example/review";

  return [
    {
      id: "quote-request-admin",
      name: "Quote request (admin)",
      audience: "admin",
      html: wrapBrandedContent(
        [
          emailEyebrow("New quote request"),
          emailHeading("Quote request received"),
          emailParagraph("A new quote request just came in from your website."),
          detailCard("Request details", [
            { label: "Customer", value: sampleQuote.customerName },
            { label: "Email", value: sampleQuote.customerEmail },
            { label: "Phone", value: sampleQuote.customerPhone },
            { label: "Address", value: sampleQuote.address },
            { label: "Services", value: "House Soft Washing, Driveway & Concrete" },
            { label: "Preferred time", value: "Tuesday, July 15, 2026 at 9:00 AM – 12:00 PM" },
          ]),
          messageBlock(sampleQuote.message),
          buttonGroup([{ label: "Review in admin", href: adminQuotesUrl }]),
        ].join(""),
        { previewText: "New quote request from Sarah Mitchell" }
      ),
      text: "Quote request admin preview",
    },
    {
      id: "quote-request-customer",
      name: "Quote request confirmation (customer)",
      audience: "customer",
      html: wrapBrandedContent(
        [
          emailEyebrow("Quote request"),
          emailHeading("We received your request"),
          emailGreeting(sampleQuote.customerName),
          statusPanel("success", "You're on our list", "We'll review your request and send a personalized quote within 24 hours."),
          detailCard("Your request", [
            { label: "Services", value: "House Soft Washing, Driveway & Concrete" },
            { label: "Preferred time", value: "Tuesday, July 15, 2026 at 9:00 AM" },
          ]),
          emailSignature(),
        ].join(""),
        { previewText: "Thanks for your quote request" }
      ),
      text: "Quote confirmation preview",
    },
    {
      id: "quote-ready",
      name: "Quote ready (customer)",
      audience: "customer",
      html: wrapBrandedContent(
        [
          emailEyebrow("Your quote"),
          emailHeading("Your quote is ready"),
          emailGreeting(sampleQuote.customerName),
          emailParagraph(`Your personalized quote from <strong style="color:#013c83;">${site.name}</strong> is ready.`),
          buttonGroup([{ label: "Review & accept quote", href: quoteUrl }]),
          linkFallback("Or copy this link:", quoteUrl),
          emailSignature(),
        ].join(""),
        { previewText: "Your quote is ready" }
      ),
      text: "Quote ready preview",
    },
    {
      id: "booking-confirmed",
      name: "Booking confirmed (customer)",
      audience: "customer",
      html: wrapBrandedContent(
        [
          emailEyebrow("Appointment confirmed"),
          emailHeading("Your cleaning is confirmed"),
          emailGreeting(sampleBooking.customerName),
          statusPanel("success", "Friday, July 18, 2026", "9:00 AM – 12:00 PM"),
          detailCard("Appointment details", bookingRows()),
          buttonGroup([{ label: "View appointment", href: appointmentUrl }]),
          emailSignature(),
        ].join(""),
        { previewText: "Your cleaning is confirmed" }
      ),
      text: "Booking confirmed preview",
    },
    {
      id: "booking-cancelled",
      name: "Booking cancelled (customer)",
      audience: "customer",
      html: wrapBrandedContent(
        [
          emailEyebrow("Appointment cancelled"),
          emailHeading("Your booking was cancelled"),
          emailGreeting(sampleBooking.customerName),
          statusPanel("warning", "Booking cancelled", "Friday, July 18, 2026 at 9:00 AM"),
          buttonGroup([
            { label: "Book again", href: `${siteUrl}/book` },
            { label: "Call us", href: site.phoneHref, variant: "secondary" },
          ]),
          emailSignature(),
        ].join(""),
        { previewText: "Your booking was cancelled" }
      ),
      text: "Booking cancelled preview",
    },
    {
      id: "contact-admin",
      name: "Contact form (admin)",
      audience: "admin",
      html: wrapBrandedContent(
        [
          emailEyebrow("Website inquiry"),
          emailHeading("New contact form submission"),
          detailCard("Contact details", [
            { label: "Name", value: "Sarah Mitchell" },
            { label: "Email", value: "sarah@example.com" },
            { label: "Phone", value: "(713) 555-0142" },
          ]),
          messageBlock("Interested in a full exterior package for our two-story home."),
        ].join(""),
        { previewText: "New inquiry from Sarah Mitchell" }
      ),
      text: "Contact form preview",
    },
    {
      id: "job-complete",
      name: "Service complete (customer)",
      audience: "customer",
      html: wrapBrandedContent(
        [
          emailEyebrow("Service complete"),
          emailHeading("Your cleaning is complete"),
          emailGreeting(sampleBooking.customerName),
          statusPanel("success", "Job finished", "View your job summary, before/after photos, and invoice."),
          buttonGroup([
            { label: "Pay $425.00", href: `${appointmentUrl}#pay` },
            { label: "Schedule recurring", href: `${appointmentUrl}#recurring`, variant: "secondary" },
          ]),
          emailSignature(),
        ].join(""),
        { previewText: "Your service is complete" }
      ),
      text: "Job complete preview",
    },
    {
      id: "invoice-paid",
      name: "Invoice paid (customer)",
      audience: "customer",
      html: wrapBrandedContent(
        [
          emailEyebrow("Payment received"),
          emailHeading("Thank you for your payment"),
          emailGreeting(sampleBooking.customerName),
          statusPanel("success", "Payment confirmed", "Invoice INV-20260718-SAMPLE has been paid in full."),
          buttonGroup([{ label: "View job summary", href: appointmentUrl }]),
          emailDivider(),
          buildInvoiceSection(sampleBookingRecord, "INV-20260718-SAMPLE", new Date("2026-07-18")),
          buildReviewRewardEmailSection(reviewUrl, reviewClaimUrl("sample-token-abc")),
          emailSignature(),
        ].join(""),
        { previewText: "Payment received" }
      ),
      text: "Invoice preview",
    },
    {
      id: "review-request",
      name: "Review request (customer)",
      audience: "customer",
      html: wrapBrandedContent(
        [
          emailEyebrow("Thank you"),
          emailHeading("How did we do?"),
          emailGreeting(sampleBooking.customerName),
          statusPanel("success", "Service complete", "We hope your home looks amazing."),
          buttonGroup([{ label: "Leave a Google review", href: `${siteUrl}/review` }]),
          emailSignature(),
        ].join(""),
        { previewText: "We'd love your feedback" }
      ),
      text: "Review request preview",
    },
    {
      id: "appointment-reminder",
      name: "Appointment reminder (template)",
      audience: "customer",
      html: wrapTemplateContent(
        `<p>Hi Sarah Mitchell,</p>
<p>This is a friendly reminder about your upcoming appointment on <strong>Friday, July 18, 2026</strong> at <strong>9:00 AM – 12:00 PM</strong>.</p>
<p>We'll see you at 1842 Oak Valley Dr, Houston, TX 77008 for House Soft Washing, Driveway &amp; Concrete.</p>
<p>Need to reschedule? Reply to this email or call us anytime.</p>`,
        { previewText: "Reminder: your appointment on Friday, July 18, 2026" }
      ),
      text: "Appointment reminder preview",
    },
  ];
}
