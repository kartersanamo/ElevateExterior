import { z } from "zod";

const passwordMatchMessage = "Passwords do not match";

function passwordsMatch(data: {
  newPassword: string;
  confirmPassword: string;
}): boolean {
  return data.newPassword === data.confirmPassword;
}

export const strongPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long")
  .refine((value) => /[A-Z]/.test(value), {
    message: "Password must include an uppercase letter",
  })
  .refine((value) => /[a-z]/.test(value), {
    message: "Password must include a lowercase letter",
  })
  .refine((value) => /[0-9]/.test(value), {
    message: "Password must include a number",
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: strongPasswordSchema,
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine(passwordsMatch, {
    message: passwordMatchMessage,
    path: ["confirmPassword"],
  });

export const forcedPasswordChangeSchema = z
  .object({
    newPassword: strongPasswordSchema,
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine(passwordsMatch, {
    message: passwordMatchMessage,
    path: ["confirmPassword"],
  });
