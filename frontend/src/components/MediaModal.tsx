import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { Media } from "../data/profile";

type Props = { media: Media | null; onClose: () => void };

// Full-screen viewer for an image or a video. Closes on Escape, the backdrop, or the Close button.
export default function MediaModal({ media, onClose }: Props) {
  const closeBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!media) return;
    const opener = document.activeElement as HTMLElement | null;
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      opener?.focus();
    };
  }, [media, onClose]);

  if (!media) return null;

  // Rendered into <body> so the sections' 3D transforms can't shrink or clip the full-screen overlay.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={media.title}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-full max-w-5xl flex-col items-center gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex w-full items-center justify-between gap-4 text-white">
          <h2 className="text-lg font-bold">{media.title}</h2>
          <button ref={closeBtn} onClick={onClose} className="btn-3d !px-4 !py-1.5 text-sm">
            Close
          </button>
        </div>
        {media.type === "image" ? (
          <img
            src={media.src}
            alt={media.alt ?? media.title}
            className="max-h-[80vh] w-auto rounded-2xl border-2 border-accent object-contain"
          />
        ) : (
          <video
            src={media.src}
            controls
            autoPlay
            playsInline
            aria-label={media.title}
            className="max-h-[80vh] w-full rounded-2xl border-2 border-accent bg-black"
          />
        )}
      </div>
    </div>,
    document.body,
  );
}
