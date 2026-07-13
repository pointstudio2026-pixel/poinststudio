import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { PdfLibExportRenderer } from "@/modules/exports/infrastructure/PdfLibExportRenderer";
import type { ConceptBoardData } from "@/modules/conceptBoards/domain/ConceptBoard";
import { CONCEPT_BOARD_SECTIONS } from "@/modules/conceptBoards/domain/ConceptBoard";

const SAMPLE_IMAGE_DATA_URI =
  "data:image/svg+xml;base64," +
  Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="red"/></svg>').toString(
    "base64",
  );

const BOARD_DATA: ConceptBoardData = {
  heroImageUrl: SAMPLE_IMAGE_DATA_URI,
  brandSummary: "Aster Bakery는 따뜻한 동네 베이커리입니다.",
  coreValues: ["quality", "warmth"],
  styleKeywords: ["bakery", "minimal"],
  colorPalette: [
    { hex: "#7c2d12", label: "Terracotta" },
    { hex: "#f97316", label: "Amber" },
  ],
  typographyDirection: "가독성 높은 산세리프",
  logoConceptImageUrls: [SAMPLE_IMAGE_DATA_URI],
  designNotes: "따뜻하고 친근한 방향으로 추천됩니다.",
  sectionOrder: [...CONCEPT_BOARD_SECTIONS],
};

describe("PdfLibExportRenderer.renderConceptBoardPdf", () => {
  it("produces a valid PDF containing the section content", async () => {
    const renderer = new PdfLibExportRenderer();
    const file = await renderer.renderConceptBoardPdf({
      data: BOARD_DATA,
      brandName: "Aster Bakery",
      sections: [...CONCEPT_BOARD_SECTIONS],
      includeBrandInfo: true,
      watermark: false,
    });

    expect(file.contentType).toBe("application/pdf");
    expect(file.buffer.subarray(0, 5).toString()).toBe("%PDF-");
    expect(file.buffer.byteLength).toBeGreaterThan(1000);
  });

  it("omits brand-narrative sections when includeBrandInfo is false", async () => {
    const renderer = new PdfLibExportRenderer();
    const withBrandInfo = await renderer.renderConceptBoardPdf({
      data: BOARD_DATA,
      brandName: "Aster Bakery",
      sections: [...CONCEPT_BOARD_SECTIONS],
      includeBrandInfo: true,
      watermark: false,
    });
    const withoutBrandInfo = await renderer.renderConceptBoardPdf({
      data: BOARD_DATA,
      brandName: "Aster Bakery",
      sections: [...CONCEPT_BOARD_SECTIONS],
      includeBrandInfo: false,
      watermark: false,
    });

    expect(withoutBrandInfo.buffer.byteLength).toBeLessThan(withBrandInfo.buffer.byteLength);
  });

  it("only renders the requested sections", async () => {
    const renderer = new PdfLibExportRenderer();
    const full = await renderer.renderConceptBoardPdf({
      data: BOARD_DATA,
      brandName: "Aster Bakery",
      sections: [...CONCEPT_BOARD_SECTIONS],
      includeBrandInfo: true,
      watermark: false,
    });
    const partial = await renderer.renderConceptBoardPdf({
      data: BOARD_DATA,
      brandName: "Aster Bakery",
      sections: ["brand_summary"],
      includeBrandInfo: true,
      watermark: false,
    });

    expect(partial.buffer.byteLength).toBeLessThan(full.buffer.byteLength);
  });
});

describe("PdfLibExportRenderer.renderImage", () => {
  it("rasterizes an SVG data URI into real PNG bytes", async () => {
    const renderer = new PdfLibExportRenderer();
    const file = await renderer.renderImage({ imageUrl: SAMPLE_IMAGE_DATA_URI, format: "png", watermark: false });

    expect(file.contentType).toBe("image/png");
    const metadata = await sharp(file.buffer).metadata();
    expect(metadata.format).toBe("png");
  });

  it("applies a watermark overlay when requested", async () => {
    const renderer = new PdfLibExportRenderer();
    const plain = await renderer.renderImage({ imageUrl: SAMPLE_IMAGE_DATA_URI, format: "png", watermark: false });
    const watermarked = await renderer.renderImage({ imageUrl: SAMPLE_IMAGE_DATA_URI, format: "png", watermark: true });

    expect(watermarked.buffer.equals(plain.buffer)).toBe(false);
  });

  it("supports jpg output", async () => {
    const renderer = new PdfLibExportRenderer();
    const file = await renderer.renderImage({ imageUrl: SAMPLE_IMAGE_DATA_URI, format: "jpg", watermark: false });

    expect(file.contentType).toBe("image/jpeg");
    const metadata = await sharp(file.buffer).metadata();
    expect(metadata.format).toBe("jpeg");
  });
});
