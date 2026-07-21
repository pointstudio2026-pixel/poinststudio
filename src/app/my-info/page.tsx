import { requireSessionOrRedirect } from "@/shared/auth/session";
import { authContainer } from "@/modules/auth/container";
import { MyInfoView } from "@/features/account/MyInfoView";

export default async function MyInfoPage() {
  const session = await requireSessionOrRedirect();
  const user = await authContainer.getMeUseCase.execute({ userId: session.sub });

  return (
    <MyInfoView email={user.email} initialName={user.name} hasPassword={user.hasPassword} />
  );
}
