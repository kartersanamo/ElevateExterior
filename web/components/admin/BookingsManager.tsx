"use client";

import { AdminCalendar } from "@/components/admin/AdminCalendar";
import { AvailabilityManager } from "@/components/admin/AvailabilityManager";
import { BookingDetailPanel } from "@/components/admin/BookingDetailPanel";
import type { BookingDetailData } from "@/components/admin/BookingDetailContent";
import { ManualBookingDialog } from "@/components/admin/ManualBookingDialog";
import {
  BOOKING_STATUSES,
  buildBookingsUrl,
  formatBookingDate,
  formatBookingTime,
  PAGE_SIZE_OPTIONS,
  serviceLabels,
  STATUS_STYLES,
  truncate,
  type BookingSort,
  type ParsedBookingListParams,
  type StatusFilter,
} from "@/lib/bookings-admin";
import type { BookingStatus } from "@prisma/client";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

export interface BookingListRow {
  id: string;
  status: BookingStatus;
  customerName: string;
  customerEmail: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  services: string;
  address: string;
}

interface ScheduleRule {
  dayOfWeek: number;
  dayName: string;
  startTime: string;
  endTime: string;
  enabled: boolean;
}

interface BlockedDate {
  id: string;
  date: string;
  reason: string | null;
}

interface BookingsManagerProps {
  listParams: ParsedBookingListParams;
  bookings: BookingListRow[];
  totalCount: number;
  selectedBooking: BookingDetailData | null;
  schedule?: {
    rules: ScheduleRule[];
    blocked: BlockedDate[];
    slotDurationMinutes: number;
  };
}

function SortIcon({
  column,
  sort,
  order,
}: {
  column: BookingSort;
  sort: BookingSort;
  order: "asc" | "desc";
}) {
  if (sort !== column) {
    return <ChevronDown className="ml-1 inline h-3.5 w-3.5 opacity-30" />;
  }
  return order === "asc" ? (
    <ChevronUp className="ml-1 inline h-3.5 w-3.5" />
  ) : (
    <ChevronDown className="ml-1 inline h-3.5 w-3.5" />
  );
}

export function BookingsManager({
  listParams,
  bookings,
  totalCount,
  selectedBooking,
  schedule,
}: BookingsManagerProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(listParams.q);

  useEffect(() => {
    setSearchInput(listParams.q);
  }, [listParams.q]);

  const totalPages = Math.max(1, Math.ceil(totalCount / listParams.pageSize));
  const safePage = Math.min(listParams.page, totalPages);
  const rangeStart = totalCount === 0 ? 0 : (safePage - 1) * listParams.pageSize + 1;
  const rangeEnd = Math.min(safePage * listParams.pageSize, totalCount);

  const navigate = (params: Partial<ParsedBookingListParams> & { id?: string | null }) => {
    startTransition(() => {
      router.push(buildBookingsUrl(params, listParams));
    });
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    navigate({ q: searchInput, page: 1, id: null });
  };

  const handleSort = (column: BookingSort) => {
    const nextOrder =
      listParams.sort === column && listParams.order === "desc" ? "asc" : "desc";
    navigate({ sort: column, order: nextOrder, page: 1, id: null });
  };

  const handleStatusFilter = (status: StatusFilter) => {
    navigate({ status, page: 1, id: null });
  };

  const handleRowClick = (id: string) => {
    navigate({ id });
  };

  const listTabHref = buildBookingsUrl({ tab: "list", id: null }, listParams);
  const scheduleTabHref = buildBookingsUrl(
    { tab: "schedule", id: null, page: 1 },
    { ...listParams, tab: "schedule" }
  );

  return (
    <div className={pending ? "opacity-70 transition-opacity" : ""}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-forest">Bookings</h1>
          <p className="mt-2 text-slate/70">
            Manage appointments, view details, and configure scheduling.
          </p>
        </div>
        <ManualBookingDialog />
      </div>

      <div className="mt-6 flex gap-1 border-b border-slate/10">
        <Link
          href={listTabHref}
          className={`rounded-t-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
            listParams.tab === "list"
              ? "border border-b-white border-slate/10 bg-white text-teal -mb-px"
              : "text-slate/60 hover:text-forest"
          }`}
        >
          List
        </Link>
        <Link
          href={scheduleTabHref}
          className={`rounded-t-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
            listParams.tab === "schedule"
              ? "border border-b-white border-slate/10 bg-white text-teal -mb-px"
              : "text-slate/60 hover:text-forest"
          }`}
        >
          Schedule
        </Link>
      </div>

      {listParams.tab === "list" ? (
        <div className="rounded-b-2xl rounded-tr-2xl border border-slate/10 bg-white">
          <div className="border-b border-slate/10 p-4">
            <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-3">
              <div className="relative min-w-[200px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate/40" />
                <input
                  type="search"
                  placeholder="Search name, email, phone, address…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full rounded-lg border border-slate/20 py-2 pl-9 pr-3 text-sm"
                />
              </div>
              <button
                type="submit"
                className="rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal-light"
              >
                Search
              </button>
            </form>

            <div className="mt-3 flex flex-wrap gap-2">
              {BOOKING_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleStatusFilter(s)}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
                    listParams.status === s
                      ? "bg-teal text-white"
                      : "border border-slate/10 bg-slate/5 text-slate/70 hover:bg-slate/10"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="sticky top-0 border-b border-slate/10 bg-slate/5">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate/70">
                    <button
                      type="button"
                      onClick={() => handleSort("status")}
                      className="inline-flex items-center hover:text-forest"
                    >
                      Status
                      <SortIcon
                        column="status"
                        sort={listParams.sort}
                        order={listParams.order}
                      />
                    </button>
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate/70">
                    <button
                      type="button"
                      onClick={() => handleSort("customer")}
                      className="inline-flex items-center hover:text-forest"
                    >
                      Customer
                      <SortIcon
                        column="customer"
                        sort={listParams.sort}
                        order={listParams.order}
                      />
                    </button>
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate/70">
                    <button
                      type="button"
                      onClick={() => handleSort("date")}
                      className="inline-flex items-center hover:text-forest"
                    >
                      Date
                      <SortIcon
                        column="date"
                        sort={listParams.sort}
                        order={listParams.order}
                      />
                    </button>
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate/70">Time</th>
                  <th className="hidden px-4 py-3 font-semibold text-slate/70 md:table-cell">
                    Services
                  </th>
                  <th className="hidden px-4 py-3 font-semibold text-slate/70 lg:table-cell">
                    Address
                  </th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate/60">
                      No bookings found.
                    </td>
                  </tr>
                ) : (
                  bookings.map((b) => {
                    const isSelected = listParams.selectedId === b.id;
                    return (
                      <tr
                        key={b.id}
                        onClick={() => handleRowClick(b.id)}
                        className={`cursor-pointer border-b border-slate/5 transition-colors hover:bg-teal/5 ${
                          isSelected ? "bg-teal/10" : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${STATUS_STYLES[b.status]}`}
                          >
                            {b.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-forest">{b.customerName}</div>
                          <div className="text-xs text-slate/50">{b.customerEmail}</div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate/80">
                          {formatBookingDate(b.scheduledDate)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate/80">
                          {formatBookingTime(b.startTime)} – {formatBookingTime(b.endTime)}
                        </td>
                        <td className="hidden max-w-[200px] px-4 py-3 text-slate/70 md:table-cell">
                          {truncate(serviceLabels(b.services), 40)}
                        </td>
                        <td className="hidden max-w-[180px] px-4 py-3 text-slate/70 lg:table-cell">
                          {truncate(b.address, 35)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate/10 px-4 py-3">
            <p className="text-sm text-slate/60">
              {totalCount === 0
                ? "No results"
                : `Showing ${rangeStart}–${rangeEnd} of ${totalCount}`}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-slate/70">
                Per page
                <select
                  value={listParams.pageSize}
                  onChange={(e) =>
                    navigate({
                      pageSize: Number(e.target.value) as ParsedBookingListParams["pageSize"],
                      page: 1,
                      id: null,
                    })
                  }
                  className="rounded-lg border border-slate/20 px-2 py-1 text-sm"
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => navigate({ page: safePage - 1, id: null })}
                  className="rounded-lg border border-slate/20 px-3 py-1.5 text-sm font-semibold text-slate/70 hover:bg-slate/5 disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="px-2 text-sm text-slate/60">
                  {safePage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => navigate({ page: safePage + 1, id: null })}
                  className="rounded-lg border border-slate/20 px-3 py-1.5 text-sm font-semibold text-slate/70 hover:bg-slate/5 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : schedule && listParams.tab === "schedule" ? (
        <div className="space-y-10 rounded-b-2xl rounded-tr-2xl border border-slate/10 bg-white p-6">
          <AdminCalendar />
          <AvailabilityManager
            rules={schedule.rules}
            blocked={schedule.blocked}
            slotDurationMinutes={schedule.slotDurationMinutes}
          />
        </div>
      ) : null}

      <BookingDetailPanel booking={selectedBooking} listParams={listParams} />
    </div>
  );
}
