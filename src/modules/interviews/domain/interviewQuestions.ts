export const OTHER_ANSWER_PREFIX = "기타: ";

export interface InterviewQuestionDef {
  key: string;
  text: string;
  type: "text" | "textarea" | "select";
  required: boolean;
  /** Only present for type "select" — a fixed checklist the user picks from. */
  options?: string[];
  /**
   * type "select" 전용, `options`의 대안. 큰 주제(group) 아래 세부 옵션을
   * 묶어 2단계로 고르게 한다(대주제 선택 → 세부 옵션 노출). 실제로 저장되는
   * 답변은 항상 leaf 옵션 문자열 그대로이고 그룹 이름은 저장되지 않는다 --
   * 순수 UI 탐색 보조 수단이라 다운스트림(SaveAnswerUseCase, 브랜드 전략/
   * 스타일 추천이 읽는 answers[key])은 이 필드의 존재 여부와 무관하게 항상
   * 동일하게 동작한다.
   */
  optionGroups?: { group: string; options: string[] }[];
  /**
   * type "select" 전용. true면 여러 항목을 토글로 고를 수 있다(체크박스 방식) --
   * 답변은 콤마로 이어붙인 문자열로 저장된다(예: "행사명/타이틀, 날짜, QR코드").
   * 새 스키마/컬럼 없이 기존 answer: string 필드를 그대로 재사용한다.
   */
  multiple?: boolean;
  /**
   * type "select" 전용. true면 보기 목록 끝에 "기타(직접 입력)" 옵션이 추가로
   * 렌더링된다 — 선택하면 자유 텍스트를 입력할 수 있고, 저장값은
   * `OTHER_ANSWER_PREFIX`를 붙여 구분한다(복원 시 기타 모드였는지 판별하는 용도).
   * `DELIVERABLE_ORIENTATION_QUESTION`처럼 정확한 문자열 매칭으로 소비되는
   * 질문에는 절대 켜지 않는다(자유 입력이 매칭 실패로 조용히 폴백되는 사고 방지).
   */
  allowOther?: boolean;
}

// 업종 체크리스트 -- industryQuestions.ts의 키워드 분기 로직과 맞물리도록
// 각 항목 라벨에 해당 keyword를 포함시켰다 (예: "카페"가 라벨에 있어야
// matchIndustryQuestions의 "카페" 키워드 매칭이 그대로 동작한다).
export const INDUSTRY_OPTIONS = [
  "카페/커피",
  "레스토랑/외식",
  "병원/의원/클리닉",
  "IT/스타트업",
  "리테일/쇼핑몰",
  "뷰티/화장품",
  "패션/의류",
  "교육",
  "부동산",
  "피트니스/헬스",
  "반려동물",
  "여행/숙박",
  "금융",
  "제조업",
  "식품/농수산물",
  "예술/디자인",
  "컨설팅",
  "비영리/공공",
  "기타",
];

// 목적/타깃 고객 보기 -- 유형화 가능한 넓은 범위라 객관식으로 전환(사용자
// 지시: "물어보는 범위가 넓고 유형화 가능할수록 객관식"). 브랜드마다 유일한
// 정보(브랜드명)만 주관식으로 남긴다.
export const PURPOSE_OPTIONS = [
  "신제품 출시",
  "기존 브랜드 리뉴얼",
  "창업/오픈",
  "사이드 프로젝트",
  "포트폴리오/개인 브랜딩",
  "사내용/비영리",
];

// "목적" 질문을 대주제 → 세부내용 2단계로 고를 수 있게 하는 그룹 정의 --
// leaf 옵션은 PURPOSE_OPTIONS와 정확히 동일(새 내용 없음), 대주제로 묶기만
// 한다.
export const PURPOSE_OPTION_GROUPS: { group: string; options: string[] }[] = [
  { group: "새로운 시작", options: ["신제품 출시", "창업/오픈"] },
  { group: "기존 브랜드 정비", options: ["기존 브랜드 리뉴얼"] },
  { group: "개인 · 포트폴리오", options: ["사이드 프로젝트", "포트폴리오/개인 브랜딩"] },
  { group: "내부 · 비영리용", options: ["사내용/비영리"] },
];

export const TARGET_AUDIENCE_OPTIONS = [
  "10대",
  "20대",
  "30대",
  "40대",
  "50대 이상",
  "전 연령대",
  "직장인",
  "학생",
  "주부",
  "시니어",
  "전문직",
  "사업자/자영업자",
];

// brandKnowledgeRules.ts의 TONE_KEYWORDS 5개 버킷과 정확히 맞춘 보기 --
// 이 필드는 이전엔 인터뷰 질문 자체가 없어 inferTone()이 한 번도 실행되지
// 않는 죽은 코드였다. 라벨에 각 정규식이 매칭하는 키워드를 그대로 포함시켜야
// 실제로 해당 톤으로 분류된다(단일 선택이라 라벨 전체가 그대로 answer가 됨).
export const DESIRED_IMPRESSION_OPTIONS = [
  "편안하고 따뜻한 느낌", // 편안|따뜻|아늑|친근 → "친근하고 따뜻한"
  "전문적이고 신뢰감 있는 느낌", // 전문|신뢰|정확 → "전문적이고 신뢰감 있는"
  "고급스럽고 세련된 느낌", // 고급|프리미엄|세련 → "세련되고 고급스러운"
  "활기차고 트렌디한 느낌", // 활기|젊|트렌디|재미 → "활기차고 트렌디한"
  "자연스럽고 균형 잡힌 느낌", // 위 4개 어디에도 안 걸림 → 기본값 "균형 잡히고 진정성 있는"
];

// 인터뷰를 짧게 유지하기 위해 5개 핵심 질문만 남긴다 (브랜드명/업종/목적/
// 타깃 고객/원하는 인상 — Aster Brain의 Brand Knowledge 추론과 Prompt
// Engine에 직접 쓰이는 필드). "어떤 종류의 작업물을 만들고 싶은지"는 더
// 이상 인터뷰 질문이 아니라 프로젝트 생성 직후 가장 먼저 묻는 별도
// 워크스페이스 단계(deliverableTypes.ts, "작업물 유형" 단계)로 승격되었다
// — 그 답에 따라 이 아래 질문 구성 자체가 달라지므로
// (deliverableTypeQuestions.ts) 인터뷰보다 먼저 알아야 한다. 업종별 추가
// 질문(industryQuestions.ts)과 AI 후속 질문은 그대로 유지되며, 해당 업종에
// 한해 몇 개 더 늘어날 수 있다.
export const INTERVIEW_QUESTIONS: InterviewQuestionDef[] = [
  { key: "brandName", text: "브랜드 이름이 무엇인가요?", type: "text", required: true },
  {
    key: "industry",
    text: "어떤 업종인가요?",
    type: "select",
    required: true,
    allowOther: true,
    options: INDUSTRY_OPTIONS,
  },
  {
    key: "purpose",
    text: "이 브랜드가 존재하는 목적은 무엇인가요?",
    type: "select",
    required: true,
    multiple: true,
    allowOther: true,
    options: PURPOSE_OPTIONS,
    optionGroups: PURPOSE_OPTION_GROUPS,
  },
  {
    key: "targetAudience",
    text: "주요 타깃 고객은 누구인가요? (해당하는 항목을 모두 선택해주세요)",
    type: "select",
    required: true,
    multiple: true,
    allowOther: true,
    options: TARGET_AUDIENCE_OPTIONS,
  },
  {
    key: "desiredImpression",
    text: "브랜드가 사람들에게 주고 싶은 인상은 무엇인가요?",
    type: "select",
    required: true,
    options: DESIRED_IMPRESSION_OPTIONS,
  },
  // 배송타입별 deliverableAvoidElements(피하고 싶은 요소)는 로고를 포함한
  // "브랜딩 & 로고" 유형에는 아예 안 물어보는 질문이라(matchDeliverableTypeQuestions
  // 참고), 로고 프로젝트도 빠짐없이 하드제약을 답할 수 있게 여기 공통
  // 질문으로 하나 둔다. promptPriority 모듈의 classifyInterviewInput()이
  // 이 답을 HardConstraintSet.forbiddenElements로 읽는다.
  {
    key: "forbiddenElements",
    text: "절대 포함되면 안 되는 요소가 있나요? (선택 사항)",
    type: "select",
    required: false,
    multiple: true,
    allowOther: true,
    options: ["특정 동물/인물 이미지", "특정 상징/아이콘", "종교적 상징", "가격/금액 표시", "복잡한 배경"],
  },
  {
    key: "additionalNotes",
    text: "그 외 사항(무조건 포함되어야 하는 내용 또는 제외되어야하는 내용)이 있다면 알려주세요.",
    type: "textarea",
    required: false,
  },
];
