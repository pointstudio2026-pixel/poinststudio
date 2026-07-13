import { readFileSync } from "node:fs";
import { ProviderError } from "@/shared/errors/AppError";

/**
 * pdf-lib's built-in StandardFonts (Helvetica etc.) only support WinAnsi
 * (Latin-1) encoding -- every text section in this app is Korean, so a
 * real font with Hangul glyphs must be embedded via fontkit instead. No
 * open-source CJK font ships in this repo yet (would need to be added as
 * a real asset, e.g. Noto Sans KR, for a portable/Linux deployment); for
 * now this falls back to the OS's own Korean font when running locally
 * on Windows, which is where this project's dev environment runs.
 */
const CANDIDATE_FONT_PATHS = [
  "C:/Windows/Fonts/malgun.ttf",
  "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc",
  "/usr/share/fonts/opentype/noto/NotoSansCJKkr-Regular.otf",
];

let cachedFontBytes: Buffer | null | undefined;

export function loadKoreanFontBytes(): Buffer {
  if (cachedFontBytes !== undefined) {
    if (!cachedFontBytes) {
      throw new ProviderError("한글을 지원하는 폰트를 찾을 수 없습니다.");
    }
    return cachedFontBytes;
  }

  for (const path of CANDIDATE_FONT_PATHS) {
    try {
      cachedFontBytes = readFileSync(/*turbopackIgnore: true*/ path);
      return cachedFontBytes;
    } catch {
      continue;
    }
  }

  cachedFontBytes = null;
  throw new ProviderError(
    "한글을 지원하는 폰트를 찾을 수 없습니다. 프로덕션 배포 시 Noto Sans KR 등 오픈소스 폰트를 프로젝트에 포함해야 합니다.",
  );
}
