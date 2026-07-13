export interface RefreshTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedByTokenId: string | null;
}

export interface CreateRefreshTokenInput {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface RefreshTokenRepository {
  create(input: CreateRefreshTokenInput): Promise<RefreshTokenRecord>;
  findByHash(tokenHash: string): Promise<RefreshTokenRecord | null>;
  revokeById(id: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
  /**
   * Atomically revokes `oldTokenId` (only if it is still active) and inserts
   * `newToken` in the same transaction. Returns null when a concurrent
   * request already consumed `oldTokenId` first (lost the race) so the
   * caller can reject this attempt without creating a duplicate session.
   */
  rotate(input: {
    oldTokenId: string;
    newToken: CreateRefreshTokenInput;
  }): Promise<RefreshTokenRecord | null>;
}
