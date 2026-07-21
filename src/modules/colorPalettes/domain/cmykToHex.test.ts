import { describe, expect, it } from "vitest";
import { cmykToHex } from "@/modules/colorPalettes/domain/cmykToHex";

describe("cmykToHex", () => {
  it("converts pure black (K=100) to #000000", () => {
    expect(cmykToHex(0, 0, 0, 100)).toBe("#000000");
  });

  it("converts no ink (all zero) to white", () => {
    expect(cmykToHex(0, 0, 0, 0)).toBe("#ffffff");
  });

  it("converts pure cyan to a blue-green hex", () => {
    expect(cmykToHex(100, 0, 0, 0)).toBe("#00ffff");
  });

  it("converts pure magenta to a red-blue hex", () => {
    expect(cmykToHex(0, 100, 0, 0)).toBe("#ff00ff");
  });

  it("clamps out-of-range inputs instead of producing invalid hex", () => {
    expect(cmykToHex(-10, 200, 0, 0)).toBe("#ff00ff");
  });
});
