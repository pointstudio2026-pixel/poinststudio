import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-start gap-6 px-8 py-24">
      <Link href="/" className="text-sm text-muted underline underline-offset-4">
        ← 홈으로
      </Link>
      <div>
        <h1 className="text-3xl font-semibold">이용약관</h1>
        <p className="mt-2 text-sm text-muted">시행일: 2026년 7월 20일</p>
      </div>

      <div className="w-full rounded-xl border border-line bg-surface p-5 text-sm leading-relaxed text-muted">
        <p className="font-medium text-ink">쉽게 요약하면</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>ASTER는 AI로 로고·브랜드 디자인을 만들어주는 서비스예요.</li>
          <li>입력하신 브랜드 정보와 이미지는 이미지를 생성하기 위해 OpenAI·Google 등 AI 업체로 전달돼요.</li>
          <li>무료 플랜은 매달 생성 가능한 횟수에 제한이 있어요.</li>
          <li>타인의 상표·저작권을 침해하는 콘텐츠 생성, 다중 계정으로 무료 한도를 우회하는 행위는 금지돼요.</li>
          <li>약관을 위반하면 계정이 정지되거나 삭제될 수 있어요.</li>
        </ul>
      </div>

      <Section title="제1조 (목적)">
        <p>
          이 약관은 ASTER(이하 &ldquo;회사&rdquo;)가 제공하는 AI 기반 브랜드 디자인 생성 서비스(이하 &ldquo;서비스&rdquo;)의
          이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 정하는 것을 목적으로 합니다.
        </p>
      </Section>

      <Section title="제2조 (서비스의 내용)">
        <p>서비스는 다음과 같은 기능을 제공합니다.</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>브랜드 인터뷰를 바탕으로 한 브랜드 전략 및 스타일 추천</li>
          <li>AI를 이용한 로고 및 브랜드 이미지 생성, 수정</li>
          <li>생성된 이미지를 활용한 목업(제품 목업 이미지) 제작</li>
          <li>생성 결과물의 저장, 관리 및 내보내기(Export)</li>
        </ul>
        <p className="mt-2">
          서비스는 무료 플랜과 유료 플랜(Pro, Studio)으로 구성되며, 유료 결제 기능은 아직 정식 출시 전 준비 단계에
          있습니다. 결제 기능이 도입될 경우 관련 내용을 사전에 안내하고 별도 동의를 받습니다.
        </p>
      </Section>

      <Section title="제3조 (계정 및 회원가입)">
        <ul className="list-disc space-y-1 pl-5">
          <li>이메일과 비밀번호, 또는 Google·Kakao 소셜 로그인으로 계정을 만들 수 있습니다.</li>
          <li>무료 이용 한도의 남용을 막기 위해 이메일 인증 절차를 거칠 수 있습니다.</li>
          <li>타인의 이메일을 도용하거나, 여러 개의 계정을 만들어 무료 이용 한도를 반복적으로 우회하는 행위는 금지됩니다.</li>
          <li>회원 정보는 정확하게 입력해야 하며, 허위 정보로 인한 불이익은 이용자 본인이 부담합니다.</li>
        </ul>
      </Section>

      <Section title="제4조 (AI 처리와 외부 서비스 이용)">
        <p>
          서비스는 이미지·텍스트 생성을 위해 OpenAI, Google(Gemini), Anthropic(Claude) 등 외부 AI 사업자의 API를
          이용합니다. 이용자가 입력한 브랜드 정보, 인터뷰 응답, 업로드한 이미지는 결과물 생성을 위해 이들 사업자에게
          전송될 수 있습니다. 자세한 내용은{" "}
          <Link href="/privacy" className="underline underline-offset-4">
            개인정보처리방침
          </Link>
          을 참고해 주세요.
        </p>
        <p className="mt-2">
          AI가 생성하는 결과물의 특성상, 결과 이미지가 완벽하게 의도한 대로 나오지 않거나, 드물게 부적절하거나
          부정확한 결과가 포함될 수 있습니다. 회사는 이를 최소화하기 위해 노력하지만 완전한 정확성을 보장하지는
          않습니다.
        </p>
      </Section>

      <Section title="제5조 (생성물의 이용 및 권리)">
        <ul className="list-disc space-y-1 pl-5">
          <li>이용자가 서비스로 생성한 이미지는 이용자가 상업적 용도를 포함하여 자유롭게 사용할 수 있습니다.</li>
          <li>
            다만 이용자는 생성 시 입력한 프롬프트나 참고 이미지가 제3자의 상표권, 저작권 등 지식재산권을 침해하지
            않도록 스스로 확인할 책임이 있습니다.
          </li>
          <li>
            AI 생성물의 저작권 인정 여부는 국가·법령마다 다를 수 있으며, 회사는 생성물에 대한 완전한 저작권을
            보장하지 않습니다.
          </li>
        </ul>
      </Section>

      <Section title="제6조 (금지행위)">
        <p>이용자는 다음 행위를 해서는 안 됩니다.</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>타인의 개인정보, 상표, 저작권 등을 침해하는 콘텐츠를 생성하는 행위</li>
          <li>여러 계정을 만들어 무료 이용 한도를 반복적으로 우회하는 행위</li>
          <li>서비스의 정상적인 운영을 방해하거나 시스템에 부정하게 접근하는 행위</li>
          <li>불법적이거나 미풍양속에 반하는 콘텐츠를 생성·유포하는 행위</li>
        </ul>
      </Section>

      <Section title="제7조 (이용 제한)">
        <p>
          이용자가 제6조를 위반하거나 서비스 운영에 심각한 지장을 초래하는 경우, 회사는 사전 통지 없이 해당 계정의
          이용을 정지하거나 삭제할 수 있습니다. 정지·삭제된 계정은{" "}
          <Link href="/support" className="underline underline-offset-4">
            문의하기
          </Link>
          를 통해 소명할 수 있습니다.
        </p>
      </Section>

      <Section title="제8조 (서비스의 변경 및 중단)">
        <p>
          회사는 운영상, 기술상의 필요에 따라 서비스의 전부 또는 일부를 변경하거나 중단할 수 있습니다. 이용자에게
          중대한 영향을 미치는 변경의 경우 사전에 공지합니다.
        </p>
      </Section>

      <Section title="제9조 (책임의 제한)">
        <p>
          회사는 천재지변, AI 사업자의 서비스 장애 등 회사가 통제할 수 없는 사유로 발생한 서비스 중단에 대해 책임을
          지지 않습니다. 또한 이용자가 생성한 결과물을 실제로 사용(상표 출원, 인쇄물 제작 등)함으로써 발생하는
          법적 분쟁에 대해 회사는 책임을 지지 않습니다.
        </p>
      </Section>

      <Section title="제10조 (약관의 변경)">
        <p>
          회사는 필요한 경우 이 약관을 변경할 수 있으며, 변경 시 서비스 내 공지 또는 이메일을 통해 사전에 안내합니다.
          변경된 약관에 동의하지 않는 경우 회원 탈퇴를 요청할 수 있습니다.
        </p>
      </Section>

      <Section title="제11조 (문의)">
        <p>
          서비스 이용과 관련한 문의는{" "}
          <Link href="/support" className="underline underline-offset-4">
            서비스 내 문의하기
          </Link>
          를 통해 접수해 주세요.
        </p>
      </Section>

      <p className="w-full rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
        참고: 이 약관은 정식 법률 자문 없이 서비스 운영자가 초안으로 작성한 문서입니다. 사업자 등록 정보(상호,
        대표자, 사업자등록번호, 주소)와 유료 결제 관련 조항은 실제 서비스 운영 형태가 확정되고 결제 기능이
        도입되는 시점에 반드시 보완되어야 하며, 정식 공개 전 법률 전문가의 검토를 받는 것을 권장합니다.
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
