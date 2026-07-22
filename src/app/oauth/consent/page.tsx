import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { OAUTH_PENDING_SIGNUP_COOKIE } from "@/shared/auth/cookies";
import { verifyOAuthPendingSignupToken } from "@/shared/auth/jwt";
import { OAuthConsentView } from "@/features/auth/OAuthConsentView";

const PROVIDER_LABEL: Record<string, string> = { google: "Google", kakao: "Kakao" };

export default async function OAuthConsentPage() {
  const store = await cookies();
  const token = store.get(OAUTH_PENDING_SIGNUP_COOKIE)?.value;
  if (!token) {
    redirect("/login?oauthError=invalid_request");
  }

  let email: string;
  let providerLabel: string;
  try {
    const pending = verifyOAuthPendingSignupToken(token);
    email = pending.email;
    providerLabel = PROVIDER_LABEL[pending.provider] ?? pending.provider;
  } catch {
    redirect("/login?oauthError=invalid_request");
  }

  return <OAuthConsentView email={email} providerLabel={providerLabel} />;
}
