"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";

type BrandingImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  fallback: ReactNode;
};

export function BrandingImage({
  src,
  alt,
  width,
  height,
  className = "",
  priority = false,
  fallback
}: BrandingImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <>{fallback}</>;
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
