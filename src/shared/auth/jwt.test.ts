import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import { signAccessToken, verifyAccessToken } from "@/shared/auth/jwt";
import { AuthenticationError } from "@/shared/errors/AppError";

describe("jwt", () => {
  it("round-trips an access token", () => {
    const token = signAccessToken({ sub: "user-1", role: "designer" });
    const decoded = verifyAccessToken(token);

    expect(decoded.sub).toBe("user-1");
    expect(decoded.role).toBe("designer");
    expect(decoded.type).toBe("access");
  });

  it("rejects a tampered access token", () => {
    const token = signAccessToken({ sub: "user-1", role: "designer" });
    expect(() => verifyAccessToken(`${token}tampered`)).toThrow(AuthenticationError);
  });

  it("rejects an expired access token (Task-003: Access Token 만료)", () => {
    process.env.JWT_ACCESS_SECRET ??= "test-access-secret";
    const expired = jwt.sign(
      { sub: "user-1", role: "designer", type: "access" },
      process.env.JWT_ACCESS_SECRET!,
      { expiresIn: -10 },
    );

    expect(() => verifyAccessToken(expired)).toThrow(AuthenticationError);
  });
});
