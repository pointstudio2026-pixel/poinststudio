export interface RecordGuestMockupUsageInput {
  guestId: string;
  projectId: string;
  standaloneMockupId: string;
  requestIp?: string | null;
}

export interface ClaimGuestMockupsResult {
  claimedCount: number;
}

export interface GuestMockupUsageRepository {
  countByGuestId(guestId: string): Promise<number>;
  create(input: RecordGuestMockupUsageInput): Promise<void>;
  /**
   * guestId 소유의 미claim(claimedAt = null) 목업을 전부 userId로
   * 재할당한다: Project.userId/StandaloneMockup.userId를 바꾸고
   * claimedAt/claimedByUserId를 채운다. Project/StandaloneMockup 재할당은
   * 항상 현재 소유자가 SYSTEM_GUEST_USER_ID인 행만 대상으로 해서(안전
   * 조건), 이미 다른 계정으로 넘어간 걸 실수로 다시 뺏지 않는다.
   */
  claimAllForGuest(guestId: string, userId: string): Promise<ClaimGuestMockupsResult>;
}
