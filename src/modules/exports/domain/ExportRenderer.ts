import type { ConceptBoardData, ConceptBoardSectionKey } from "@/modules/conceptBoards/domain/ConceptBoard";
import type { RasterFormat } from "@/shared/media/rasterize";

export interface ConceptBoardExportInput {
  data: ConceptBoardData;
  brandName: string;
  sections: ConceptBoardSectionKey[];
  includeBrandInfo: boolean;
  watermark: boolean;
}

export interface ImageExportInput {
  imageUrl: string;
  format: RasterFormat;
  watermark: boolean;
}

export interface RenderedFile {
  buffer: Buffer;
  contentType: string;
}

/**
 * Rendering is kept behind a port (like the AI Provider adapters) so the
 * Use Cases don't depend on pdf-lib/sharp directly -- PdfRenderer/
 * ImageRenderer from the task doc's Backend Tasks are the two methods
 * here, implemented together since both need the same rasterization step.
 */
export interface ExportRenderer {
  renderConceptBoardPdf(input: ConceptBoardExportInput): Promise<RenderedFile>;
  renderImage(input: ImageExportInput): Promise<RenderedFile>;
}
