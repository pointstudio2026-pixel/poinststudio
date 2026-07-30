"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageLightbox } from "@/components/ImageLightbox";

/**
 * 목록/그리드에 들어가는 썸네일 하나를 감싸서, 클릭하면 ImageLightbox로 원본
 * 비율 그대로 확대해서 보여준다. 콘텐츠 아티클(FAQ/디자인 가이드)처럼 여러
 * 이미지가 각자 독립적으로 확대되어야 하는 곳에서 상태를 부모로 끌어올리지
 * 않고 이미지 하나당 자체적으로 열림 상태를 갖도록 만들었다.
 */
export function LightboxImage({
  src,
  alt,
  sizes,
  containerClassName,
  imageClassName,
}: {
  src: string;
  alt: string;
  sizes: string;
  containerClassName: string;
  imageClassName: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={alt}
        className={`relative block w-full cursor-pointer ${containerClassName}`}
      >
        <Image src={src} alt={alt} fill sizes={sizes} className={imageClassName} />
      </button>
      {open && <ImageLightbox src={src} alt={alt} onClose={() => setOpen(false)} />}
    </>
  );
}
