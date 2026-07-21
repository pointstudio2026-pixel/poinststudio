import { prisma } from "@/shared/database/prisma";
import type {
  CreateOAuthAccountInput,
  OAuthAccount,
  OAuthAccountRepository,
  OAuthProviderCode,
} from "@/modules/auth/domain/OAuthAccountRepository";

export class PrismaOAuthAccountRepository implements OAuthAccountRepository {
  async findByProviderAccount(
    provider: OAuthProviderCode,
    providerAccountId: string,
  ): Promise<OAuthAccount | null> {
    return prisma.oAuthAccount.findUnique({
      where: { provider_providerAccountId: { provider, providerAccountId } },
    });
  }

  async create(input: CreateOAuthAccountInput): Promise<OAuthAccount> {
    return prisma.oAuthAccount.create({ data: input });
  }
}
