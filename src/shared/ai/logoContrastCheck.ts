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
// 강조색 후보가 "노이즈 픽셀 몇 개"가 아니라 그 장면에 실제로 쓰인
// 톤이라고 볼 수 있으려면 샘플 중 최소 이 비율은 차지해야 한다.
const MIN_ACCENT_SHARE = 0.02;
// 로고 잉크 색 중 1등 클러스터가 이 비율 이상을 차지해야 "사실상 단색
// 로고"로 본다 -- 2026-07-31 사용자 지적: 로고가 여러 색이면 그중 하나로
// "통일"해서 바꿀 수 없으니 이 색상 조정 로직 자체를 건너뛰어야 한다.
const MONOCHROME_DOMINANCE_THRESHOLD = 0.85;
// 로고 이미지 네 모서리가 서로 이 이내로 가까우면 "배경(캔버스)색"으로
// 간주해서 단색 판정에서 제외한다 -- 알파 채널 없는 JPG로 로고를 첨부하면
// 로고 주변 배경까지 "로고의 색"으로 잡혀서 실제론 단색인 로고가 여러
// 색으로 오판되는 걸 막기 위함.
const CORNER_BACKGROUND_MAX_DISTANCE = 20;

interface Rgb {
  r: number;
  g: number;
  b: number;
}

interface ColorCluster extends Rgb {
  n: number;
}

interface RawImage {
  data: Buffer;
  width: number;
  height: number;
  channels: number;
}

/**
 * "white"/"black"는 최후의 안전장치일 뿐이다 -- 배경에 실제로 쓰인
 * 강조색(예: 어두운 매장 간판의 금색 트림/글자)이 충분한 대비를 낸다면
 * 그 색을 그대로 추천해서, 로고가 그 장면의 실제 톤에 자연스럽게
 * 녹아들게 한다("사용자 지적: 무조건 흰/검이 아니라 배경의 골드·베이지
 * 톤으로 유도리 있게 바뀌어야 한다", 2026-07-31).
 */
export type RecommendedTone = { kind: "accent"; hex: string } | { kind: "white" } | { kind: "black" };

export interface LogoContrastCheckResult {
  needsAdjustment: boolean;
  recommendedTone: RecommendedTone | null;
  /** 로고가 다색이라 이 로직 자체를 건너뛴 경우 등, 실제로 계산하지 않았으면 null. */
  contrastRatio: number | null;
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

async function decodeRaw(buffer: Buffer): Promise<RawImage> {
  const { data, info } = await sharp(buffer)
    .resize(SAMPLE_SIZE, SAMPLE_SIZE, { fit: "inside" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: info.channels };
}

function pixelAt(raw: RawImage, x: number, y: number): Rgb | null {
  const idx = (y * raw.width + x) * raw.channels;
  const a = raw.channels === 4 ? raw.data[idx + 3]! : 255;
  if (a < 32) return null; // 투명 픽셀
  return { r: raw.data[idx]!, g: raw.data[idx + 1]!, b: raw.data[idx + 2]! };
}

function colorDistance(a: Rgb, b: Rgb): number {
  return Math.max(Math.abs(a.r - b.r), Math.abs(a.g - b.g), Math.abs(a.b - b.b));
}

function avgRgb(colors: Rgb[]): Rgb {
  return {
    r: colors.reduce((s, c) => s + c.r, 0) / colors.length,
    g: colors.reduce((s, c) => s + c.g, 0) / colors.length,
    b: colors.reduce((s, c) => s + c.b, 0) / colors.length,
  };
}

/** 네 모서리가 서로 충분히 가까우면 그 평균을 "배경(캔버스)색"으로
 * 추정한다. 이미 투명한 모서리가 2개 이상이면(진짜 투명 PNG) 이 판정
 * 자체가 불필요하므로 null -- 알파 제외만으로 이미 충분하다. */
function detectCornerBackground(raw: RawImage): Rgb | null {
  const corners = [
    pixelAt(raw, 0, 0),
    pixelAt(raw, raw.width - 1, 0),
    pixelAt(raw, 0, raw.height - 1),
    pixelAt(raw, raw.width - 1, raw.height - 1),
  ];
  const opaqueCorners = corners.filter((c): c is Rgb => c !== null);
  if (opaqueCorners.length < 3) return null;

  const avg = avgRgb(opaqueCorners);
  const allClose = opaqueCorners.every((c) => colorDistance(c, avg) <= CORNER_BACKGROUND_MAX_DISTANCE);
  return allClose ? avg : null;
}

interface ClusterOptions {
  /** 이 색(들)과 거리가 가까운 픽셀은 "배경/캔버스"로 보고 클러스터링에서 제외한다. */
  excludeNear?: { color: Rgb; tolerance: number }[];
}

function clustersFromRaw(raw: RawImage, opts: ClusterOptions = {}): ColorCluster[] {
  const buckets = new Map<string, { r: number; g: number; b: number; n: number }>();

  for (let y = 0; y < raw.height; y++) {
    for (let x = 0; x < raw.width; x++) {
      const pixel = pixelAt(raw, x, y);
      if (!pixel) continue;
      if (opts.excludeNear?.some((ex) => colorDistance(pixel, ex.color) <= ex.tolerance)) continue;

      const key = `${Math.floor(pixel.r / QUANTIZE_STEP)}-${Math.floor(pixel.g / QUANTIZE_STEP)}-${Math.floor(pixel.b / QUANTIZE_STEP)}`;
      const bucket = buckets.get(key);
      if (bucket) {
        bucket.r += pixel.r;
        bucket.g += pixel.g;
        bucket.b += pixel.b;
        bucket.n += 1;
      } else {
        buckets.set(key, { r: pixel.r, g: pixel.g, b: pixel.b, n: 1 });
      }
    }
  }

  return [...buckets.values()]
    .sort((a, b) => b.n - a.n)
    .map((c) => ({ r: c.r / c.n, g: c.g / c.n, b: c.b / c.n, n: c.n }));
}

function toHex({ r, g, b }: Rgb): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${[r, g, b].map((c) => clamp(c).toString(16).padStart(2, "0")).join("")}`;
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

interface LogoAnalysis {
  isMonochrome: boolean;
  dominantColor: Rgb | null;
}

/**
 * 로고 잉크 자체가 사실상 단색인지 판정한다. 배경/캔버스 여백은 제외하고
 * 봐야 한다 -- 투명 PNG는 알파 채널로 이미 걸러지지만, 배경이 함께 있는
 * JPG처럼 알파가 없는 파일은 모서리 색을 "배경"으로 추정해 같이 제외한다
 * (2026-07-31 사용자 지적: 배경 포함해서 색깔이 여러 개로 오판하면 안 됨).
 */
async function analyzeLogo(logoBuffer: Buffer): Promise<LogoAnalysis> {
  const raw = await decodeRaw(logoBuffer);
  const cornerBackground = detectCornerBackground(raw);
  const excludeNear: { color: Rgb; tolerance: number }[] = [{ color: { r: 250, g: 250, b: 250 }, tolerance: 12 }];
  if (cornerBackground) excludeNear.push({ color: cornerBackground, tolerance: CORNER_BACKGROUND_MAX_DISTANCE });

  let clusters = clustersFromRaw(raw, { excludeNear });
  if (clusters.reduce((sum, c) => sum + c.n, 0) === 0) {
    // 배경 제외 후 남는 픽셀이 하나도 없다 -- 로고가 여백 없이 캔버스
    // 전체를 꽉 채우는 경우(정사각형 아이콘 등) 등, 배경 제외 자체가
    // 잘못된 판정이었다는 뜻이므로 제외 없이 다시 판정한다.
    clusters = clustersFromRaw(raw, {});
  }

  const total = clusters.reduce((sum, c) => sum + c.n, 0);
  if (total === 0 || !clusters[0]) return { isMonochrome: true, dominantColor: null };

  return { isMonochrome: clusters[0].n / total >= MONOCHROME_DOMINANCE_THRESHOLD, dominantColor: clusters[0] };
}

/** 배경의 지배색(주로 바탕색) 자체가 아니라, 그 다음으로 자주 나오면서
 * 지배색과 대비가 충분한 강조색(금색 트림, 포인트 컬러 등)을 찾는다.
 * 없으면 null -- 호출부가 흰/검 폴백으로 넘어간다. */
function findAccentCandidate(clusters: ColorCluster[], dominant: ColorCluster): RecommendedTone | null {
  const totalSamples = clusters.reduce((sum, c) => sum + c.n, 0);
  if (totalSamples === 0) return null;

  for (const candidate of clusters) {
    if (candidate === dominant) continue;
    if (candidate.n / totalSamples < MIN_ACCENT_SHARE) break; // 이후로는 더 희귀하므로 중단(빈도순 정렬됨)
    if (contrastRatio(candidate, dominant) >= MIN_CONTRAST_RATIO) {
      return { kind: "accent", hex: toHex(candidate) };
    }
  }
  return null;
}

/**
 * 로고와 배경 사진의 지배색 사이 명도 대비를 계산해, 로고가 배경에
 * 묻힐 정도로 대비가 부족한 경우에만 색상 조정을 지시할 수 있게 판단
 * 결과를 반환한다. AI 판단이 아니라 실제 픽셀 계산(sharp)이라 비용이
 * 들지 않고 결과가 일관적이다.
 *
 * 2026-07-31 사용자 지적 반영: (1) 로고가 다색이면 어차피 하나의 색으로
 * "통일"할 수 없으니 이 조정 로직 자체를 건너뛰고 원본 그대로 유지한다
 * -- 단색 로고일 때만 적용. (2) 조정이 필요하면 흰/검부터 시도하지 않고
 * 배경에 실제로 쓰인 강조색(예: 어두운 간판의 금색 트림)을 먼저 찾는다.
 * 그런 색이 없을 때에만 흰색/검정 최후 수단으로 폴백한다.
 *
 * 실패하면(디코딩 불가 등) null을 반환해 호출부가 "조정 없이 원본 그대로
 * 유지"라는 기존 기본 동작으로 안전하게 폴백하게 한다.
 */
export async function checkLogoBackgroundContrast(
  logoBuffer: Buffer,
  backgroundBuffer: Buffer,
  placementArea?: PlacementArea,
): Promise<LogoContrastCheckResult | null> {
  try {
    const logoAnalysis = await analyzeLogo(logoBuffer);
    if (!logoAnalysis.dominantColor) return null;
    if (!logoAnalysis.isMonochrome) {
      // 다색 로고 -- 대부분의 경우처럼 그대로 넣는다. 색상 조정 자체를 스킵.
      return { needsAdjustment: false, recommendedTone: null, contrastRatio: null };
    }
    const logoColor = logoAnalysis.dominantColor;

    const backgroundRegion = placementArea ? await cropToPlacementArea(backgroundBuffer, placementArea) : backgroundBuffer;
    const backgroundRaw = await decodeRaw(backgroundRegion);
    const backgroundClusters = clustersFromRaw(backgroundRaw);
    const backgroundColor = backgroundClusters[0];
    if (!backgroundColor) return null;

    const ratio = contrastRatio(logoColor, backgroundColor);
    if (ratio >= MIN_CONTRAST_RATIO) {
      return { needsAdjustment: false, recommendedTone: null, contrastRatio: ratio };
    }

    const accent = findAccentCandidate(backgroundClusters, backgroundColor);
    if (accent) {
      return { needsAdjustment: true, recommendedTone: accent, contrastRatio: ratio };
    }

    const backgroundIsDark = relativeLuminance(backgroundColor) < 0.4;
    return {
      needsAdjustment: true,
      recommendedTone: { kind: backgroundIsDark ? "white" : "black" },
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
