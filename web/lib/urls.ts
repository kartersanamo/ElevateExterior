import { getSiteUrl } from "@/lib/stripe";

export function appointmentUrl(token: string): string {
  return `${getSiteUrl()}/appointments/${token}`;
}

export function jobUrl(token: string): string {
  return appointmentUrl(token);
}
