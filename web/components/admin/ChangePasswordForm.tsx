"use client";

import { changePassword } from "@/lib/actions/account";
import {
  changePasswordSchema,
  forcedPasswordChangeSchema,
} from "@/lib/validators/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ChangePasswordForm({
  mustChangePassword,
}: {
  mustChangePassword: boolean;
}) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const schema = mustChangePassword
      ? forcedPasswordChangeSchema
      : changePasswordSchema;

    const parsed = schema.safeParse({
      ...(mustChangePassword ? {} : { currentPassword }),
      newPassword,
      confirmPassword,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid password.");
      return;
    }

    setPending(true);
    const formData = new FormData();
    if (!mustChangePassword) {
      formData.set("currentPassword", currentPassword);
    }
    formData.set("newPassword", newPassword);
    formData.set("confirmPassword", confirmPassword);

    const result = await changePassword(formData);
    setPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (mustChangePassword) {
      return;
    }

    setMessage("Password updated.");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    router.refresh();
  };

  const inputClass =
    "w-full rounded-lg border border-slate/20 px-4 py-3 focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal";

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {!mustChangePassword ? (
        <div>
          <label htmlFor="currentPassword" className="mb-1 block text-sm font-semibold">
            Current password
          </label>
          <input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            className={inputClass}
          />
        </div>
      ) : null}

      <div>
        <label htmlFor="newPassword" className="mb-1 block text-sm font-semibold">
          New password
        </label>
        <input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="mb-1 block text-sm font-semibold">
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          className={inputClass}
        />
      </div>

      <p className="text-xs text-slate/50">
        At least 8 characters with uppercase, lowercase, and a number.
      </p>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-forest">{message}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal-light disabled:opacity-50"
      >
        {pending
          ? "Saving…"
          : mustChangePassword
            ? "Set new password"
            : "Update password"}
      </button>
    </form>
  );
}
