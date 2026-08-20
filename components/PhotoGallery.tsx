"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type Photo = { url: string; medium_url: string | null };

export default function PhotoGallery({ photos, alt }: { photos: Photo[]; alt: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    if (openIndex === null) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenIndex(null);
      if (e.key === "ArrowRight") setOpenIndex((i) => (i === null ? i : (i + 1) % photos.length));
      if (e.key === "ArrowLeft") setOpenIndex((i) => (i === null ? i : (i - 1 + photos.length) % photos.length));
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [openIndex, photos.length]);

  if (photos.length === 0) {
    return <div className="h-72 bg-ink/5 rounded-xl mb-8" />;
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2 mb-8 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setOpenIndex(0)}
          className="relative h-72 col-span-2 sm:col-span-1 cursor-zoom-in"
        >
          <Image src={photos[0].medium_url || photos[0].url} alt={alt} fill className="object-cover" />
        </button>
        <div className="hidden sm:grid grid-rows-2 gap-2 h-72">
          {photos.slice(1, 3).map((p, i) => (
            <button
              type="button"
              key={i}
              onClick={() => setOpenIndex(i + 1)}
              className="relative h-full cursor-zoom-in"
            >
              <Image src={p.medium_url || p.url} alt={alt} fill className="object-cover" />
              {i === 1 && photos.length > 3 && (
                <div className="absolute inset-0 bg-ink/60 flex items-center justify-center text-paper-raised font-medium">
                  +{photos.length - 3} more
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {openIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-ink/95 flex items-center justify-center"
          onClick={() => setOpenIndex(null)}
        >
          <button
            onClick={() => setOpenIndex(null)}
            aria-label="Close"
            className="absolute top-4 right-4 text-paper-raised text-3xl leading-none"
          >
            ×
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpenIndex((i) => (i === null ? i : (i - 1 + photos.length) % photos.length));
            }}
            aria-label="Previous photo"
            className="absolute left-4 text-paper-raised text-4xl px-2"
          >
            ‹
          </button>
          <div className="relative w-full max-w-3xl h-[70vh] mx-12" onClick={(e) => e.stopPropagation()}>
            <Image
              src={photos[openIndex].url}
              alt={alt}
              fill
              className="object-contain"
            />
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpenIndex((i) => (i === null ? i : (i + 1) % photos.length));
            }}
            aria-label="Next photo"
            className="absolute right-4 text-paper-raised text-4xl px-2"
          >
            ›
          </button>
          <p className="absolute bottom-4 text-paper-raised/70 text-sm font-mono">
            {openIndex + 1} / {photos.length}
          </p>
        </div>
      )}
    </>
  );
}
