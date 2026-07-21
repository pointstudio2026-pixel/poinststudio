import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-start gap-6 px-8 py-24">
      <Link href="/" className="text-sm text-muted underline underline-offset-4">
        ← 홈으로
      </Link>
      <div>
        <h1 className="text-3xl font-semibold">개인정보처리방침</h1>
        <p className="mt-2 text-sm text-muted">시행일: 2026년 7월 20일</p>
      </div>

      <div className="w-full rounded-xl border border-line bg-surface p-5 text-sm leading-relaxed text-muted">
        <p className="font-medium text-ink">쉽게 요약하면</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>가입 시 이메일, 비밀번호(암호화 저장), 이름(선택)을 받아요.</li>
          <li>브랜드 인터뷰 답변과 업로드·생성한 이미지는 이미지를 만들기 위해 OpenAI·Google 등에 전달돼요.</li>
          <li>비밀번호는 원문 그대로 저장하지 않고 복호화가 불가능한 방식으로 암호화해 보관해요.</li>
          <li>수집한 정보는 광고 목적으로 다른 회사에 팔거나 넘기지 않아요.</li>
          <li>회원 탈퇴를 요청하면 관련 법령이 요구하는 경우를 제외하고 정보를 삭제해요.</li>
        </ul>
      </div>

      <Section title="1. 수집하는 개인정보 항목">
        <p className="font-medium text-ink">회원가입 시</p>
        <ul className="mt-1 list-disc space-y-1 pl-5">
          <li>이메일, 비밀번호(암호화 저장), 이름(선택 입력)</li>
          <li>Google·Kakao로 가입하는 경우: 해당 계정의 이메일, 이름, 프로필 정보</li>
        </ul>
        <p className="mt-3 font-medium text-ink">서비스 이용 중</p>
        <ul className="mt-1 list-disc space-y-1 pl-5">
          <li>브랜드 인터뷰 응답 (브랜드명, 업종, 톤앤매너 등 입력하신 내용)</li>
          <li>업로드한 참고 이미지, AI가 생성한 이미지 및 브랜드 자료</li>
          <li>이용 기록: 로그인 시간, 이미지 생성 횟수, 접속 IP, 오류 로그</li>
        </ul>
      </Section>

      <Section title="2. 개인정보를 수집하는 목적">
        <ul className="list-disc space-y-1 pl-5">
          <li>회원 가입 및 로그인 등 계정 관리</li>
          <li>브랜드 전략·로고·목업 등 AI 생성 서비스 제공</li>
          <li>무료 이용 한도 관리 및 다중 계정 등 부정 이용 방지</li>
          <li>서비스 오류 대응 및 품질 개선</li>
          <li>이메일 인증, 공지사항 및 문의 응대</li>
        </ul>
      </Section>

      <Section title="3. 개인정보의 제3자 제공 및 국외 이전">
        <p>
          서비스는 이미지·텍스트를 생성하기 위해 아래의 해외 AI 사업자에게 이용자가 입력한 브랜드 정보, 프롬프트,
          업로드 이미지를 전송합니다. 이는 생성 결과물을 만들어내기 위한 필수적인 처리 과정입니다.
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>OpenAI (미국) — 텍스트 및 이미지 생성</li>
          <li>Google Gemini (미국) — 텍스트 및 이미지 생성</li>
          <li>Anthropic Claude (미국) — 텍스트 생성</li>
          <li>Resend (이메일 발송 사업자, 실제 이메일 발송 기능 사용 시) — 인증 이메일 발송을 위한 수신자 이메일 주소</li>
        </ul>
        <p className="mt-2">
          위 사업자들은 각자의 개인정보 처리방침에 따라 정보를 처리하며, 회사는 서비스 제공에 필요한 최소한의
          정보만 전달합니다. 이 외의 목적으로 개인정보를 판매하거나 제3자에게 제공하지 않습니다.
        </p>
      </Section>

      <Section title="4. 개인정보의 보유 및 이용 기간">
        <p>
          회원 탈퇴 시 지체 없이 개인정보를 삭제합니다. 다만 다음의 경우 예외적으로 일정 기간 보관할 수 있습니다.
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>부정 이용 방지 및 분쟁 대응을 위해 필요한 범위의 접속 기록: 최대 3개월</li>
          <li>관계 법령에서 별도로 보관 기간을 정하는 경우: 해당 법령이 정한 기간</li>
        </ul>
      </Section>

      <Section title="5. 이용자의 권리">
        <p>
          이용자는 언제든지 본인의 개인정보를 열람, 수정, 삭제하도록 요청할 수 있습니다. 마이페이지의 &ldquo;내
          정보&rdquo;에서 이름·비밀번호를 직접 수정할 수 있고, 회원 탈퇴나 그 외 요청은{" "}
          <Link href="/support" className="underline underline-offset-4">
            문의하기
          </Link>
          를 통해 접수해 주세요.
        </p>
      </Section>

      <Section title="6. 개인정보의 안전성 확보 조치">
        <ul className="list-disc space-y-1 pl-5">
          <li>비밀번호는 복호화가 불가능한 암호화 알고리즘(Argon2)으로 저장합니다.</li>
          <li>로그인 세션은 유효기간이 있는 암호화된 토큰으로 관리합니다.</li>
          <li>관리자 기능은 별도 권한이 있는 담당자만 접근할 수 있도록 접근 권한을 제한합니다.</li>
        </ul>
      </Section>

      <Section title="7. 쿠키(자동 수집 정보)">
        <p>
          서비스는 로그인 상태 유지를 위해 브라우저 쿠키에 인증 토큰을 저장합니다. 이는 광고·추적 목적이 아니라
          로그인 세션 유지를 위한 필수 기능입니다. 쿠키를 삭제하면 재로그인이 필요합니다.
        </p>
      </Section>

      <Section title="8. 문의처">
        <p>
          개인정보 처리와 관련한 문의, 열람·삭제 요청은{" "}
          <Link href="/support" className="underline underline-offset-4">
            서비스 내 문의하기
          </Link>
          를 통해 접수해 주세요.
        </p>
      </Section>

      <p className="w-full rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
        참고: 이 방침은 정식 법률 자문 없이 서비스 운영자가 초안으로 작성한 문서입니다. 개인정보보호책임자 지정
        등 「개인정보 보호법」상 정식 고지 의무 사항은 실제 서비스 운영 형태가 확정되는 시점에 보완이 필요하며,
        정식 공개 전 법률 전문가의 검토를 받는 것을 권장합니다.
      </p>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="w-full">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted">{children}</div>
    </section>
  );
}
