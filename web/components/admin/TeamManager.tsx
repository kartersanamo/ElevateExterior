"use client";

import { createAdminUser, removeAdminUser } from "@/lib/actions/admin";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface AdminRow {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export function TeamManager({
  admins,
  currentUserId,
}: {
  admins: AdminRow[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const addAdmin = () => {
    setError("");
    setMessage("");
    startTransition(async () => {
      try {
        await createAdminUser(form);
        setForm({ name: "", email: "", password: "" });
        setMessage("Admin account created.");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not create admin.");
      }
    });
  };

  const remove = (id: string) => {
    setError("");
    setMessage("");
    startTransition(async () => {
      try {
        await removeAdminUser(id);
        setMessage("Admin removed.");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not remove admin.");
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
        <h2 className="font-display text-lg font-bold text-forest">
          Co-founder accounts
        </h2>
        <p className="mt-1 text-sm text-slate/60">
          Each co-founder gets their own login to manage bookings and availability.
        </p>
        <ul className="mt-4 divide-y divide-slate/10">
          {admins.map((admin) => (
            <li
              key={admin.id}
              className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
            >
              <div>
                <p className="font-semibold text-forest">{admin.name}</p>
                <p className="text-sm text-slate/70">{admin.email}</p>
              </div>
              {admin.id === currentUserId ? (
                <span className="text-xs font-semibold uppercase tracking-wider text-teal">
                  You
                </span>
              ) : (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => remove(admin.id)}
                  className="text-sm font-semibold text-red-600 hover:underline disabled:opacity-50"
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate/10 bg-white p-6">
        <h2 className="font-display text-lg font-bold text-forest">
          Add co-founder
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-semibold">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border border-slate/20 px-3 py-2"
              placeholder="Kyle"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full rounded-lg border border-slate/20 px-3 py-2"
              placeholder="founder@email.com"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-semibold">
              Temporary password
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm((f) => ({ ...f, password: e.target.value }))
              }
              className="w-full rounded-lg border border-slate/20 px-3 py-2"
              placeholder="At least 8 characters"
            />
          </div>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={addAdmin}
          className="mt-4 rounded-lg bg-teal px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          Create account
        </button>
      </section>
    </div>
  );
}
