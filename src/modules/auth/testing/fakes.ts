import type {
  AuthUser,
  CreateUserInput,
  UserRepository,
} from "@/modules/auth/domain/UserRepository";
import type { PasswordHasher } from "@/modules/auth/domain/PasswordHasher";
import type {
  CreateRefreshTokenInput,
  RefreshTokenRecord,
  RefreshTokenRepository,
} from "@/modules/auth/domain/RefreshTokenRepository";
import type {
  CreateOAuthAccountInput,
  OAuthAccount,
  OAuthAccountRepository,
  OAuthProviderCode,
} from "@/modules/auth/domain/OAuthAccountRepository";
import type { EmailProvider, SendEmailInput } from "@/shared/email/EmailProvider";

interface FakeAuthUser extends AuthUser {
  emailVerificationToken: string | null;
  emailVerificationTokenExpiresAt: Date | null;
}

export class FakeUserRepository implements UserRepository {
  users: FakeAuthUser[] = [];

  async findByEmail(email: string) {
    return this.users.find((u) => u.email === email) ?? null;
  }

  async findById(id: string) {
    return this.users.find((u) => u.id === id) ?? null;
  }

  async create(input: CreateUserInput) {
    const user: FakeAuthUser = {
      id: `user-${this.users.length + 1}`,
      email: input.email,
      passwordHash: input.passwordHash ?? null,
      name: input.name ?? null,
      role: "designer",
      adminTier: null,
      emailVerifiedAt: input.emailVerifiedAt ?? null,
      lastLoginAt: null,
      suspendedAt: null,
      deletedAt: null,
      createdAt: new Date(),
      emailVerificationToken: null,
      emailVerificationTokenExpiresAt: null,
    };
    this.users.push(user);
    return user;
  }

  async updateProfile(id: string, input: { name: string }) {
    const user = this.users.find((u) => u.id === id);
    if (!user) throw new Error(`FakeUserRepository: user ${id} not found`);
    user.name = input.name;
    return user;
  }

  async updatePassword(id: string, passwordHash: string) {
    const user = this.users.find((u) => u.id === id);
    if (!user) throw new Error(`FakeUserRepository: user ${id} not found`);
    user.passwordHash = passwordHash;
  }

  async setEmailVerificationToken(id: string, token: string, expiresAt: Date) {
    const user = this.users.find((u) => u.id === id);
    if (!user) throw new Error(`FakeUserRepository: user ${id} not found`);
    user.emailVerificationToken = token;
    user.emailVerificationTokenExpiresAt = expiresAt;
  }

  async findByEmailVerificationToken(token: string) {
    return (
      this.users.find(
        (u) =>
          u.emailVerificationToken === token &&
          u.emailVerificationTokenExpiresAt !== null &&
          u.emailVerificationTokenExpiresAt.getTime() > Date.now(),
      ) ?? null
    );
  }

  async markEmailVerified(id: string) {
    const user = this.users.find((u) => u.id === id);
    if (!user) throw new Error(`FakeUserRepository: user ${id} not found`);
    user.emailVerifiedAt = new Date();
    user.emailVerificationToken = null;
    user.emailVerificationTokenExpiresAt = null;
  }

  async updateLastLogin(id: string) {
    const user = this.users.find((u) => u.id === id);
    if (!user) throw new Error(`FakeUserRepository: user ${id} not found`);
    user.lastLoginAt = new Date();
  }
}

export class FakeEmailProvider implements EmailProvider {
  readonly name = "fake";
  sent: SendEmailInput[] = [];

  async send(input: SendEmailInput) {
    this.sent.push(input);
  }
}

export class FakeOAuthAccountRepository implements OAuthAccountRepository {
  accounts: OAuthAccount[] = [];

  async findByProviderAccount(provider: OAuthProviderCode, providerAccountId: string) {
    return (
      this.accounts.find(
        (a) => a.provider === provider && a.providerAccountId === providerAccountId,
      ) ?? null
    );
  }

  async create(input: CreateOAuthAccountInput) {
    const account: OAuthAccount = {
      id: `oauth-${this.accounts.length + 1}`,
      userId: input.userId,
      provider: input.provider,
      providerAccountId: input.providerAccountId,
      createdAt: new Date(),
    };
    this.accounts.push(account);
    return account;
  }
}

export class FakePasswordHasher implements PasswordHasher {
  async hash(plainPassword: string) {
    return `hashed:${plainPassword}`;
  }

  async verify(plainPassword: string, hash: string) {
    return hash === `hashed:${plainPassword}`;
  }
}

/** In-memory stand-in that preserves the same race semantics as the Prisma impl. */
export class FakeRefreshTokenRepository implements RefreshTokenRepository {
  private rows = new Map<string, RefreshTokenRecord>();
  private nextId = 1;

  async create(input: CreateRefreshTokenInput): Promise<RefreshTokenRecord> {
    const record: RefreshTokenRecord = {
      id: `rt-${this.nextId++}`,
      userId: input.userId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
      revokedAt: null,
      replacedByTokenId: null,
    };
    this.rows.set(record.id, record);
    return record;
  }

  async findByHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    return [...this.rows.values()].find((r) => r.tokenHash === tokenHash) ?? null;
  }

  async revokeById(id: string): Promise<void> {
    const record = this.rows.get(id);
    if (record && !record.revokedAt) {
      this.rows.set(id, { ...record, revokedAt: new Date() });
    }
  }

  async revokeAllForUser(userId: string): Promise<void> {
    for (const record of this.rows.values()) {
      if (record.userId === userId && !record.revokedAt) {
        this.rows.set(record.id, { ...record, revokedAt: new Date() });
      }
    }
  }

  async rotate(input: {
    oldTokenId: string;
    newToken: CreateRefreshTokenInput;
  }): Promise<RefreshTokenRecord | null> {
    const old = this.rows.get(input.oldTokenId);
    if (!old || old.revokedAt) {
      // Mirrors the Prisma impl: the conditional claim already lost the race.
      return null;
    }

    // Claim + insert synchronously (no `await` in between) so a concurrent
    // `rotate()` call for the same oldTokenId can never interleave between
    // the check above and this write — the same guarantee Postgres's
    // conditional UPDATE gives the real implementation.
    const newRecord: RefreshTokenRecord = {
      id: `rt-${this.nextId++}`,
      userId: input.newToken.userId,
      tokenHash: input.newToken.tokenHash,
      expiresAt: input.newToken.expiresAt,
      revokedAt: null,
      replacedByTokenId: null,
    };
    this.rows.set(old.id, { ...old, revokedAt: new Date(), replacedByTokenId: newRecord.id });
    this.rows.set(newRecord.id, newRecord);
    return newRecord;
  }
}
