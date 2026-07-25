import { randomInt } from "node:crypto";

// 0/O, 1/I/L처럼 손으로 옮겨 적을 때 헷갈리는 문자를 뺀 32자 알파벳.
const SAFE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomSegment(length: number): string {
  return Array.from({ length }, () => SAFE_ALPHABET[randomInt(SAFE_ALPHABET.length)]).join("");
}

/** ASTER-XXXX-XXXX 형태(사람이 직접 타이핑하기 좋은 길이) -- 4^32 * 4^32 조합이라 추측 공격에도 안전하다. */
export function generateGiftCode(): string {
  return `ASTER-${randomSegment(4)}-${randomSegment(4)}`;
}

/** 사용자가 입력한 코드를 붙여넣기/공백/대소문자 차이와 무관하게 비교할 수 있도록 정규화한다. */
export function normalizeGiftCode(input: string): string {
  return input.trim().toUpperCase();
}
