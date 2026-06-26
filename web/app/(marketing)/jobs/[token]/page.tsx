import { redirect } from "next/navigation";

export default async function LegacyJobRedirect({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  redirect(`/appointments/${token}`);
}
