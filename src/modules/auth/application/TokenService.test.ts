import { beforeEach, describe, expect, it } from "vitest";
import { TokenService } from "@/modules/auth/application/TokenService";
import { FakeRefreshTokenRepository } from "@/modules/auth/testing/fakes";
import { hashToken } from "@/shared/auth/opaqueToken";

beforeEach(() => {
  process.env.JWT_ACCESS_SECRET ??= "test-access-secret";
});

describe("TokenService", () => {
  it("issues an access token and a refresh token on login/register", async () => {
    const service = new TokenService(new FakeRefreshTokenRepository());
    const tokens = await service.issueTokenPair({ id: "user-1", role: "designer" });

    expect(tokens.accessToken).toBeTruthy();
    expect(tokens.refreshToken).toHaveLength(64); // 32 random bytes as hex
  });

  it("rotates a valid refresh token and invalidates the old one", async () => {
    const repo = new FakeRefreshTokenRepository();
    const service = new TokenService(repo);
    const { refreshToken } = await service.issueTokenPair({ id: "user-1", role: "designer" });

    const rotated = await service.rotate(refreshToken);
    expect(rotated.userId).toBe("user-1");
    expect(rotated.newRawRefreshToken).not.toBe(refreshToken);

    // The old token must now be rejected as reuse.
    await expect(service.rotate(refreshToken)).rejects.toMatchObject({ code: "AUTH-008" });
  });

  it("rejects an unknown refresh token", async () => {
    const service = new TokenService(new FakeRefreshTokenRepository());
    await expect(service.rotate("not-a-real-token")).rejects.toMatchObject({
      code: "AUTH-007",
    });
  });

  it("rejects an expired refresh token", async () => {
    const repo = new FakeRefreshTokenRepository();
    const service = new TokenService(repo);
    await repo.create({
      userId: "user-1",
      tokenHash: hashToken("expired-raw-token"),
      expiresAt: new Date(Date.now() - 1000),
    });

    await expect(service.rotate("expired-raw-token")).rejects.toMatchObject({
      code: "AUTH-007",
    });
  });

  it("revoke() is idempotent for logout", async () => {
    const repo = new FakeRefreshTokenRepository();
    const service = new TokenService(repo);
    const { refreshToken } = await service.issueTokenPair({ id: "user-1", role: "designer" });

    await service.revoke(refreshToken);
    // Second call on an already-revoked / unknown token must not throw.
    await expect(service.revoke(refreshToken)).resolves.toBeUndefined();

    await expect(service.rotate(refreshToken)).rejects.toMatchObject({ code: "AUTH-008" });
  });

  it("rejects the loser when two rotations race on the same token", async () => {
    const repo = new FakeRefreshTokenRepository();
    const service = new TokenService(repo);
    const { refreshToken } = await service.issueTokenPair({ id: "user-1", role: "designer" });

    const [first, second] = await Promise.allSettled([
      service.rotate(refreshToken),
      service.rotate(refreshToken),
    ]);

    const outcomes = [first, second];
    const fulfilled = outcomes.filter((o) => o.status === "fulfilled");
    const rejected = outcomes.filter((o) => o.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
  });
});
