"use server";

import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import {
  changePasswordSchema,
  forcedPasswordChangeSchema,
} from "@/lib/validators/auth";
import { revalidatePath } from "next/cache";

export async function changePassword(formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized." };

  const user = await db.adminUser.findUnique({ where: { id: session.user.id } });
  if (!user) return { error: "User not found." };

  if (user.mustChangePassword) {
    const parsed = forcedPasswordChangeSchema.safeParse({
      newPassword: formData.get("newPassword"),
      confirmPassword: formData.get("confirmPassword"),
    });
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid password." };
    }

    await db.adminUser.update({
      where: { id: user.id },
      data: {
        passwordHash: await hashPassword(parsed.data.newPassword),
        mustChangePassword: false,
      },
    });

    await signOut({ redirectTo: "/login?passwordUpdated=1" });
    return { success: true };
  }

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid password." };
  }

  const valid = await verifyPassword(
    parsed.data.currentPassword,
    user.passwordHash
  );
  if (!valid) return { error: "Current password is incorrect." };

  await db.adminUser.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(parsed.data.newPassword),
      mustChangePassword: false,
    },
  });

  revalidatePath("/admin/account");
  return { success: true };
}
