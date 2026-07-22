import { LoginView } from "@/features/auth/LoginView";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ oauthError?: string }>;
}) {
  const { oauthError } = await searchParams;
  return <LoginView oauthErrorCode={oauthError} />;
}
