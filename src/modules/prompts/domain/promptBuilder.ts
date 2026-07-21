import type { BrandStrategyProfile } from "@/modules/brandStrategies/domain/BrandStrategy";
import type { Style } from "@/modules/styles/domain/Style";
import type { ColorSwatch } from "@/modules/colorPalettes/domain/ColorPalette";
import type { PromptLayers } from "@/modules/prompts/domain/Prompt";
import { BRANDING_LOGO_DELIVERABLE_TYPE } from "@/modules/projects/domain/deliverableTypes";
import { SAFETY_CONSTRAINTS_TEXT, applySafetyRules } from "@/modules/prompts/domain/promptSafety";

// 이미지 생성 모델은 "완성된 결과물이 아닌 방향성 제안" 같은 문구를 그대로
// 받으면 종종 러프하거나 산만한(여러 컨셉이 뒤섞인) 결과를 낸다 -- 실제로는
// "제작 전 검토용 컨셉"이라는 제품적 의미일 뿐, 이미지 자체의 완성도가
// 낮아야 한다는 뜻이 아니다. 그래서 이 문구는 모든 유형에 공통으로 붙는
// 품질 지시문으로 분리하고, 완성도/깔끔함을 명시적으로 요구한다.
// "하나의 명확한 컨셉"이라고만 하면, 로고/브랜드 이미지 생성 모델은 흔히
// 프레젠테이션 시트(여러 색상 배리에이션·여러 배치를 한 이미지에 그리드로
// 배열)처럼 학습 데이터에 흔한 형태로 응답한다 -- "이미지 1장 = 시안 1개"를
// 명시적으로 강제해야 실제로 지켜진다.
const QUALITY_DIRECTIVE =
  "전문 디자이너가 마무리한 것처럼 깔끔하고 정제된 완성도로 표현한다. " +
  "불필요한 장식, 과도한 텍스처나 그림자, 산만한 배경 요소를 피하고 하나의 명확한 " +
  "컨셉만 정확하게 표현한다. 실제 제작 전 방향을 검토하기 위한 컨셉 이미지이지만, " +
  "이미지 자체는 러프하거나 미완성처럼 보이지 않아야 한다. " +
  "이미지 한 장에는 기본적으로 하나의 시안만 담는다 -- 여러 색상 변형, 여러 배치, " +
  "여러 버전을 한 이미지 안에 격자나 목업 시트 형태로 나열하지 않는다. " +
  "단, 명함(앞뒷면 2개 레이아웃)과 리플렛(접힌 패널 6개)은 아래 작업물 유형별 " +
  "지시에 따라 하나의 디자인을 완전한 형태로 보여주기 위한 예외로, 여러 시안을 " +
  "나열하는 것이 아니다.";

// 폰트 페어링: 실제 그래픽 디자인 교육(Ellen Lupton, Thinking with Type)에서
// 가장 널리 통용되는 원칙 -- 서체 종류를 2종 이하로 제한하고, 비슷하지만
// 미묘하게 다른 서체 두 개를 섞는 대신 명확히 대비되는 조합(세리프+산세리프)
// 이나 하나의 패밀리 안에서 굵기 차이로 위계를 만든다. 업종/스타일/작업물
// 유형과 무관하게 모든 텍스트 포함 이미지에 공통 적용.
const FONT_PAIRING_DIRECTIVE =
  "텍스트가 포함된다면 서체는 최대 2종을 넘지 않게 사용한다 -- 제목용과 본문용 서체를 명확히 " +
  "대비되는 조합(예: 세리프+산세리프)으로 짝짓거나, 하나의 서체 패밀리 안에서 굵기 차이만으로 " +
  "위계를 만든다. 비슷하지만 미묘하게 다른 서체 두 개를 함께 쓰지 않는다.";

// 텍스트 정확도: OpenAI 공식 프롬프트 가이드가 명시하는 권장 사항(따옴표로
// 정확한 문구를 표시, 텍스트가 정확히 한 번만 등장하게, 중복 배치 방지) --
// 실제로 텍스트 렌더링 정확도를 유의미하게 높이는 몇 안 되는 검증된
// 프롬프트 기법이다. 브랜드명은 이미 brandContext에서 따옴표로 감싸 전달됨.
const TEXT_ACCURACY_DIRECTIVE =
  "브랜드명이나 문구가 이미지에 들어간다면, 정확한 철자 그대로 정확히 한 번만 표기한다 -- " +
  "같은 텍스트를 반복하거나 여러 위치에 중복해서 배치하지 않는다.";

const SYSTEM_INSTRUCTIONS =
  "당신은 ASTER의 브랜드 비주얼 아이덴티티 생성 엔진입니다. 브랜드의 방향성과 선택된 " +
  "디자인 스타일을 반영하여 로고/비주얼 컨셉 이미지를 생성하기 위한 지시를 따릅니다.\n\n" +
  QUALITY_DIRECTIVE +
  " " +
  FONT_PAIRING_DIRECTIVE +
  " " +
  TEXT_ACCURACY_DIRECTIVE;

/**
 * 작업물 유형별 핵심 목표 + 구도/레이아웃 지시. "완성본이 아니다" 같은
 * 품질을 낮추는 표현은 쓰지 않고(QUALITY_DIRECTIVE가 이미 다룸), 대신 그
 * 유형에서 실제로 깔끔한 결과를 만드는 구체적 구도 규칙을 명시한다. 2026
 * 디자인 트렌드 및 AI 이미지 프롬프트 작성법 리서치를 반영해 재질/조명/구도
 * 등 실제 생성 품질에 영향을 주는 구체적 표현으로 보강했다.
 *
 * 주의: 포스터/리플렛/브로슈어/패키지는 사용자가 인터뷰에서 방향(세로/가로/
 * 정사각)을 직접 고르므로(DELIVERABLE_ORIENTATION_QUESTION), 이 문구에는
 * 방향을 하드코딩하지 않는다(방향 자체는 sizePresetRules.ts가 별도 처리).
 * 명함/앱 디자인/웹사이트는 방향이 유형상 고정이라(FIXED_ORIENTATION_BY_TYPE)
 * 언급해도 안전하다.
 */
const DELIVERABLE_OBJECTIVES: Record<string, string> = {
  [BRANDING_LOGO_DELIVERABLE_TYPE]:
    "브랜드의 로고를 하나의 명확한 컨셉으로 생성한다. 배경은 단색(흰색 또는 밝은 단색)으로 " +
    "단순하게 유지해 로고 자체가 돋보이게 하고, 로고 외의 다른 요소는 포함하지 않는다. " +
    "로고는 정확히 1개만 그린다 -- 여러 개의 로고 시안이나 배리에이션을 나열한 " +
    "로고 프레젠테이션 시트/무드보드가 아니라, 하나의 완성된 로고 단독 이미지여야 한다. " +
    "로고 마크 자체 높이의 0.5~1배 정도를 클리어 스페이스(여백)로 사방에 두어, 로고가 " +
    "이미지 가장자리에 눌리거나 답답하게 붙어 보이지 않게 한다.",
  포스터:
    "브랜드를 표현하는 포스터 디자인을 생성한다. 굵은 헤드라인 타이포그래피로 핵심 메시지가 " +
    "가장 먼저 눈에 들어오는 명확한 시각적 위계를 갖추고, 그리드 기반의 정돈된 레이아웃과 " +
    "여백을 적극적으로 활용해 구성한다. 실제 인쇄물로 제작 가능한 깔끔한 구도를 유지한다.",
  리플렛:
    "브랜드를 표현하는 삼단 접지(트라이폴드) 리플렛 디자인을, 접지 않고 완전히 펼친 " +
    "상태로 생성한다. 앞면 3개 패널과 뒷면 3개 패널, 총 6개 패널을 가로로 길게 " +
    "이어지는 하나의 스트립 형태로 한 이미지 안에 나란히 배치한다(격자로 흩어놓지 " +
    "않고 한 줄로 이어진 형태). 각 패널의 경계가 명확히 구분되도록 얇은 접지선을 " +
    "표시하고, 패널마다 정보가 깔끔하게 구획된 레이아웃과 명확한 타이포그래피 " +
    "위계를 갖추게 해 실제 인쇄물처럼 또렷하고 정돈된 구도로 구성한다.",
  브로슈어:
    "브랜드를 표현하는 브로슈어 표지 디자인을 생성한다. 편집 디자인(에디토리얼) 감각의 정돈된 " +
    "레이아웃과 충분한 여백, 명확한 타이포그래피 위계를 갖춘다.",
  명함:
    "브랜드를 표현하는 명함 디자인을, 앞면과 뒷면 2개 레이아웃을 나란히 배치해 " +
    "하나의 이미지 안에 함께 보여준다(좌우로 나란히, 각각 표준 명함 비율의 " +
    "완전한 디자인). 앞면에는 브랜드 마크와 이름을 중심으로, 뒷면에는 직함·연락처 " +
    "등 나머지 정보를 간결하고 정확한 정렬로 배치한다. 실제 인쇄 가능한 평면 " +
    "디자인으로 표현한다.",
  패키지:
    "브랜드를 표현하는 패키지 디자인을 생성한다. 실제 제품 패키지처럼 재질감(무광·유광· " +
    "소프트터치 등)이 느껴지는 사실적인 목업으로 표현하고, 스튜디오 조명과 자연스러운 " +
    "그림자로 입체감을 살린다. 브랜드 마크와 제품명이 라벨 위에 명확히 보이도록 구성하고 " +
    "과도한 장식은 피한다.",
  "앱 디자인":
    "브랜드를 표현하는 모바일 앱 화면 디자인을 생성한다. 실제 기기 프레임 안에 담긴 고해상도 " +
    "UI 목업으로 표현하고, 모던 플랫 스타일과 명확한 정보 위계, 넉넉한 여백을 갖춘 세로형 " +
    "화면 하나로 구성한다.",
  웹사이트:
    "브랜드를 표현하는 웹사이트 디자인을 생성한다. 브라우저 창 안에 담긴 데스크톱 랜딩 " +
    "페이지 목업으로 표현하고, 넉넉한 여백과 명확한 그리드, 절제된 색상을 갖춘 랜딩 섹션 " +
    "하나로 구성한다.",
};
const DEFAULT_GENERATION_OBJECTIVE = DELIVERABLE_OBJECTIVES[BRANDING_LOGO_DELIVERABLE_TYPE]!;

function buildGenerationObjective(deliverableType: string | undefined): string {
  return (deliverableType && DELIVERABLE_OBJECTIVES[deliverableType]) || DEFAULT_GENERATION_OBJECTIVE;
}

/**
 * 스타일 대분류(8개, prisma/seedStyles.ts와 정확히 일치)별 고정 프롬프트
 * 뼈대. `DELIVERABLE_OBJECTIVES`(작업물 유형 축)와 조합돼 실제로는 유형×
 * 스타일 조합마다 다른 문구가 만들어진다(64칸 전부를 손으로 채우는 대신
 * 두 축을 조합하는 방식). 2026 디자인 트렌드 리서치 반영. QUALITY_DIRECTIVE
 * ("불필요한 장식·과도한 텍스처나 그림자를 피하라")와 공존해야 하므로
 * 질감/장식 표현은 "은은하게"/"절제된" 수준으로 의도적으로 눌러서 썼다.
 */
// 각 항목 끝의 서체 지침("~한 서체/타이포그래피로 표현한다")은 "폰트가
// 단조롭다"는 피드백을 반영해 추가했다 -- 스타일마다 실제로 다른 서체
// 인상을 요구해야 매번 같은 무난한 산세리프로 수렴하지 않는다.
const STYLE_CATEGORY_TEMPLATES: Record<string, string> = {
  모던:
    "스위스 그리드 기반의 정확한 기하학적 구성과 절제된 네거티브 스페이스로 표현한다. " +
    "텍스트가 있다면 군더더기 없는 기하학적 산세리프 서체로 표현한다.",
  클래식:
    "헤리티지 세리프 디테일과 안정적인 대칭 구조로, 전통적인 조형 요소를 현대적인 감각으로 " +
    "절제해 재해석한다. 텍스트가 있다면 우아한 세리프 서체로 표현한다.",
  럭셔리:
    "메탈릭 포인트와 절제된 팔레트, 은은한 엠보싱·포일 느낌의 고급스러운 질감으로 표현한다. " +
    "텍스트가 있다면 가늘고 우아한 서체로 표현한다.",
  미니멀:
    "스칸디나비안풍 화이트스페이스 중심의 구성과 모노크롬에 가까운 절제된 색 사용으로 표현한다. " +
    "텍스트가 있다면 아주 가늘고 절제된 산세리프 서체로 표현한다.",
  플레이풀:
    "채도 높은 포인트 컬러와 유기적인 곡선, 경쾌한 비대칭 구성으로 표현하되 정보 위계는 " +
    "명확히 유지한다. 텍스트가 있다면 둥글둥글하고 통통한 서체로 표현한다.",
  테크:
    "매끈한 그라디언트와 정교한 그리드 라인의 미래지향적인 느낌으로 표현하되 과도한 장식은 피한다. " +
    "텍스트가 있다면 모노스페이스 또는 기하학적 산세리프 서체로 표현한다.",
  오가닉:
    "보태니컬 모티프와 따뜻한 톤, 은은한 아날로그 질감으로 자연스러운 느낌을 표현한다. " +
    "텍스트가 있다면 손글씨 느낌이 살짝 가미된 부드러운 서체로 표현한다.",
  에디토리얼:
    "매거진풍의 명확한 타이포그래피 위계와 파인아트 사진 구도 감각으로 표현한다. " +
    "텍스트가 있다면 굵기 대비가 강한 세리프 서체로 표현한다.",
};

function buildBaseTemplateContext(styleCategory: string): string {
  const styleTemplate = STYLE_CATEGORY_TEMPLATES[styleCategory];
  return styleTemplate ? `스타일 표현 방식: ${styleTemplate}` : "";
}

/**
 * 업종별 시각적 관습(색감/분위기/모티프) 고정 뼈대 -- interviewQuestions.ts의
 * `INDUSTRY_OPTIONS`(19개, "기타" 포함)와 정확히 일치하는 키를 쓴다. "기타"는
 * 의도적으로 비워둔다(업종 불명 상태에서 억지로 관습을 강제하지 않음).
 */
const INDUSTRY_STYLE_TEMPLATES: Record<string, string> = {
  "카페/커피": "따뜻한 우드톤과 아늑한 질감, 손글씨 느낌이 살짝 가미된 친근한 무드가 어울린다.",
  "레스토랑/외식": "식욕을 자극하는 따뜻한 색감과 편안한 다이닝 분위기가 어울린다.",
  "병원/의원/클리닉": "깨끗하고 신뢰감을 주는 청량한 블루·그린 계열과 정돈된 구성이 어울린다.",
  "IT/스타트업": "미래지향적이고 정제된 테크 무드와 깔끔한 기하학적 형태가 어울린다.",
  "리테일/쇼핑몰": "눈에 띄고 활기찬 색감과 소비자의 시선을 끄는 명확한 구성이 어울린다.",
  "뷰티/화장품": "우아하고 세련된 파스텔 또는 뉴트럴 톤과 부드러운 질감이 어울린다.",
  "패션/의류": "트렌디하고 감각적인 에디토리얼 무드가 어울린다.",
  교육: "신뢰감 있고 친근한 톤과 명확하고 읽기 쉬운 구성이 어울린다.",
  부동산: "안정감 있고 신뢰감을 주는 차분한 톤과 고급스러운 구성이 어울린다.",
  "피트니스/헬스": "활력 있고 다이나믹한 구성과 강한 명암 대비가 어울린다.",
  반려동물: "따뜻하고 친근한 무드와 부드러운 색감이 어울린다.",
  "여행/숙박": "설레는 분위기와 개방감 있는 구성이 어울린다.",
  금융: "신뢰감과 안정감을 주는 네이비·차콜 계열과 절제된 구성이 어울린다.",
  제조업: "견고하고 신뢰감 있는 톤과 명료한 구성이 어울린다.",
  "식품/농수산물": "신선하고 자연스러운 느낌과 따뜻한 자연광 톤이 어울린다.",
  "예술/디자인": "실험적이고 개성 있는 표현과 창의적인 구성이 어울린다.",
  컨설팅: "전문적이고 신뢰감 있는 절제된 톤이 어울린다.",
  "비영리/공공": "신뢰감 있고 따뜻한 톤과 포용적인 느낌이 어울린다.",
};

function buildIndustryContext(industry: string): string {
  const template = INDUSTRY_STYLE_TEMPLATES[industry];
  return template ? `업종 특성: ${template}` : "";
}

/**
 * 작업물 유형별 타이포그래피 크기 지침 -- "폰트가 너무 단조롭고 크기가
 * 너무 크다"는 피드백 반영. 실제 인쇄/디스플레이 매체 관습에 맞는 구체적
 * 크기 기준을 명시해야 이미지 생성 모델이 실제로 작고 정갈한 텍스트를
 * 그린다("작게" 같은 모호한 지시만으로는 잘 지켜지지 않는다).
 */
const TYPOGRAPHY_SIZE_GUIDANCE: Record<string, string> = {
  [BRANDING_LOGO_DELIVERABLE_TYPE]:
    "로고에 텍스트가 들어간다면 브랜드명 워드마크 하나만 담고, 부가 설명 문구나 슬로건은 넣지 않는다.",
  포스터:
    "헤드라인:부제:본문의 크기 비율을 약 3:1.75:1로 두어 확실한 시각적 위계를 만든다 " +
    "(포스터·대형 인쇄물 타이포그래피의 일반적인 위계 비율).",
  리플렛:
    "제목은 본문 대비 약 2~3배 크기로 명확히 크게, 본문 텍스트는 작고 촘촘하게 구성해 정보 " +
    "위계를 분명히 한다. 각 패널의 텍스트는 접지선 양옆으로 최소 3mm 이상 안쪽에 배치해 " +
    "접힌 부분에 글자가 걸리지 않게 한다.",
  브로슈어:
    "표지 타이틀은 본문 대비 약 2.5~4배 크기로 확실한 대비를 주어 임팩트 있게 표현하고, " +
    "내지 소제목은 본문보다 한 단계 크게(약 1.3~1.5배), 본문은 절제된 크기로 두어 " +
    "타이틀-소제목-본문 3단계 위계를 분명히 한다.",
  명함:
    "실제 인쇄 명함(90x50mm) 기준 이름은 8~9pt를 넘지 않는 작고 단정한 크기로, 직함은 " +
    "그보다 한 단계 작게(약 7pt), 연락처(전화·이메일·주소)는 가장 작게(약 6pt) 3단계 위계를 " +
    "명확히 구분한다. 모든 텍스트는 명함 가장자리에서 최소 3mm 이상 안쪽 여백을 두어 " +
    "잘리거나 답답해 보이지 않게 배치하고, 텍스트가 크고 두꺼워 보이지 않도록 각별히 주의한다.",
  패키지:
    "브랜드 로고·이름을 라벨에서 가장 크고 지배적으로(라벨 전체의 상단 절반가량을 차지하는 " +
    "비중으로) 배치하고, 제품명·설명 문구는 그보다 뚜렷이 작은 2단계 위계로, 용량·성분 등 " +
    "보조 정보는 가장 작게 배치한다. 매장 진열대에서 스쳐 보아도 브랜드가 즉시 눈에 들어오도록 " +
    "명료한 위계를 유지한다.",
  "앱 디자인":
    "실제 모바일 UI 타이포그래피 관례를 따라, 화면 제목은 본문 대비 약 1.3~2배, 캡션·보조 " +
    "텍스트는 본문의 0.7~0.75배 크기로 명확한 위계를 만든다. 화면 전체에 비해 텍스트가 " +
    "과도하게 크지 않도록 한다.",
  웹사이트:
    "실제 웹사이트 타이포그래피 관례를 따라, 히어로 헤드라인은 본문 대비 약 3~3.5배, 섹션 " +
    "제목은 본문 대비 약 1.5~2배 크기로 명확한 단계를 만들고, 텍스트가 화면에 비해 과도하게 " +
    "크지 않도록 한다.",
};

/**
 * 스타일 대분류를 "타이포그래피 스케일 톤"(스위스 패션 매거진처럼 타이포가
 * 화면을 지배하는지, 감성 카페 포스터처럼 로고·헤드라인이 작고 은은한지)
 * 3단계로 분류한 것 -- 같은 "포스터"라도 스타일에 따라 실제 프로 디자이너가
 * 쓰는 크기감이 크게 달라진다는 피드백을 반영. Swiss/International
 * Typographic Style(초대형 타이포)와 미니멀 라이프스타일 포스터(작은
 * 로고+여백 중심)의 실제 관습 차이를 근거로 나눴다.
 */
const STYLE_TYPOGRAPHY_SCALE_TIER: Record<string, "dominant" | "balanced" | "quiet"> = {
  플레이풀: "dominant",
  테크: "dominant",
  에디토리얼: "dominant",
  모던: "balanced",
  럭셔리: "balanced",
  클래식: "quiet",
  미니멀: "quiet",
  오가닉: "quiet",
};

const TYPOGRAPHY_SCALE_TIER_CLAUSE: Record<"dominant" | "balanced" | "quiet", string> = {
  dominant:
    "이 스타일에서는 타이포그래피 자체가 시각적 주인공이다 -- 헤드라인이 캔버스 가로 폭의 " +
    "80~100%를 차지할 만큼 압도적으로 크게, 본문과의 크기 비율은 3:1~5:1 이상으로 확실히 " +
    "대비시켜 패션 매거진 커버처럼 강렬한 인상을 준다.",
  balanced:
    "헤드라인은 본문 대비 2:1~3:1 비율로 명확히 크게 하되, 화면 전체를 압도하지 않는 절제된 " +
    "균형을 유지한다.",
  quiet:
    "브랜드 마크·로고는 캔버스 크기의 5~12% 정도로 작고 은은하게 배치하고, 헤드라인도 본문 " +
    "대비 1.5:1~2:1 정도의 절제된 크기로 표현한다. 전체 구성의 40~60%를 여백으로 남겨 " +
    "차분하고 감성적인 인상을 준다.",
};

// 위계가 이미 원본 지침에 명시된 명함/패키지/로고는 스타일 톤을 얹지 않는다
// (규격·법적 표기 등 형식적 제약이 스타일보다 우선하는 유형).
const TYPOGRAPHY_TIER_SENSITIVE_TYPES = new Set(["포스터", "브로슈어", "리플렛", "웹사이트", "앱 디자인"]);

function buildTypographyContext(deliverableType: string | undefined, styleCategory: string): string {
  const guidance =
    (deliverableType && TYPOGRAPHY_SIZE_GUIDANCE[deliverableType]) ||
    TYPOGRAPHY_SIZE_GUIDANCE[BRANDING_LOGO_DELIVERABLE_TYPE]!;

  const tierClause =
    deliverableType && TYPOGRAPHY_TIER_SENSITIVE_TYPES.has(deliverableType)
      ? TYPOGRAPHY_SCALE_TIER_CLAUSE[STYLE_TYPOGRAPHY_SCALE_TIER[styleCategory] ?? "balanced"]
      : "";

  return [`타이포그래피: ${guidance}`, tierClause].filter(Boolean).join(" ");
}

/** 스타일의 시각적 뉘앙스는 taxonomy 설명 문장(카테고리 메타 정보)이 아니라 keywords 태그로 전달한다 -- 더 짧고 구체적이라 이미지 모델이 실제로 반영하기 쉽다. */
function styleKeywordPhrase(style: Style): string {
  const keywords = style.keywords.slice(0, 6);
  return keywords.length > 0 ? keywords.join(", ") : style.category;
}

/**
 * 14_PRD_PromptEngine.md "Prompt Layers": deterministic composition from
 * Interview answers + Brand Strategy + selected Style, so identical inputs
 * always produce identical layers (and therefore an identical hash --
 * "동일 입력 시 동일 Prompt 재현").
 *
 * 작업물 유형별로 프롬프트를 구성하는 규칙이 다르다:
 * - 브랜딩 & 로고: 로고 생성이 유일한 목표이므로 브랜드명/원하는 스타일/로고
 *   구조에만 집중한다. mission/positioning 같은 사업적 문장은 로고 프롬프트에
 *   섞이면 오히려 모델이 문구를 문자 그대로 그리려 하며 산만해지므로 뺀다.
 * - 그 외 유형: 실제 장면/레이아웃을 구성해야 하므로 브랜드가 하는 일(mission)과
 *   그 유형 전용 인터뷰 답변(deliverableContext, 예: 포스터의 행사 맥락)을 포함한다.
 */
export function buildPromptLayers(input: {
  brandName: string;
  industry: string;
  mission: string;
  deliverableType?: string;
  /** 작업물 유형 전용 인터뷰 질문의 답변 (예: 포스터의 posterContext). 브랜딩 & 로고는 해당 없음. */
  deliverableContext?: string;
  strategy: BrandStrategyProfile;
  primaryStyle: Style;
  secondaryStyles: Style[];
  /** "로고 스타일 선택" 단계에서 고른 구조 카테고리 이름 (1~3개), 예: ["심볼 중심", "조합형"]. */
  logoStyleNames: string[];
  /** "내 스타일"에서 선택한 카테고리의 비전 분석 설명(있을 때만). 계정 전체, 모든 작업물 유형 공통. */
  userStyleDescription?: string;
  /** 스타일 화면에서 미리 선택한 브랜드 컬러(있을 때만). 로고 여부와 무관하게 모든 유형에 동일 적용. */
  colorPaletteSwatches?: ColorSwatch[];
  /** 브랜드 인터뷰 "그 외 사항"(무조건 포함/제외되어야 하는 내용) 답변. 없으면 생략. */
  additionalNotes?: string;
}): PromptLayers {
  const isLogo = !input.deliverableType || input.deliverableType === BRANDING_LOGO_DELIVERABLE_TYPE;

  // personality는 현재 BrandStrategy 생성 로직(AI/폴백 모두)에서 항상
  // toneAndManner와 동일한 값으로 채워지므로, 프롬프트에 둘 다 넣으면
  // 같은 문구가 반복될 뿐이다 -- toneAndManner 하나만 사용한다.
  const brandContext = isLogo
    ? `브랜드명: "${input.brandName}". 업종: ${input.industry}. 브랜드 톤: ${input.strategy.toneAndManner}.`
    : `브랜드명: "${input.brandName}". 업종: ${input.industry}. 브랜드 톤: ${input.strategy.toneAndManner}. ` +
      `브랜드 설명: ${input.mission}`;

  const styleNames = [input.primaryStyle.name, ...input.secondaryStyles.map((s) => s.name)].join(", ");
  const styleKeywords = [input.primaryStyle, ...input.secondaryStyles].map(styleKeywordPhrase).join(", ");
  const styleContext = `디자인 스타일: ${styleNames} (${styleKeywords}).`;

  // 작업물 유형(generationObjective)과 스타일 대분류를 조합한 고정 뼈대 --
  // primaryStyle.category는 선택된 스타일의 레벨(1~3)과 무관하게 항상 8개
  // 대분류 이름 중 하나를 담고 있다(prisma/seedStyles.ts 시드 규칙).
  const baseTemplateContext = buildBaseTemplateContext(input.primaryStyle.category);

  const industryContext = buildIndustryContext(input.industry);
  const typographyContext = buildTypographyContext(input.deliverableType, input.primaryStyle.category);

  // "로고 스타일" 단계가 없는(브랜딩 & 로고가 아닌) 작업물 유형은 빈
  // 배열을 넘기므로, 빈 "로고 구조: ." 줄이 프롬프트에 섞이지 않게 생략한다.
  const logoStyleContext =
    input.logoStyleNames.length > 0 ? `로고 구조: ${input.logoStyleNames.join(", ")} 형태로 구성한다.` : "";

  const deliverableContext = !isLogo && input.deliverableContext ? `추가 맥락: ${input.deliverableContext}` : "";

  const userStyleContext = input.userStyleDescription
    ? `사용자 지정 스타일 참고: ${input.userStyleDescription}`
    : "";

  // 스타일 화면에서 미리 컬러를 골랐다면 이름 + 정확한 hex 코드를 함께
  // 명시해 이미지 모델이 실제로 그 색상을 그대로 사용하도록 강제한다 --
  // 지금까지 이 파이프라인 어디에도 실제 색상 지시가 전달된 적이 없었고,
  // 컨셉 보드의 컬러 팔레트 표시가 실제 생성 결과와 맞지 않던 근본 원인이었다.
  // "정확한 색상으로 사용한다"라고만 하면 브랜드 톤/업종 텍스트가 암시하는
  // 다른 색조(예: 따뜻한 베이커리 느낌)에 밀려 무시되는 사례가 있어, 배타성을
  // 명시적으로 못박는다 -- 이 팔레트 "안의 색만" 쓰고 배경·소품까지 포함한다고
  // 분명히 밝혀야 모델이 임의로 다른 색조를 섞지 않는다.
  // 색상 배분(60-30-10 원칙): 그래픽 디자인에서 널리 쓰이는 배분 비율 --
  // 팔레트 안에서도 첫 번째 색이 무분별하게 다른 색과 같은 비중으로 섞이면
  // "팔레트를 지켰지만 인상이 산만한" 결과가 나온다. 스와치가 2개 이상일
  // 때만 의미가 있으므로(1개면 배분 자체가 불필요) 조건부로 붙인다.
  const colorProportionClause =
    input.colorPaletteSwatches && input.colorPaletteSwatches.length > 1
      ? ` 색상 배분은 60-30-10 원칙을 따른다: ${input.colorPaletteSwatches[0]!.label}을(를) 배경 등 ` +
        `전체의 약 60%를 차지하는 주색으로 삼고, 나머지 색상은 보조·포인트 컬러로 남은 40% 안에서만 ` +
        `절제해서 사용한다.`
      : "";

  const colorContext =
    input.colorPaletteSwatches && input.colorPaletteSwatches.length > 0
      ? `브랜드 컬러: ${input.colorPaletteSwatches.map((s) => `${s.label}(${s.hex})`).join(", ")} -- ` +
        `이 팔레트 안의 색상만 사용한다. 배경, 소품, 그림자 등 이미지의 모든 색상 요소를 이 팔레트 ` +
        `범위 안으로 제한하고, 팔레트에 없는 다른 색조(예: 베이지, 브라운 등 임의의 웜톤)는 사용하지 ` +
        `않는다.${colorProportionClause}`
      : "";

  // "그 외 사항"은 브랜드 톤 같은 뉘앙스가 아니라 반드시 지켜야 할 제약이라,
  // 막연한 문구에 묻히지 않도록 명령형으로 명시하고 colorContext 근처(우선
  // 순위가 높은 위치)에 둔다.
  const additionalRequirementsContext = input.additionalNotes?.trim()
    ? `다음 사항을 반드시 지킨다: ${input.additionalNotes.trim()}`
    : "";

  return {
    systemInstructions: SYSTEM_INSTRUCTIONS,
    brandContext,
    industryContext,
    styleContext,
    baseTemplateContext,
    userStyleContext,
    colorContext,
    logoStyleContext,
    deliverableContext,
    additionalRequirementsContext,
    typographyContext,
    generationObjective: buildGenerationObjective(input.deliverableType),
    safetyConstraints: SAFETY_CONSTRAINTS_TEXT,
  };
}

export interface ComposedPrompt {
  systemPrompt: string;
  userPrompt: string;
  flaggedTerms: string[];
}

/**
 * "시스템 프롬프트와 사용자 프롬프트 분리": system carries the fixed
 * instructions + safety constraints (Layer 1 + 5), user carries the
 * brand-specific content (Layer 2 + 3 + 4). Safety rules run last, over
 * the fully composed text, per that PRD's explicit instruction.
 */
export function composePrompt(layers: PromptLayers): ComposedPrompt {
  const rawSystemPrompt = [layers.systemInstructions, layers.safetyConstraints].join("\n\n");
  const rawUserPrompt = [
    layers.brandContext,
    layers.industryContext,
    layers.styleContext,
    layers.baseTemplateContext,
    layers.userStyleContext,
    layers.logoStyleContext,
    layers.deliverableContext,
    // colorContext/typographyContext는 마지막 "내용" 지시로 최종 구도 지시
    // (generationObjective) 바로 앞에 둔다 -- 앞쪽의 브랜드 톤/업종 텍스트가
    // 암시하는 다른 색조·서체 크기에 밀려 무시되지 않도록 우선순위를 높인다.
    layers.colorContext,
    layers.additionalRequirementsContext,
    layers.typographyContext,
    layers.generationObjective,
  ]
    .filter(Boolean)
    .join("\n\n");

  const systemResult = applySafetyRules(rawSystemPrompt);
  const userResult = applySafetyRules(rawUserPrompt);

  return {
    systemPrompt: systemResult.text,
    userPrompt: userResult.text,
    flaggedTerms: [...systemResult.flaggedTerms, ...userResult.flaggedTerms],
  };
}
