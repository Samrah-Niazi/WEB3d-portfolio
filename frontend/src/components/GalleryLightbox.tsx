import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { GalleryItem } from "../data/gallery";

type Props = { items: GalleryItem[]; index: number | null; onClose: () => void; onChange: (i: number) => void };

// Full-screen image viewer with previous/next buttons, arrow keys, and Escape to close.
export default function GalleryLightbox({ items, index, onClose, onChange }: Props) {
  const closeBtn = useRef<HTMLButtonElement>(null);
  const open = index !== null;

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    closeBtn.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      opener?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (index === null) return;
    const step = (d: number) => onChange((index + d + items.length) % items.length);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, items.length, onChange, onClose]);

  if (index === null) return null;
  const item = items[index];
  const step = (d: number) => onChange((index + d + items.length) % items.length);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Gallery image ${index + 1} of ${items.length}`}
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-3 bg-black/85 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="flex w-full max-w-5xl items-center justify-between gap-4 text-white" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm font-semibold">
          {item.category} <span className="opacity-70">· {index + 1} / {items.length}</span>
        </p>
        <button ref={closeBtn} onClick={onClose} className="btn-3d !px-4 !py-1.5 text-sm">Close</button>
      </div>

      <div className="relative flex w-full max-w-5xl items-center justify-center" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => step(-1)}
          aria-label="Previous image"
          className="glass absolute left-1 z-10 grid h-11 w-11 place-items-center rounded-full text-xl text-fg sm:-left-14"
        >
          ‹
        </button>
        <img src={item.src} alt={item.alt} className="max-h-[72vh] w-auto max-w-full rounded-2xl border-2 border-accent object-contain" />
        <button
          onClick={() => step(1)}
          aria-label="Next image"
          className="glass absolute right-1 z-10 grid h-11 w-11 place-items-center rounded-full text-xl text-fg sm:-right-14"
        >
          ›
        </button>
      </div>

      <p className="max-w-3xl text-center text-sm text-white" onClick={(e) => e.stopPropagation()}>
        {item.alt}
        {item.href && (
          <>
            .{" "}
            <a href={item.href} target="_blank" rel="noreferrer" className="font-semibold underline">
              View on {item.source}
            </a>
          </>
        )}
      </p>
    </div>,
    document.body,
  );
}
