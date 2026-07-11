import { services } from "@/lib/site-config";
import type { BookingStatus, Prisma } from "@prisma/client";

export type BookingTab = "list" | "schedule";
export type BookingSort = "date" | "customer" | "status" | "created";
export type SortOrder = "asc" | "desc";
export type StatusFilter = "ALL" | BookingStatus;

export const BOOKING_STATUSES: StatusFilter[] = [
  "ALL",
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
];

export const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

export const STATUS_STYLES: Record<BookingStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-teal/10 text-teal",
  CANCELLED: "bg-slate/10 text-slate/60",
  COMPLETED: "bg-forest/10 text-forest",
};

export interface BookingListParams {
  tab?: string;
  status?: string;
  q?: string;
  sort?: string;
  order?: string;
  page?: string;
  pageSize?: string;
  id?: string;
}

export interface ParsedBookingListParams {
  tab: BookingTab;
  status: StatusFilter;
  q: string;
  sort: BookingSort;
  order: SortOrder;
  page: number;
  pageSize: PageSize;
  selectedId: string | null;
}

export function parseBookingListParams(
  raw: BookingListParams
): ParsedBookingListParams {
  const tab = raw.tab === "schedule" ? "schedule" : "list";
  const status = BOOKING_STATUSES.includes(raw.status as StatusFilter)
    ? (raw.status as StatusFilter)
    : "ALL";
  const sort: BookingSort =
    raw.sort === "customer" ||
    raw.sort === "status" ||
    raw.sort === "created"
      ? raw.sort
      : "date";
  const order: SortOrder = raw.order === "asc" ? "asc" : "desc";
  const page = Math.max(1, Number.parseInt(raw.page ?? "1", 10) || 1);
  const parsedPageSize = Number.parseInt(raw.pageSize ?? "25", 10);
  const pageSize: PageSize = PAGE_SIZE_OPTIONS.includes(
    parsedPageSize as PageSize
  )
    ? (parsedPageSize as PageSize)
    : 25;

  return {
    tab,
    status,
    q: raw.q?.trim() ?? "",
    sort,
    order,
    page,
    pageSize,
    selectedId: raw.id ?? null,
  };
}

export function buildBookingWhere(
  status: StatusFilter,
  q: string
): Prisma.BookingWhereInput {
  const where: Prisma.BookingWhereInput = {};

  if (status !== "ALL") {
    where.status = status;
  }

  if (q) {
    where.OR = [
      { customerName: { contains: q } },
      { customerEmail: { contains: q } },
      { customerPhone: { contains: q } },
      { address: { contains: q } },
    ];
  }

  return where;
}

export function buildBookingOrderBy(
  sort: BookingSort,
  order: SortOrder
): Prisma.BookingOrderByWithRelationInput[] {
  switch (sort) {
    case "customer":
      return [{ customerName: order }];
    case "status":
      return [{ status: order }, { scheduledDate: "desc" }];
    case "created":
      return [{ createdAt: order }];
    case "date":
    default:
      return [{ scheduledDate: order }, { startTime: order }];
  }
}

export function formatBookingDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatBookingDateLong(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatBookingTime(time: string): string {
  const [h, min] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(min).padStart(2, "0")} ${period}`;
}

export function parseServiceIds(json: string): string[] {
  try {
    return JSON.parse(json) as string[];
  } catch {
    return [];
  }
}

export function serviceLabels(idsJson: string): string {
  return parseServiceIds(idsJson)
    .map((id) => services.find((s) => s.id === id)?.title ?? id)
    .join(", ");
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
}

export function buildBookingsUrl(
  params: Partial<ParsedBookingListParams> & { id?: string | null },
  base?: ParsedBookingListParams
): string {
  const merged = { ...base, ...params };
  const search = new URLSearchParams();

  if (merged.tab === "schedule") {
    search.set("tab", "schedule");
  }
  if (merged.status && merged.status !== "ALL") {
    search.set("status", merged.status);
  }
  if (merged.q) {
    search.set("q", merged.q);
  }
  if (merged.sort && merged.sort !== "date") {
    search.set("sort", merged.sort);
  }
  if (merged.order && merged.order !== "desc") {
    search.set("order", merged.order);
  }
  if (merged.page && merged.page > 1) {
    search.set("page", String(merged.page));
  }
  if (merged.pageSize && merged.pageSize !== 25) {
    search.set("pageSize", String(merged.pageSize));
  }
  if (params.id) {
    search.set("id", params.id);
  }

  const qs = search.toString();
  return qs ? `/admin/bookings?${qs}` : "/admin/bookings";
}
