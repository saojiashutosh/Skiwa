"use client";

import Image from "next/image";
import { useState } from "react";

import type { ProductImage } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");

  const active = images[activeIndex];

  const handleMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setOrigin(`${x}% ${y}%`);
  };

  if (!images.length) {
    return (
      <div className="flex aspect-[3/4] items-center justify-center bg-muted font-heading text-3xl text-white/10">
        SKIWAA
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row-reverse">
      {/* Main image with hover zoom */}
      <div
        className="relative aspect-[3/4] flex-1 cursor-zoom-in overflow-hidden bg-muted"
        onMouseMove={handleMove}
        onMouseEnter={() => setZoomed(true)}
        onMouseLeave={() => setZoomed(false)}
        onClick={() => setZoomed((current) => !current)}
        role="img"
        aria-label={active?.alt_text || productName}
      >
        <Image
          key={active?.id}
          src={active.url}
          alt={active.alt_text || productName}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className={cn(
            "object-cover transition-transform duration-300",
            zoomed ? "scale-[1.75]" : "scale-100",
          )}
          style={{ transformOrigin: origin }}
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-3 lg:flex-col">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`View image ${index + 1}`}
              className={cn(
                "relative h-20 w-16 shrink-0 overflow-hidden bg-muted transition-opacity",
                index === activeIndex
                  ? "opacity-100 ring-1 ring-foreground"
                  : "opacity-50 hover:opacity-90",
              )}
            >
              <Image
                src={image.url}
                alt={image.alt_text || `${productName} thumbnail ${index + 1}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
