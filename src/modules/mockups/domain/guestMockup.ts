/**
 * FK 소유자로 쓰는 고정 시스템 게스트 User의 id. 반드시
 * prisma/migrations/20260731100000_add_guest_mockup_usage/migration.sql의
 * INSERT 문 id 값과 byte-identical해야 한다.
 */
export const SYSTEM_GUEST_USER_ID = "00000000-0000-0000-0000-000000000001";

/** 게스트(비로그인) 1명이 회원가입 전까지 무료로 만들 수 있는 목업 개수(평생, 월간 아님). */
export const GUEST_MOCKUP_LIFETIME_LIMIT = 3;
