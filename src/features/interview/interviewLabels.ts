import type { MessageKey } from "@/shared/i18n/messages/types";

// interviewQuestions.ts / industryQuestions.ts / deliverableTypeQuestions.ts의
// 질문 key/옵션 문자열은 answers[key]에 그대로 저장되고 브랜드 전략·프롬프트
// 조립·업종 키워드 매칭이 이 한국어 원문을 직접 소비하므로 절대 바꾸지
// 않는다 -- 화면에 보여줄 때만 이 표로 번역 문구를 찾는다
// (STEP_LABEL_MESSAGE_KEYS와 동일한 "표시용 라벨만 분리" 패턴). AI가 그때
// 그때 만드는 후속 질문(followUp_*)은 이 표에 없고, 그 경우 원문(q.text)을
// 그대로 보여준다(동적 생성 콘텐츠라 고정 카탈로그로 다룰 수 없음).

export const QUESTION_TEXT_KEYS: Record<string, MessageKey> = {
  brandName: "interviewQuestions.brandName",
  industry: "interviewQuestions.industry",
  purpose: "interviewQuestions.purpose",
  targetAudience: "interviewQuestions.targetAudience",
  desiredImpression: "interviewQuestions.desiredImpression",
  forbiddenElements: "interviewQuestions.forbiddenElements",
  additionalNotes: "interviewQuestions.additionalNotes",
  cafeAtmosphere: "interviewQuestions.cafeAtmosphere",
  cafeSignatureMenu: "interviewQuestions.cafeSignatureMenu",
  hospitalTrustFactor: "interviewQuestions.hospitalTrustFactor",
  hospitalPatientFocus: "interviewQuestions.hospitalPatientFocus",
  startupCoreFeature: "interviewQuestions.startupCoreFeature",
  startupCustomerType: "interviewQuestions.startupCustomerType",
  deliverableOrientation: "interviewQuestions.deliverableOrientation",
  deliverableImageStyle: "interviewQuestions.deliverableImageStyle",
  deliverableBackgroundStyle: "interviewQuestions.deliverableBackgroundStyle",
  deliverableAvoidElements: "interviewQuestions.deliverableAvoidElements",
  posterContext: "interviewQuestions.posterContext",
  posterRequiredElements: "interviewQuestions.requiredElementsPrompt",
  leafletKeyInfo: "interviewQuestions.leafletKeyInfo",
  leafletRequiredElements: "interviewQuestions.requiredElementsPrompt",
  brochureKeyMessage: "interviewQuestions.brochureKeyMessage",
  brochureRequiredElements: "interviewQuestions.requiredElementsPrompt",
  businessCardInfo: "interviewQuestions.businessCardInfo",
  businessCardRequiredElements: "interviewQuestions.requiredElementsPrompt",
  packagingProduct: "interviewQuestions.packagingProduct",
  packagingRequiredElements: "interviewQuestions.requiredElementsPrompt",
  appCoreFeature: "interviewQuestions.appCoreFeature",
  appRequiredElements: "interviewQuestions.requiredElementsPrompt",
  websitePurpose: "interviewQuestions.websitePurpose",
  websiteRequiredElements: "interviewQuestions.requiredElementsPrompt",
};

export const GROUP_LABEL_KEYS: Record<string, MessageKey> = {
  "새로운 시작": "interviewOptionGroups.newStart",
  "기존 브랜드 정비": "interviewOptionGroups.existingBrand",
  "개인 · 포트폴리오": "interviewOptionGroups.personal",
  "내부 · 비영리용": "interviewOptionGroups.internal",
};

// Industry.category(19개, DB의 원본 한국어 문자열)를 IndustryPicker의 대분류
// 필터 라벨로 번역할 때 쓴다 -- 업종 이름 자체(198개)는 IndustryTranslation
// 테이블에서 locale별로 이미 번역되어 오므로(searchIndustries의
// displayName) 여기 등록할 필요가 없다, 이 표는 카테고리 19개만 다룬다.
export const INDUSTRY_CATEGORY_LABEL_KEYS: Record<string, MessageKey> = {
  "F&B": "interviewOptions.industryCategory.fnb",
  "헬스케어/웰니스": "interviewOptions.industryCategory.healthcareWellness",
  리테일: "interviewOptions.industryCategory.retail",
  "전문 서비스": "interviewOptions.industryCategory.professionalServices",
  기술: "interviewOptions.industryCategory.tech",
  "부동산/건설": "interviewOptions.industryCategory.realEstateConstruction",
  교육: "interviewOptions.industryCategory.education",
  "제조/산업": "interviewOptions.industryCategory.manufacturingIndustrial",
  "스포츠/피트니스": "interviewOptions.industryCategory.sportsFitness",
  금융: "interviewOptions.industryCategory.finance",
  "뷰티/그루밍": "interviewOptions.industryCategory.beautyGrooming",
  "공공/문화": "interviewOptions.industryCategory.publicCulture",
  "식품 리테일": "interviewOptions.industryCategory.foodRetail",
  "운송/모빌리티": "interviewOptions.industryCategory.transportMobility",
  "엔터테인먼트/여가": "interviewOptions.industryCategory.entertainmentLeisure",
  라이프스타일: "interviewOptions.industryCategory.lifestyle",
  "숙박/레저": "interviewOptions.industryCategory.hospitalityLeisure",
  "농업/에너지": "interviewOptions.industryCategory.agricultureEnergy",
  "돌봄/복지": "interviewOptions.industryCategory.careWelfare",
};

// 여러 질문에 동일한 한국어 문구가 그대로 반복되는 경우(예: "가격/금액
// 표시", "브랜드 로고", "연락처") 한 번만 등록하고 다른 질문에서도 그대로
// 재사용한다 -- 번역 중복을 줄이되, 텍스트가 조금이라도 다르면(예: "제목" vs
// "타이틀") 별도 키로 유지한다.
export const OPTION_LABEL_KEYS: Record<string, MessageKey> = {
  // industry (19)
  "카페/커피": "interviewOptions.industry.cafe",
  "레스토랑/외식": "interviewOptions.industry.restaurant",
  "병원/의원/클리닉": "interviewOptions.industry.hospital",
  "IT/스타트업": "interviewOptions.industry.itStartup",
  "리테일/쇼핑몰": "interviewOptions.industry.retail",
  "뷰티/화장품": "interviewOptions.industry.beauty",
  "패션/의류": "interviewOptions.industry.fashion",
  교육: "interviewOptions.industry.education",
  부동산: "interviewOptions.industry.realEstate",
  "피트니스/헬스": "interviewOptions.industry.fitness",
  반려동물: "interviewOptions.industry.pet",
  "여행/숙박": "interviewOptions.industry.travel",
  금융: "interviewOptions.industry.finance",
  제조업: "interviewOptions.industry.manufacturing",
  "식품/농수산물": "interviewOptions.industry.food",
  "예술/디자인": "interviewOptions.industry.artDesign",
  컨설팅: "interviewOptions.industry.consulting",
  "비영리/공공": "interviewOptions.industry.nonprofit",
  기타: "interviewOptions.industry.other",

  // purpose (6)
  "신제품 출시": "interviewOptions.purpose.newProduct",
  "기존 브랜드 리뉴얼": "interviewOptions.purpose.renewal",
  "창업/오픈": "interviewOptions.purpose.startup",
  "사이드 프로젝트": "interviewOptions.purpose.sideProject",
  "포트폴리오/개인 브랜딩": "interviewOptions.purpose.portfolio",
  "사내용/비영리": "interviewOptions.purpose.internal",

  // targetAudience (12)
  "10대": "interviewOptions.targetAudience.teens",
  "20대": "interviewOptions.targetAudience.twenties",
  "30대": "interviewOptions.targetAudience.thirties",
  "40대": "interviewOptions.targetAudience.forties",
  "50대 이상": "interviewOptions.targetAudience.fiftyPlus",
  "전 연령대": "interviewOptions.targetAudience.allAges",
  직장인: "interviewOptions.targetAudience.officeWorker",
  학생: "interviewOptions.targetAudience.student",
  주부: "interviewOptions.targetAudience.homemaker",
  시니어: "interviewOptions.targetAudience.senior",
  전문직: "interviewOptions.targetAudience.professional",
  "사업자/자영업자": "interviewOptions.targetAudience.businessOwner",

  // desiredImpression (5)
  "편안하고 따뜻한 느낌": "interviewOptions.desiredImpression.warm",
  "전문적이고 신뢰감 있는 느낌": "interviewOptions.desiredImpression.professional",
  "고급스럽고 세련된 느낌": "interviewOptions.desiredImpression.premium",
  "활기차고 트렌디한 느낌": "interviewOptions.desiredImpression.trendy",
  "자연스럽고 균형 잡힌 느낌": "interviewOptions.desiredImpression.natural",

  // forbiddenElements (5) -- deliverableAvoidElements의 겹치는 두 문구도 여기 재사용
  "특정 동물/인물 이미지": "interviewOptions.forbiddenElements.animalOrPerson",
  "특정 상징/아이콘": "interviewOptions.forbiddenElements.symbol",
  "종교적 상징": "interviewOptions.forbiddenElements.religious",
  "가격/금액 표시": "interviewOptions.forbiddenElements.price",
  "복잡한 배경": "interviewOptions.forbiddenElements.complexBackground",

  // deliverableOrientation (3) -- sizePresetRules.ts의 ORIENTATION_OPTION_TO_PRESET과 정확히 일치해야 하는 값이라 키만 다르게, 원문은 그대로 유지
  "세로형 (A4·B4 등 세로 포스터/문서)": "interviewOptions.orientation.portrait",
  "가로형 (와이드 배너/가로형)": "interviewOptions.orientation.landscape",
  "정사각형 (SNS 정사각 등)": "interviewOptions.orientation.square",

  // deliverableImageStyle (4)
  "실사 사진": "interviewOptions.imageStyle.photo",
  일러스트레이션: "interviewOptions.imageStyle.illustration",
  "아이콘·심볼 중심": "interviewOptions.imageStyle.icon",
  "이미지 없이 타이포 중심": "interviewOptions.imageStyle.typography",

  // deliverableBackgroundStyle (5)
  "단색 배경": "interviewOptions.backgroundStyle.solid",
  "사진 배경": "interviewOptions.backgroundStyle.photo",
  "패턴·텍스처": "interviewOptions.backgroundStyle.pattern",
  그라디언트: "interviewOptions.backgroundStyle.gradient",
  "화이트스페이스(여백 강조)": "interviewOptions.backgroundStyle.whitespace",

  // deliverableAvoidElements (5) -- "가격/금액 표시"/"복잡한 배경"은 forbiddenElements 항목 재사용, 나머지 3개만 신규
  "특정 인물 사진": "interviewOptions.avoidElements.personPhoto",
  "과도한 텍스트": "interviewOptions.avoidElements.excessiveText",
  "그림자·입체 효과": "interviewOptions.avoidElements.shadow3d",

  // cafeAtmosphere (6)
  아늑한: "interviewOptions.cafeAtmosphere.cozy",
  모던한: "interviewOptions.cafeAtmosphere.modern",
  빈티지: "interviewOptions.cafeAtmosphere.vintage",
  미니멀: "interviewOptions.cafeAtmosphere.minimal",
  화려한: "interviewOptions.cafeAtmosphere.vibrant",
  "친환경·내추럴": "interviewOptions.cafeAtmosphere.eco",

  // hospitalTrustFactor (6)
  "전문성/의료진 경력": "interviewOptions.hospitalTrustFactor.expertise",
  "청결/위생": "interviewOptions.hospitalTrustFactor.hygiene",
  "첨단 장비/기술": "interviewOptions.hospitalTrustFactor.equipment",
  "친절한 상담": "interviewOptions.hospitalTrustFactor.kindness",
  "편리한 접근성/시설": "interviewOptions.hospitalTrustFactor.accessibility",
  "합리적인 비용": "interviewOptions.hospitalTrustFactor.cost",

  // startupCoreFeature (6)
  "자동화/효율화": "interviewOptions.startupCoreFeature.automation",
  "데이터 분석": "interviewOptions.startupCoreFeature.dataAnalysis",
  "협업/커뮤니케이션": "interviewOptions.startupCoreFeature.collaboration",
  "결제/거래": "interviewOptions.startupCoreFeature.payment",
  "AI/개인화 추천": "interviewOptions.startupCoreFeature.aiPersonalization",
  "콘텐츠 제작·관리": "interviewOptions.startupCoreFeature.contentCreation",

  // posterContext (7, "신제품 출시"는 purpose 항목 재사용)
  "시즌 프로모션/할인": "interviewOptions.posterContext.promotion",
  "채용 공고": "interviewOptions.posterContext.recruitment",
  "전시·박람회": "interviewOptions.posterContext.exhibition",
  "오픈 기념": "interviewOptions.posterContext.opening",
  "브랜드 캠페인": "interviewOptions.posterContext.campaign",
  "행사/세미나 안내": "interviewOptions.posterContext.eventNotice",

  // posterRequiredElements (6)
  "행사명/타이틀": "interviewOptions.posterRequiredElements.eventTitle",
  날짜: "interviewOptions.posterRequiredElements.date",
  장소: "interviewOptions.posterRequiredElements.location",
  "가격/참가비": "interviewOptions.posterRequiredElements.priceEntry",
  "주최자 로고": "interviewOptions.posterRequiredElements.organizerLogo",
  "QR코드/연락처": "interviewOptions.posterRequiredElements.qrContact",

  // leafletKeyInfo (6)
  "제품/서비스 소개": "interviewOptions.leafletKeyInfo.productIntro",
  "가격/요금 안내": "interviewOptions.leafletKeyInfo.priceInfo",
  "매장 위치/이용 안내": "interviewOptions.leafletKeyInfo.locationInfo",
  "이벤트/프로모션": "interviewOptions.leafletKeyInfo.eventPromo",
  "회사 소개": "interviewOptions.leafletKeyInfo.companyIntro",
  "연락처/예약 방법": "interviewOptions.leafletKeyInfo.contactMethod",

  // leafletRequiredElements (6) -- "브랜드 로고"/"연락처"는 brochure/website에서도 재사용
  제목: "interviewOptions.leafletRequiredElements.title",
  "핵심 정보 목록": "interviewOptions.leafletRequiredElements.keyInfoList",
  연락처: "interviewOptions.leafletRequiredElements.contact",
  "지도/위치": "interviewOptions.leafletRequiredElements.mapLocation",
  가격표: "interviewOptions.leafletRequiredElements.priceTable",
  "브랜드 로고": "interviewOptions.leafletRequiredElements.brandLogo",

  // brochureKeyMessage (6)
  "브랜드 신뢰성/전문성": "interviewOptions.brochureKeyMessage.trustworthiness",
  "제품·서비스 강점": "interviewOptions.brochureKeyMessage.strength",
  "회사 연혁/스토리": "interviewOptions.brochureKeyMessage.history",
  "고객 후기/성과": "interviewOptions.brochureKeyMessage.testimonial",
  "차별화 포인트": "interviewOptions.brochureKeyMessage.differentiation",
  "기업 비전/미션": "interviewOptions.brochureKeyMessage.visionMission",

  // brochureRequiredElements (5, "브랜드 로고"/"연락처" 재사용) -- 신규 3개만
  타이틀: "interviewOptions.brochureRequiredElements.title",
  "핵심 메시지 문구": "interviewOptions.brochureRequiredElements.keyMessage",
  "제품/서비스 이미지": "interviewOptions.brochureRequiredElements.productImage",

  // businessCardRequiredElements (7, "로고"는 website에서도 재사용)
  이름: "interviewOptions.businessCardRequiredElements.name",
  직함: "interviewOptions.businessCardRequiredElements.title",
  전화번호: "interviewOptions.businessCardRequiredElements.phone",
  이메일: "interviewOptions.businessCardRequiredElements.email",
  주소: "interviewOptions.businessCardRequiredElements.address",
  QR코드: "interviewOptions.businessCardRequiredElements.qrCode",
  로고: "interviewOptions.businessCardRequiredElements.logo",

  // packagingRequiredElements (5, "브랜드 로고" 재사용) -- 신규 4개만
  제품명: "interviewOptions.packagingRequiredElements.productName",
  "용량/수량 표시": "interviewOptions.packagingRequiredElements.capacity",
  "성분/설명 문구": "interviewOptions.packagingRequiredElements.ingredients",
  바코드: "interviewOptions.packagingRequiredElements.barcode",

  // appCoreFeature (8)
  "커머스/쇼핑": "interviewOptions.appCoreFeature.commerce",
  "예약/신청": "interviewOptions.appCoreFeature.booking",
  "커뮤니티/소셜": "interviewOptions.appCoreFeature.community",
  "콘텐츠/정보 제공": "interviewOptions.appCoreFeature.content",
  "헬스케어/피트니스": "interviewOptions.appCoreFeature.healthcare",
  "금융/결제": "interviewOptions.appCoreFeature.finance",
  "교육/학습": "interviewOptions.appCoreFeature.education",
  "생산성/업무 도구": "interviewOptions.appCoreFeature.productivity",

  // appRequiredElements (5)
  "네비게이션 바": "interviewOptions.appRequiredElements.navBar",
  "핵심 버튼(CTA)": "interviewOptions.appRequiredElements.ctaButton",
  "아이콘 세트": "interviewOptions.appRequiredElements.iconSet",
  "상태 표시줄": "interviewOptions.appRequiredElements.statusBar",
  "로고/브랜드 마크": "interviewOptions.appRequiredElements.logoMark",

  // websitePurpose (7)
  "정보 제공/소개": "interviewOptions.websitePurpose.infoIntro",
  "온라인 판매/커머스": "interviewOptions.websitePurpose.ecommerce",
  "예약/문의 접수": "interviewOptions.websitePurpose.booking",
  "포트폴리오/작품 전시": "interviewOptions.websitePurpose.portfolio",
  "회원 커뮤니티": "interviewOptions.websitePurpose.community",
  채용: "interviewOptions.websitePurpose.recruitment",
  "블로그/콘텐츠 발행": "interviewOptions.websitePurpose.blog",

  // websiteRequiredElements (5, "로고" 재사용) -- 신규 4개만
  "헤더/네비게이션": "interviewOptions.websiteRequiredElements.headerNav",
  "메인 헤드라인": "interviewOptions.websiteRequiredElements.mainHeadline",
  "CTA 버튼": "interviewOptions.websiteRequiredElements.ctaButton",
  푸터: "interviewOptions.websiteRequiredElements.footer",
};
