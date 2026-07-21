"use client";

/**
 * 원본 비율 그대로 크게 보여주는 공용 라이트박스 -- 목록/그리드에서는 정사각형
 * 박스에 object-contain으로 잘림 없이 축소해 보여주고, 클릭하면 이걸로 원본
 * 비율 그대로 확대해서 본다.
 */
export function ImageLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-8"
      onClick={onClose}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] max-w-[90vw] rounded-md object-contain"
      />
      <button
        type="button"
        onClick={onClose}
        aria-label="닫기"
        className="absolute right-6 top-6 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-lg text-neutral-700 shadow-soft"
      >
        ×
      </button>
    </div>
  );
}
