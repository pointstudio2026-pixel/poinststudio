import { describe, expect, it } from "vitest";
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "@/shared/auth/jwt";
import { AuthenticationError } from "@/shared/errors/AppError";

describe("jwt", () => {
  it("round-trips an access token", () => {
    const token = signAccessToken({ sub: "user-1", role: "designer" });
    const decoded = verifyAccessToken(token);

    expect(decoded.sub).toBe("user-1");
    expect(decoded.role).toBe("designer");
    expect(decoded.type).toBe("access");
  });

  it("round-trips a refresh token", () => {
    const token = signRefreshToken({ sub: "user-1" });
    const decoded = verifyRefreshToken(token);

    expect(decoded.sub).toBe("user-1");
    expect(decoded.type).toBe("refresh");
  });

  it("rejects a tampered access token", () => {
    const token = signAccessToken({ sub: "user-1", role: "designer" });
    expect(() => verifyAccessToken(`${token}tampered`)).toThrow(AuthenticationError);
  });

  it("rejects a refresh token when verified as an access token", () => {
    const refreshToken = signRefreshToken({ sub: "user-1" });
    expect(() => verifyAccessToken(refreshToken)).toThrow(AuthenticationError);
  });
});
