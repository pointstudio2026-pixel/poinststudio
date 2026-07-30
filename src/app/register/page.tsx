import { RegisterView } from "@/features/auth/RegisterView";
import { safeRelativeRedirect } from "@/shared/auth/oauthRedirect";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;
  return <RegisterView redirectTo={safeRelativeRedirect(redirect) ?? undefined} />;
}
