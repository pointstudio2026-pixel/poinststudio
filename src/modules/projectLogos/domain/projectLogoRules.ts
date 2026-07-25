// userStyleRules.ts와 동일한 기준(비용/남용 방지) -- 래스터 이미지만,
// SVG/PDF 등 벡터는 v1 범위 밖(서버 사이드 래스터화 없이는 목업 합성에
// 바로 못 쓴다).
export const MAX_LOGO_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const ALLOWED_LOGO_CONTENT_TYPES = ["image/png", "image/jpeg"] as const;

export function isAllowedLogoContentType(contentType: string): boolean {
  return (ALLOWED_LOGO_CONTENT_TYPES as readonly string[]).includes(contentType);
}
