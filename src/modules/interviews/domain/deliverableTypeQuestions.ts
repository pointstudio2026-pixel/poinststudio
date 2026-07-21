import type { InterviewQuestionDef } from "@/modules/interviews/domain/interviewQuestions";
import { BRANDING_LOGO_DELIVERABLE_TYPE } from "@/modules/projects/domain/deliverableTypes";

interface DeliverableTypeQuestionSet {
  deliverableType: string;
  /**
   * 그 유형 전용 핵심 맥락 질문의 key. 대부분 유형화 가능한 범위(행사 종류,
   * 핵심 메시지 종류 등)라 select+다중선택+기타(직접입력)로 전환했다 --
   * 명함/패키지처럼 브랜드마다 유일한 실제 텍스트(이름·연락처, 정확한
   * 제품명)가 필요한 경우에만 예외적으로 text를 유지한다.
   */
  freeformKey: string;
  /** 그 유형 전용 "꼭 포함할 요소" 다중 선택 질문의 key. */
  requiredElementsKey: string;
  questions: InterviewQuestionDef[];
}

// 이미지 스타일/배경 스타일/피해야 할 요소는 7개 유형 모두 동일한 선택지가
// 유효하므로 한 번만 정의해 각 유형 질문 배열에 이어붙인다(중복 정의 금지).
// 타이핑이 필요한 자유 서술형은 유형별로 다르게 두고, 이 3개는 전부 선택형이라
// "선택형으로 심플하게"라는 요청에 직접 부합한다.
const DELIVERABLE_IMAGE_STYLE_KEY = "deliverableImageStyle";
const DELIVERABLE_BACKGROUND_STYLE_KEY = "deliverableBackgroundStyle";
const DELIVERABLE_AVOID_ELEMENTS_KEY = "deliverableAvoidElements";
/** sizePresetRules.ts의 ORIENTATION_OPTION_TO_PRESET과 옵션 문구가 정확히 일치해야 한다. */
const DELIVERABLE_ORIENTATION_KEY = "deliverableOrientation";

// 포스터/리플렛/브로슈어/패키지는 실제로 세로/가로/정사각이 다 흔해서
// 애매하지만, 명함(가로)/앱 디자인(세로)/웹사이트(가로)/로고(정사각)는
// 유형상 방향이 사실상 고정이라 이 질문을 두지 않고 sizePresetRules.ts에서
// 자동으로 결정한다.
const DELIVERABLE_ORIENTATION_QUESTION: InterviewQuestionDef = {
  key: DELIVERABLE_ORIENTATION_KEY,
  text: "어떤 방향/비율로 제작할까요?",
  type: "select",
  required: true,
  options: [
    "세로형 (A4·B4 등 세로 포스터/문서)",
    "가로형 (와이드 배너/가로형)",
    "정사각형 (SNS 정사각 등)",
  ],
};

const SHARED_DELIVERABLE_QUESTIONS: InterviewQuestionDef[] = [
  {
    key: DELIVERABLE_IMAGE_STYLE_KEY,
    text: "어떤 이미지 스타일을 원하시나요?",
    type: "select",
    required: true,
    allowOther: true,
    options: ["실사 사진", "일러스트레이션", "아이콘·심볼 중심", "이미지 없이 타이포 중심"],
  },
  {
    key: DELIVERABLE_BACKGROUND_STYLE_KEY,
    text: "배경은 어떤 스타일이면 좋을까요?",
    type: "select",
    required: true,
    allowOther: true,
    options: ["단색 배경", "사진 배경", "패턴·텍스처", "그라디언트", "화이트스페이스(여백 강조)"],
  },
  {
    key: DELIVERABLE_AVOID_ELEMENTS_KEY,
    text: "피하고 싶은 요소가 있나요? (선택 사항)",
    type: "select",
    required: false,
    multiple: true,
    allowOther: true,
    options: ["가격/금액 표시", "특정 인물 사진", "복잡한 배경", "과도한 텍스트", "그림자·입체 효과"],
  },
];

// "브랜딩 & 로고"는 이미 브랜드 전략/로고 스타일이라는 별도 단계로 깊이를
// 얻으므로 여기서는 추가 질문을 두지 않는다. 나머지 7개 유형은 각자 핵심
// 맥락 1개(대부분 select+다중선택+기타, 명함/패키지만 진짜 고유값이라 text)
// + "꼭 포함할 요소" 다중 선택 1개 + 위 공통 선택형 3개로 짜임새 있는
// 브리프를 확보한다.
const DELIVERABLE_TYPE_QUESTION_SETS: DeliverableTypeQuestionSet[] = [
  {
    deliverableType: "포스터",
    freeformKey: "posterContext",
    requiredElementsKey: "posterRequiredElements",
    questions: [
      {
        key: "posterContext",
        text: "포스터가 사용될 행사나 상황은 무엇인가요?",
        type: "select",
        required: true,
        multiple: true,
        allowOther: true,
        options: ["신제품 출시", "시즌 프로모션/할인", "채용 공고", "전시·박람회", "오픈 기념", "브랜드 캠페인", "행사/세미나 안내"],
      },
      {
        key: "posterRequiredElements",
        text: "꼭 포함되어야 할 요소를 선택해주세요.",
        type: "select",
        required: true,
        multiple: true,
        allowOther: true,
        options: ["행사명/타이틀", "날짜", "장소", "가격/참가비", "주최자 로고", "QR코드/연락처"],
      },
      DELIVERABLE_ORIENTATION_QUESTION,
      ...SHARED_DELIVERABLE_QUESTIONS,
    ],
  },
  {
    deliverableType: "리플렛",
    freeformKey: "leafletKeyInfo",
    requiredElementsKey: "leafletRequiredElements",
    questions: [
      {
        key: "leafletKeyInfo",
        text: "리플렛에 담고 싶은 핵심 정보는 무엇인가요?",
        type: "select",
        required: true,
        multiple: true,
        allowOther: true,
        options: ["제품/서비스 소개", "가격/요금 안내", "매장 위치/이용 안내", "이벤트/프로모션", "회사 소개", "연락처/예약 방법"],
      },
      {
        key: "leafletRequiredElements",
        text: "꼭 포함되어야 할 요소를 선택해주세요.",
        type: "select",
        required: true,
        multiple: true,
        allowOther: true,
        options: ["제목", "핵심 정보 목록", "연락처", "지도/위치", "가격표", "브랜드 로고"],
      },
      // 리플렛은 삼단 접지 6패널을 펼친 가로 스트립으로 항상 생성하므로
      // (promptBuilder.ts DELIVERABLE_OBJECTIVES.리플렛 참고) 방향을 물어볼
      // 필요가 없다 -- sizePresetRules.ts의 FIXED_ORIENTATION_BY_TYPE에서
      // landscape로 고정 처리한다.
      ...SHARED_DELIVERABLE_QUESTIONS,
    ],
  },
  {
    deliverableType: "브로슈어",
    freeformKey: "brochureKeyMessage",
    requiredElementsKey: "brochureRequiredElements",
    questions: [
      {
        key: "brochureKeyMessage",
        text: "브로슈어를 통해 전달하고 싶은 핵심 메시지는 무엇인가요?",
        type: "select",
        required: true,
        multiple: true,
        allowOther: true,
        options: ["브랜드 신뢰성/전문성", "제품·서비스 강점", "회사 연혁/스토리", "고객 후기/성과", "차별화 포인트", "기업 비전/미션"],
      },
      {
        key: "brochureRequiredElements",
        text: "꼭 포함되어야 할 요소를 선택해주세요.",
        type: "select",
        required: true,
        multiple: true,
        allowOther: true,
        options: ["타이틀", "브랜드 로고", "핵심 메시지 문구", "제품/서비스 이미지", "연락처"],
      },
      DELIVERABLE_ORIENTATION_QUESTION,
      ...SHARED_DELIVERABLE_QUESTIONS,
    ],
  },
  {
    deliverableType: "명함",
    freeformKey: "businessCardInfo",
    requiredElementsKey: "businessCardRequiredElements",
    questions: [
      {
        // 이름/직함/연락처 등 브랜드마다 완전히 유일한 실제 값이라 보기로
        // 나열할 수 없다 -- 예외적으로 자유 입력을 유지한다.
        key: "businessCardInfo",
        text: "명함에 들어갈 실제 정보를 입력해주세요. (예: 이름, 직함, 전화번호, 이메일 등)",
        type: "textarea",
        required: true,
      },
      {
        key: "businessCardRequiredElements",
        text: "꼭 포함되어야 할 요소를 선택해주세요.",
        type: "select",
        required: true,
        multiple: true,
        allowOther: true,
        options: ["이름", "직함", "전화번호", "이메일", "주소", "QR코드", "로고"],
      },
      ...SHARED_DELIVERABLE_QUESTIONS,
    ],
  },
  {
    deliverableType: "패키지",
    freeformKey: "packagingProduct",
    requiredElementsKey: "packagingRequiredElements",
    questions: [
      {
        // 정확한 제품명은 브랜드마다 유일한 고유 명사라 보기로 나열할 수
        // 없다 -- 예외적으로 자유 입력을 유지한다.
        key: "packagingProduct",
        text: "패키지에 담길 정확한 제품명은 무엇인가요?",
        type: "text",
        required: true,
      },
      {
        key: "packagingRequiredElements",
        text: "꼭 포함되어야 할 요소를 선택해주세요.",
        type: "select",
        required: true,
        multiple: true,
        allowOther: true,
        options: ["제품명", "브랜드 로고", "용량/수량 표시", "성분/설명 문구", "바코드"],
      },
      DELIVERABLE_ORIENTATION_QUESTION,
      ...SHARED_DELIVERABLE_QUESTIONS,
    ],
  },
  {
    deliverableType: "앱 디자인",
    freeformKey: "appCoreFeature",
    requiredElementsKey: "appRequiredElements",
    questions: [
      {
        key: "appCoreFeature",
        text: "앱의 핵심 기능은 무엇인가요?",
        type: "select",
        required: true,
        multiple: true,
        allowOther: true,
        options: ["커머스/쇼핑", "예약/신청", "커뮤니티/소셜", "콘텐츠/정보 제공", "헬스케어/피트니스", "금융/결제", "교육/학습", "생산성/업무 도구"],
      },
      {
        key: "appRequiredElements",
        text: "꼭 포함되어야 할 요소를 선택해주세요.",
        type: "select",
        required: true,
        multiple: true,
        allowOther: true,
        options: ["네비게이션 바", "핵심 버튼(CTA)", "아이콘 세트", "상태 표시줄", "로고/브랜드 마크"],
      },
      ...SHARED_DELIVERABLE_QUESTIONS,
    ],
  },
  {
    deliverableType: "웹사이트",
    freeformKey: "websitePurpose",
    requiredElementsKey: "websiteRequiredElements",
    questions: [
      {
        key: "websitePurpose",
        text: "웹사이트의 주요 목적은 무엇인가요?",
        type: "select",
        required: true,
        multiple: true,
        allowOther: true,
        options: ["정보 제공/소개", "온라인 판매/커머스", "예약/문의 접수", "포트폴리오/작품 전시", "회원 커뮤니티", "채용", "블로그/콘텐츠 발행"],
      },
      {
        key: "websiteRequiredElements",
        text: "꼭 포함되어야 할 요소를 선택해주세요.",
        type: "select",
        required: true,
        multiple: true,
        allowOther: true,
        options: ["헤더/네비게이션", "메인 헤드라인", "CTA 버튼", "로고", "푸터"],
      },
      ...SHARED_DELIVERABLE_QUESTIONS,
    ],
  },
];

/** 작업물 유형은 닫힌 enum이라(자유 텍스트가 아니라 8개 옵션 중 하나) 키워드 매칭이 아닌 정확 일치로 조회한다. */
export function matchDeliverableTypeQuestions(deliverableType: string | null | undefined): InterviewQuestionDef[] {
  if (!deliverableType || deliverableType === BRANDING_LOGO_DELIVERABLE_TYPE) return [];
  return DELIVERABLE_TYPE_QUESTION_SETS.find((set) => set.deliverableType === deliverableType)?.questions ?? [];
}

/**
 * Prompt Engine이 그 유형 전용 답변 5개를 라벨과 함께 여러 줄로 조립한
 * 하나의 문자열로 받는다 -- promptBuilder.ts의 `deliverableContext` 필드는
 * 이미 단일 string 슬롯이라 시그니처 변경 없이 내용만 촘촘해진다.
 */
export function buildDeliverableContextText(
  deliverableType: string | null | undefined,
  answers: Record<string, string>,
): string | undefined {
  const set = DELIVERABLE_TYPE_QUESTION_SETS.find((s) => s.deliverableType === deliverableType);
  if (!set) return undefined;

  const freeform = answers[set.freeformKey];
  const requiredElements = answers[set.requiredElementsKey];
  const orientation = answers[DELIVERABLE_ORIENTATION_KEY];
  const imageStyle = answers[DELIVERABLE_IMAGE_STYLE_KEY];
  const backgroundStyle = answers[DELIVERABLE_BACKGROUND_STYLE_KEY];
  const avoidElements = answers[DELIVERABLE_AVOID_ELEMENTS_KEY];

  const lines = [
    freeform ? `핵심 목적: ${freeform}` : null,
    requiredElements ? `꼭 포함할 요소: ${requiredElements}` : null,
    orientation ? `제작 방향: ${orientation}` : null,
    imageStyle ? `이미지 스타일: ${imageStyle}` : null,
    backgroundStyle ? `배경 스타일: ${backgroundStyle}` : null,
    avoidElements ? `피해야 할 요소: ${avoidElements}` : null,
  ].filter((line): line is string => line !== null);

  return lines.length > 0 ? lines.join("\n") : undefined;
}
