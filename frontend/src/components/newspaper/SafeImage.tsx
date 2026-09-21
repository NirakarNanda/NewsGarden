"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cx } from "@/lib/utils";

/**
 * Image with a graceful fallback: when the file 404s (e.g. a
 * placeholder illustration that was never generated) it renders a
 * neutral placeholder block instead of a broken-image icon.
 */
export default function SafeImage({
  src,
  alt,
  className,
  aspect = "aspect-[16/9]",
}: {
  src?: string;
  alt: string;
  className?: string;
  aspect?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cx(
          "flex w-full items-center justify-center gap-2 bg-[#221c12]/8 text-[#221c12]/40",
          aspect,
          className,
        )}
      >
        <ImageOff size={20} aria-hidden />
        <span className="text-xs uppercase tracking-widest">No image</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cx("w-full object-cover", aspect, className)}
    />
  );
}
