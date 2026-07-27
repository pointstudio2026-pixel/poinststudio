/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // 가이드 아티클 콘텐츠 이미지(StyleGuideContent.images / 목업 썸네일)는
    // DB에 상대 경로("/styles/...")로도, 같은 도메인의 절대 URL(예:
    // "https://www.designaster.com/styles/...", ".../api/content/images/...")
    // 로도 섞여 저장돼 있다 -- n8n 콘텐츠 파이프라인이 절대 URL로 써 넣은
    // 경우가 있어서다. next/image는 같은 origin이라도 절대 URL은 "원격"으로
    // 취급해 remotePatterns 허용이 없으면 최적화를 거부하므로, 우리 도메인
    // 전체를 허용한다(외부 도메인이 아니라 자체 서버라 안전).
    remotePatterns: [{ protocol: "https", hostname: "www.designaster.com", pathname: "/**" }],
  },
};

export default nextConfig;
