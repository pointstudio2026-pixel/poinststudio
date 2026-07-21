import sharp from "sharp";
import type { ColorSwatch } from "@/modules/conceptBoards/domain/ConceptBoard";
import { logger } from "@/shared/logging/logger";

const SAMPLE_SIZE = 64;
// 채널당 32 단위로 양자화(0~255 -> 8 구간) -- 512개 버킷이면 64x64
// 샘플(최대 4096 픽셀)에서도 지배색이 자연스럽게 뭉친다.
const QUANTIZE_STEP = 32;

async function loadImageBuffer(imageUrl: string): Promise<Buffer> {
  if (imageUrl.startsWith("data:")) {
    const base64 = imageUrl.slice(imageUrl.indexOf(",") + 1);
    return Buffer.from(base64, "base64");
  }
  const res = await fetch(imageUrl);
  if (!res.ok) {
    throw new Error(`이미지를 가져오지 못했습니다 (${res.status})`);
  }
  return Buffer.from(await res.arrayBuffer());
}

function toHex(value: number): string {
  return Math.round(value).toString(16).padStart(2, "0");
}

/**
 * 실제로 생성된 히어로 이미지 픽셀에서 지배색을 뽑아낸다 -- AI 호출이
 * 아닌 순수 픽셀 연산(sharp)이라 비용이 들지 않는다. 컨셉 보드의 컬러
 * 팔레트가 사용자가 색을 미리 고르지 않았을 때도 "실제로 쓰인 컬러"를
 * 보여주도록 하는 게 목적 -- 실패하면 호출부가 다음 폴백으로 넘어갈 수
 * 있게 null만 반환하고 예외를 던지지 않는다.
 */
export async function extractDominantColors(
  imageUrl: string,
  count = 3,
): Promise<ColorSwatch[] | null> {
  try {
    const buffer = await loadImageBuffer(imageUrl);
    const { data, info } = await sharp(buffer)
      .resize(SAMPLE_SIZE, SAMPLE_SIZE, { fit: "inside" })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const channels = info.channels;
    const buckets = new Map<string, { r: number; g: number; b: number; n: number }>();

    for (let i = 0; i + channels <= data.length; i += channels) {
      const r = data[i]!;
      const g = data[i + 1]!;
      const b = data[i + 2]!;
      const a = channels === 4 ? data[i + 3]! : 255;
      if (a < 32) continue; // 투명 픽셀은 배경 제거된 로고 등에서 흔하므로 제외

      const key = `${Math.floor(r / QUANTIZE_STEP)}-${Math.floor(g / QUANTIZE_STEP)}-${Math.floor(b / QUANTIZE_STEP)}`;
      const bucket = buckets.get(key);
      if (bucket) {
        bucket.r += r;
        bucket.g += g;
        bucket.b += b;
        bucket.n += 1;
      } else {
        buckets.set(key, { r, g, b, n: 1 });
      }
    }

    if (buckets.size === 0) return null;

    const top = [...buckets.values()].sort((a, b) => b.n - a.n).slice(0, count);
    return top.map((bucket, index) => {
      const hex = `#${toHex(bucket.r / bucket.n)}${toHex(bucket.g / bucket.n)}${toHex(bucket.b / bucket.n)}`;
      return { hex, label: `주요 색상 ${index + 1}` };
    });
  } catch (err) {
    logger.warn("Dominant color extraction failed", {
      errorCode: "DOMINANT_COLOR_EXTRACTION_FAILED",
      details: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}
