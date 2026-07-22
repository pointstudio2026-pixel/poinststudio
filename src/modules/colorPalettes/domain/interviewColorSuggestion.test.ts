import { describe, expect, it } from "vitest";
import { suggestColorSwatchesFromNotes } from "@/modules/colorPalettes/domain/interviewColorSuggestion";

describe("suggestColorSwatchesFromNotes", () => {
  it("extracts background/text/accent colors from the real production example", () => {
    const result = suggestColorSwatchesFromNotes(
      "검정 배경에 흰 글씨였으면 좋겠고 형광색같은 포인트 컬러가 있었으면 함",
    );
    expect(result).toEqual([
      { hex: "#0a0a0a", label: "배경" },
      { hex: "#ffffff", label: "글씨" },
      { hex: "#ccff00", label: "포인트" },
    ]);
  });

  it("returns null when no color is mentioned", () => {
    expect(suggestColorSwatchesFromNotes("특별히 없습니다. 심플하게 부탁드려요.")).toBeNull();
  });

  it("returns null when only one color is mentioned", () => {
    expect(suggestColorSwatchesFromNotes("블루톤으로 부탁드려요")).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(suggestColorSwatchesFromNotes("")).toBeNull();
  });

  it("returns null for a whitespace-only string", () => {
    expect(suggestColorSwatchesFromNotes("   \n\t ")).toBeNull();
  });

  it("returns null for null and undefined", () => {
    expect(suggestColorSwatchesFromNotes(null)).toBeNull();
    expect(suggestColorSwatchesFromNotes(undefined)).toBeNull();
  });

  it("collapses synonyms of the same color and returns null if fewer than 2 distinct colors remain", () => {
    expect(suggestColorSwatchesFromNotes("검정 아니면 블랙 톤으로요")).toBeNull();
  });

  it("caps at 3 distinct colors, preserving order of first appearance", () => {
    const result = suggestColorSwatchesFromNotes("빨강, 파랑, 초록, 노랑 다 넣어주세요");
    expect(result).toEqual([
      { hex: "#dc2626", label: "색상 1" },
      { hex: "#2563eb", label: "색상 2" },
      { hex: "#16a34a", label: "색상 3" },
    ]);
  });

  it("orders matches by text position, not by rule declaration order", () => {
    const result = suggestColorSwatchesFromNotes("네이비 톤에 오렌지 포인트를 주고 싶어요");
    expect(result).not.toBeNull();
    expect(result?.[0]?.hex).toBe("#1e3a8a");
    expect(result?.[1]?.hex).toBe("#f97316");
  });

  it("falls back to ordinal labels when no role word is nearby", () => {
    const result = suggestColorSwatchesFromNotes("그냥 남색이랑 민트 색이 좋아요");
    expect(result).toEqual([
      { hex: "#1e3a8a", label: "색상 1" },
      { hex: "#2dd4bf", label: "색상 2" },
    ]);
  });
});
