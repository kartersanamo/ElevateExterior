import { ChangePasswordForm } from "@/components/admin/ChangePasswordForm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminAccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-forest">My account</h1>
      {session.user.mustChangePassword ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          You&apos;re signed in with a temporary password. Choose a new password below
          before continuing.
        </div>
      ) : (
        <p className="mt-2 text-slate/70">Signed in as {session.user.email}</p>
      )}

      <section className="mt-8 max-w-md rounded-2xl border border-slate/10 bg-white p-6">
        <h2 className="font-display text-lg font-bold text-forest">
          {session.user.mustChangePassword ? "Set new password" : "Change password"}
        </h2>
        {session.user.mustChangePassword ? (
          <p className="mt-2 text-sm text-slate/60">
            No need to enter the temporary password again — just pick a new one.
          </p>
        ) : null}
        <div className="mt-4">
          <ChangePasswordForm mustChangePassword={session.user.mustChangePassword} />
        </div>
      </section>
    </div>
  );
}
