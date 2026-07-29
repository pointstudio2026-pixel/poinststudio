import sharp from "sharp";
import type { PlacementArea } from "@/shared/ai/MockupRenderProvider";
import { logger } from "@/shared/logging/logger";

const SAMPLE_SIZE = 64;
// 채널당 32 단위로 양자화(0~255 -> 8 구간) -- dominantColorExtractor.ts와
// 동일한 방식(512개 버킷, 64x64 샘플)으로 지배색을 뽑는다.
const QUANTIZE_STEP = 32;
// 배경 사진 위에서 로고가 눈에 띄려면 필요한 최소 명도 대비. WCAG AA의
// 텍스트 기준(4.5:1, 큰 텍스트는 3:1)보다 낮게 잡았다 -- 이건 접근성
// 규격 준수가 아니라 "사진 속에서 로고가 완전히 묻히는" 극단적인 경우만
// 잡아내는 러프한 안전장치이므로, 기준을 너무 높이면 실제로는 괜찮은
// 조합까지 불필요하게 흰색/검정으로 바꿔버리게 된다.
const MIN_CONTRAST_RATIO = 2.2;

interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface LogoContrastCheckResult {
  needsAdjustment: boolean;
  recommendedTone: "white" | "black" | null;
  contrastRatio: number;
}

/** 배경 사진 전체가 아니라 로고가 실제로 놓일 영역만 잘라내 지배색을 뽑는다
 * -- 명함처럼 어두운 카드가 밝은 대리석 테이블 위에 놓인 사진은 전체
 * 사진의 지배색(테이블)이 실제 로고가 놓일 자리(카드)와 다를 수 있다.
 * 좌표 계산이 실패하면(메타데이터 없음 등) 원본 버퍼를 그대로 반환한다. */
async function cropToPlacementArea(buffer: Buffer, area: PlacementArea): Promise<Buffer> {
  const metadata = await sharp(buffer).metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  if (!width || !height) return buffer;

  const left = Math.min(width - 1, Math.max(0, Math.round((area.xPct / 100) * width)));
  const top = Math.min(height - 1, Math.max(0, Math.round((area.yPct / 100) * height)));
  const extractWidth = Math.max(1, Math.min(width - left, Math.round((area.widthPct / 100) * width)));
  const extractHeight = Math.max(1, Math.min(height - top, Math.round((area.heightPct / 100) * height)));

  return sharp(buffer).extract({ left, top, width: extractWidth, height: extractHeight }).toBuffer();
}

async function dominantColorFromBuffer(buffer: Buffer, excludeNearWhite: boolean): Promise<Rgb | null> {
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
    if (a < 32) continue; // 투명 배경(로고 PNG)은 제외
    if (excludeNearWhite && r > 240 && g > 240 && b > 240) continue; // 로고 캔버스의 흰 여백 제외

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
  const top = [...buckets.values()].sort((a, b) => b.n - a.n)[0]!;
  return { r: top.r / top.n, g: top.g / top.n, b: top.b / top.n };
}

// WCAG 상대 명도 공식.
function relativeLuminance({ r, g, b }: Rgb): number {
  const linear = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!;
}

function contrastRatio(a: Rgb, b: Rgb): number {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * 로고와 배경 사진의 지배색 사이 명도 대비를 계산해, 로고가 배경에
 * 묻힐 정도로 대비가 부족한 경우에만 흰색/검정 단색으로 조정하라는
 * 지시를 프롬프트에 추가할 수 있게 판단 결과를 반환한다. AI 판단이
 * 아니라 실제 픽셀 계산(sharp)이라 비용이 들지 않고 결과가 일관적이다.
 * 실패하면(디코딩 불가 등) null을 반환해 호출부가 "조정 없이 원본 그대로
 * 유지"라는 기존 기본 동작으로 안전하게 폴백하게 한다.
 */
export async function checkLogoBackgroundContrast(
  logoBuffer: Buffer,
  backgroundBuffer: Buffer,
  placementArea?: PlacementArea,
): Promise<LogoContrastCheckResult | null> {
  try {
    const backgroundRegion = placementArea ? await cropToPlacementArea(backgroundBuffer, placementArea) : backgroundBuffer;
    const [logoColor, backgroundColor] = await Promise.all([
      dominantColorFromBuffer(logoBuffer, true),
      dominantColorFromBuffer(backgroundRegion, false),
    ]);
    if (!logoColor || !backgroundColor) return null;

    const ratio = contrastRatio(logoColor, backgroundColor);
    if (ratio >= MIN_CONTRAST_RATIO) {
      return { needsAdjustment: false, recommendedTone: null, contrastRatio: ratio };
    }

    const backgroundIsDark = relativeLuminance(backgroundColor) < 0.4;
    return {
      needsAdjustment: true,
      recommendedTone: backgroundIsDark ? "white" : "black",
      contrastRatio: ratio,
    };
  } catch (err) {
    logger.warn("Logo/background contrast check failed", {
      errorCode: "LOGO_CONTRAST_CHECK_FAILED",
      details: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}
