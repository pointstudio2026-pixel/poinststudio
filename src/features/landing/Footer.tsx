import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-line bg-surface px-5 py-14 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 sm:flex-row sm:justify-between">
        <div className="flex flex-col gap-2">
          <span className="text-lg font-semibold tracking-tight">ASTER.</span>
          <p className="max-w-xs text-sm text-muted">브랜드의 방향성에서 디자인이 시작됩니다.</p>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium">서비스</p>
            <a href="#how-it-works" className="text-sm text-muted transition hover:text-ink">
              서비스 소개
            </a>
            <a href="#pricing" className="text-sm text-muted transition hover:text-ink">
              요금제
            </a>
            <a href="#faq" className="text-sm text-muted transition hover:text-ink">
              FAQ
            </a>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium">법적 고지</p>
            <Link href="/terms" className="text-sm text-muted transition hover:text-ink">
              이용약관
            </Link>
            <Link href="/privacy" className="text-sm text-muted transition hover:text-ink">
              개인정보처리방침
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium">문의</p>
            <Link href="/support" className="text-sm text-muted transition hover:text-ink">
              문의사항
            </Link>
          </div>
        </div>
      </div>

      <p className="mx-auto mt-12 max-w-6xl text-xs text-muted">© {new Date().getFullYear()} ASTER. All rights reserved.</p>
    </footer>
  );
}
