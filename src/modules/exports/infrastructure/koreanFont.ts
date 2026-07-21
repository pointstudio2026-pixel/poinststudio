import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ProviderError } from "@/shared/errors/AppError";

/**
 * pdf-lib's built-in StandardFonts (Helvetica etc.) only support WinAnsi
 * (Latin-1) encoding -- every text section in this app is Korean, so a
 * real font with Hangul glyphs must be embedded via fontkit instead.
 * Bundled as a project asset (Noto Sans KR, SIL Open Font License 1.1 --
 * free for commercial use, see fonts/OFL.txt) instead of relying on an OS
 * font, so this works the same on the Windows dev machine and on a real
 * Linux deployment. Loaded relative to process.cwd() rather than
 * __dirname since this repo has no `output: "standalone"` config, so the
 * full source tree (including this fonts/ directory) is still present on
 * disk next to `.next/` at runtime.
 *
 * TTF, not OTF: pdf-lib's fontkit-based embedding doesn't reliably subset
 * CFF-outline OpenType fonts (the original NotoSansKR-Regular.otf is CFF) --
 * this produced PDFs where Acrobat reported "글꼴을 추출할 수 없습니다"
 * and Hangul rendered as corrupted/unrecognizable glyphs, even though the
 * embedding code itself (registerFontkit/embedFont) was correct. Swapped to
 * the TrueType (glyf-outline) build of the same Noto Sans KR family -- same
 * OFL 1.1 license, same free-for-commercial-use status, only the outline
 * format differs.
 */
const FONT_PATH = join(process.cwd(), "src/modules/exports/infrastructure/fonts/NotoSansKR-Regular.ttf");

let cachedFontBytes: Buffer | undefined;

export function loadKoreanFontBytes(): Buffer {
  if (cachedFontBytes) {
    return cachedFontBytes;
  }

  try {
    cachedFontBytes = readFileSync(/*turbopackIgnore: true*/ FONT_PATH);
    return cachedFontBytes;
  } catch {
    throw new ProviderError("한글을 지원하는 폰트를 찾을 수 없습니다.");
  }
}
