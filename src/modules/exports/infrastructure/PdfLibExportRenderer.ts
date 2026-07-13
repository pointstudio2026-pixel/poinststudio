import { PDFDocument, rgb, degrees, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import sharp from "sharp";
import type {
  ConceptBoardExportInput,
  ExportRenderer,
  ImageExportInput,
  RenderedFile,
} from "@/modules/exports/domain/ExportRenderer";
import type { ConceptBoardSectionKey } from "@/modules/conceptBoards/domain/ConceptBoard";
import { rasterizeImage } from "@/shared/media/rasterize";
import { loadKoreanFontBytes } from "@/modules/exports/infrastructure/koreanFont";

const PAGE_WIDTH = 595; // A4 at 72dpi
const PAGE_HEIGHT = 842;
const MARGIN = 48;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const SECTION_LABELS: Record<ConceptBoardSectionKey, string> = {
  hero_image: "Hero Image",
  brand_summary: "Brand Summary",
  core_values: "Core Values",
  style_keywords: "Style Keywords",
  color_palette: "Color Palette",
  typography_direction: "Typography Direction",
  logo_concepts: "Logo Concepts",
  design_notes: "Design Notes",
};

// Sections that reveal brand narrative/strategy text, as opposed to purely
// visual sections -- toggled off by includeBrandInfo=false so a board can
// be shared as a visual moodboard without proprietary brand copy.
const BRAND_INFO_SECTIONS = new Set<ConceptBoardSectionKey>(["brand_summary", "core_values", "design_notes"]);

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, fontSize) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

class PageCursor {
  page: PDFPage;
  y: number;

  constructor(
    private readonly doc: PDFDocument,
    private readonly font: PDFFont,
    private readonly boldFont: PDFFont,
  ) {
    this.page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.y = PAGE_HEIGHT - MARGIN;
  }

  ensureSpace(height: number) {
    if (this.y - height < MARGIN) {
      this.page = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      this.y = PAGE_HEIGHT - MARGIN;
    }
  }

  heading(text: string) {
    this.ensureSpace(24);
    this.page.drawText(text, { x: MARGIN, y: this.y, size: 14, font: this.boldFont, color: rgb(0.1, 0.1, 0.1) });
    this.y -= 20;
  }

  paragraph(text: string, size = 10) {
    const lines = wrapText(text, this.font, size, CONTENT_WIDTH);
    for (const line of lines) {
      this.ensureSpace(size + 4);
      this.page.drawText(line, { x: MARGIN, y: this.y, size, font: this.font, color: rgb(0.2, 0.2, 0.2) });
      this.y -= size + 4;
    }
    this.y -= 8;
  }

  async image(dataUriOrUrl: string, maxWidth: number, maxHeight: number) {
    const png = await rasterizeImage(dataUriOrUrl, { format: "png", maxSize: 1024 });
    const embedded = await this.doc.embedPng(png);
    const scale = Math.min(maxWidth / embedded.width, maxHeight / embedded.height, 1);
    const width = embedded.width * scale;
    const height = embedded.height * scale;
    this.ensureSpace(height + 8);
    this.page.drawImage(embedded, { x: MARGIN, y: this.y - height, width, height });
    this.y -= height + 12;
  }

  colorSwatches(swatches: { hex: string; label: string }[]) {
    this.ensureSpace(60);
    let x = MARGIN;
    for (const swatch of swatches) {
      const [r, g, b] = hexToRgb(swatch.hex);
      this.page.drawRectangle({ x, y: this.y - 36, width: 48, height: 36, color: rgb(r, g, b) });
      this.page.drawText(swatch.label, { x, y: this.y - 48, size: 7, font: this.font, color: rgb(0.3, 0.3, 0.3) });
      x += 60;
    }
    this.y -= 60;
  }

  watermark() {
    const pages = this.doc.getPages();
    for (const page of pages) {
      page.drawText("ASTER FREE PLAN", {
        x: PAGE_WIDTH / 2 - 160,
        y: PAGE_HEIGHT / 2,
        size: 36,
        font: this.boldFont,
        color: rgb(0.7, 0.7, 0.7),
        opacity: 0.35,
        rotate: degrees(30),
      });
    }
  }
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  return [r, g, b];
}

export class PdfLibExportRenderer implements ExportRenderer {
  async renderConceptBoardPdf(input: ConceptBoardExportInput): Promise<RenderedFile> {
    const doc = await PDFDocument.create();
    doc.registerFontkit(fontkit);
    // Korean text needs a real embedded font (fontkit) -- pdf-lib's
    // StandardFonts only support WinAnsi/Latin-1 and silently throw on
    // Hangul. Reused for both headings and body text (see koreanFont.ts
    // for why there's no separate bold variant yet).
    const font = await doc.embedFont(loadKoreanFontBytes(), { subset: true });
    const cursor = new PageCursor(doc, font, font);

    cursor.heading(`${input.brandName} -- Concept Board`);
    cursor.y -= 8;

    const { data } = input;
    for (const section of input.sections) {
      if (BRAND_INFO_SECTIONS.has(section) && !input.includeBrandInfo) continue;

      cursor.heading(SECTION_LABELS[section]);
      switch (section) {
        case "hero_image":
          if (data.heroImageUrl) await cursor.image(data.heroImageUrl, CONTENT_WIDTH, 240);
          else cursor.paragraph("이미지가 아직 생성되지 않았습니다.");
          break;
        case "brand_summary":
          cursor.paragraph(data.brandSummary || "-");
          break;
        case "core_values":
          cursor.paragraph(data.coreValues.length > 0 ? data.coreValues.join(", ") : "-");
          break;
        case "style_keywords":
          cursor.paragraph(data.styleKeywords.length > 0 ? data.styleKeywords.join(", ") : "-");
          break;
        case "color_palette":
          cursor.colorSwatches(data.colorPalette);
          break;
        case "typography_direction":
          cursor.paragraph(data.typographyDirection || "-");
          break;
        case "logo_concepts":
          if (data.logoConceptImageUrls.length > 0) {
            for (const url of data.logoConceptImageUrls) {
              await cursor.image(url, 160, 160);
            }
          } else {
            cursor.paragraph("이미지가 아직 생성되지 않았습니다.");
          }
          break;
        case "design_notes":
          cursor.paragraph(data.designNotes || "-");
          break;
      }
    }

    if (input.watermark) {
      cursor.watermark();
    }

    const bytes = await doc.save();
    return { buffer: Buffer.from(bytes), contentType: "application/pdf" };
  }

  async renderImage(input: ImageExportInput): Promise<RenderedFile> {
    const raster = await rasterizeImage(input.imageUrl, { format: input.format, maxSize: 2048 });

    if (!input.watermark) {
      return { buffer: raster, contentType: input.format === "png" ? "image/png" : "image/jpeg" };
    }

    const metadata = await sharp(raster).metadata();
    const watermarkSvg = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${metadata.width}" height="${metadata.height}">` +
        `<text x="50%" y="95%" text-anchor="middle" font-family="sans-serif" font-size="${Math.round((metadata.width ?? 512) * 0.04)}" fill="white" fill-opacity="0.6">ASTER FREE PLAN</text>` +
        `</svg>`,
    );
    const composited = sharp(raster).composite([{ input: watermarkSvg, gravity: "south" }]);
    const watermarked = await (input.format === "png" ? composited.png() : composited.jpeg({ quality: 90 })).toBuffer();

    return { buffer: watermarked, contentType: input.format === "png" ? "image/png" : "image/jpeg" };
  }
}
