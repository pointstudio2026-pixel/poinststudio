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

export class FakeUserRepository implements UserRepository {
  users: AuthUser[] = [];

  async findByEmail(email: string) {
    return this.users.find((u) => u.email === email) ?? null;
  }

  async findById(id: string) {
    return this.users.find((u) => u.id === id) ?? null;
  }

  async create(input: CreateUserInput) {
    const user: AuthUser = {
      id: `user-${this.users.length + 1}`,
      email: input.email,
      passwordHash: input.passwordHash,
      name: input.name ?? null,
      role: "designer",
      createdAt: new Date(),
    };
    this.users.push(user);
    return user;
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
