// 비용/남용 방지 -- 카테고리당 이미지 개수와 장당 용량을 제한한다.
export const MAX_REFERENCES_PER_CATEGORY = 5;
export const MAX_REFERENCE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const ALLOWED_REFERENCE_CONTENT_TYPES = ["image/png", "image/jpeg"] as const;

export function isAllowedReferenceContentType(contentType: string): boolean {
  return (ALLOWED_REFERENCE_CONTENT_TYPES as readonly string[]).includes(contentType);
}
