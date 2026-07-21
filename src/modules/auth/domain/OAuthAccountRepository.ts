export type OAuthProviderCode = "google" | "kakao";

export interface OAuthAccount {
  id: string;
  userId: string;
  provider: OAuthProviderCode;
  providerAccountId: string;
  createdAt: Date;
}

export interface CreateOAuthAccountInput {
  userId: string;
  provider: OAuthProviderCode;
  providerAccountId: string;
}

export interface OAuthAccountRepository {
  findByProviderAccount(
    provider: OAuthProviderCode,
    providerAccountId: string,
  ): Promise<OAuthAccount | null>;
  create(input: CreateOAuthAccountInput): Promise<OAuthAccount>;
}
