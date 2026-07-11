import { z } from "zod";

export const contactSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(80),
  lastName: z.string().min(1, "Last name is required").max(80),
  email: z.string().email("Valid email required"),
  phone: z
    .string()
    .max(30)
    .optional()
    .or(z.literal("")),
  message: z
    .string()
    .min(10, "Please include a bit more detail")
    .max(2000),
  website: z.string().max(0).optional().or(z.literal("")),
});

export type ContactFormData = z.infer<typeof contactSchema>;

export const quoteRequestSchema = z.object({
  customerName: z.string().min(2, "Name is required").max(120),
  customerEmail: z.string().email("Valid email required"),
  customerPhone: z.string().min(7, "Phone is required").max(30),
  address: z.string().min(5, "Service address is required").max(300),
  services: z
    .array(z.string())
    .min(1, "Select at least one service"),
  notes: z.string().max(1000).optional().or(z.literal("")),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time"),
  website: z.string().max(0).optional().or(z.literal("")),
});

export type QuoteRequestFormData = z.infer<typeof quoteRequestSchema>;

export const manualBookingSchema = z.object({
  customerName: z.string().min(2, "Name is required").max(120),
  customerEmail: z.string().email("Valid email required"),
  customerPhone: z.string().min(7, "Phone is required").max(30),
  address: z.string().min(5, "Address is required").max(300),
  services: z.array(z.string()).min(1, "Select at least one service"),
  notes: z.string().max(1000).optional().or(z.literal("")),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Pick a start time"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Pick an end time"),
});

export type ManualBookingFormData = z.infer<typeof manualBookingSchema>;

/** @deprecated Use quoteRequestSchema */
export const bookingSchema = quoteRequestSchema;
/** @deprecated Use QuoteRequestFormData */
export type BookingFormData = QuoteRequestFormData;
