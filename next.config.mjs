/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // 가이드 아티클 콘텐츠 이미지(StyleGuideContent.images / 목업 썸네일)는
    // /public 정적 파일이거나, n8n 콘텐츠 파이프라인이 업로드해 같은
    // 도메인의 /api/content/images 라우트로 서빙되는 절대 URL 둘 다
    // 있다 -- next/image는 같은 origin이라도 절대 URL은 "원격"으로 취급해
    // remotePatterns 허용이 없으면 최적화를 거부한다.
    remotePatterns: [
      { protocol: "https", hostname: "www.designaster.com", pathname: "/api/content/images/**" },
    ],
  },
};

export default nextConfig;
