import { Suspense } from "react";
import { VerifyEmailView } from "@/features/auth/VerifyEmailView";

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailView />
    </Suspense>
  );
}
