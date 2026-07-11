"use client";

import { ManualBookingForm } from "@/components/admin/ManualBookingForm";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

export function ManualBookingDialog() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
      >
        + Add Booking
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-forest/60 p-4 sm:p-8"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Add booking"
            className="relative w-full max-w-3xl"
          >
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close add booking dialog"
              className="absolute right-4 top-4 z-10 rounded-full p-2 text-slate/60 transition-colors hover:bg-slate/10 hover:text-forest"
            >
              <X size={20} aria-hidden />
            </button>
            <ManualBookingForm />
          </div>
        </div>
      ) : null}
    </>
  );
}
