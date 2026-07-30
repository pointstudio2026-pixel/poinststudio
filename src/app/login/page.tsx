import { LoginView } from "@/features/auth/LoginView";
import { safeRelativeRedirect } from "@/shared/auth/oauthRedirect";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ oauthError?: string; redirect?: string }>;
}) {
  const { oauthError, redirect } = await searchParams;
  return <LoginView oauthErrorCode={oauthError} redirectTo={safeRelativeRedirect(redirect) ?? undefined} />;
}
