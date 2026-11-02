import { useEffect, useRef } from "react";

// A soft colored glow that follows the mouse, behind the page content. CSS only, no re-renders.
// Skipped on touch screens and when the visitor prefers reduced motion.
export default function CursorGlow() {
  const glow = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (prefers-reduced-motion: no-preference)").matches) return;
    let raf = 0;
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 3;
    const paint = () => {
      raf = 0;
      glow.current?.style.setProperty("--mx", `${x}px`);
      glow.current?.style.setProperty("--my", `${y}px`);
    };
    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!raf) raf = requestAnimationFrame(paint);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    paint();
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={glow}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0"
      style={{
        zIndex: -5,
        background: "radial-gradient(520px circle at var(--mx, 50%) var(--my, 30%), rgb(var(--glow) / 0.16), transparent 62%)",
      }}
    />
  );
}
