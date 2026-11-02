import { useRef, type PointerEvent, type ReactNode } from "react";

type Props = { children: ReactNode; className?: string; max?: number; onClick?: () => void };

// A card that rotates in 3D toward the pointer and shows a light glare.
// Inner elements with the "pop" class float above the card surface.
export default function Tilt({ children, className = "", max = 12, onClick }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const enabled =
    typeof window !== "undefined" &&
    window.matchMedia("(hover: hover) and (prefers-reduced-motion: no-preference)").matches;

  const move = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!enabled || !el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.transform = `perspective(900px) rotateX(${(0.5 - y) * max}deg) rotateY(${(x - 0.5) * max}deg) scale3d(1.03,1.03,1.03)`;
    el.style.setProperty("--gx", `${x * 100}%`);
    el.style.setProperty("--gy", `${y * 100}%`);
  };
  const leave = () => {
    if (ref.current) ref.current.style.transform = "";
  };

  return (
    <div ref={ref} onPointerMove={move} onPointerLeave={leave} onClick={onClick} className={`tilt ${onClick ? "cursor-pointer" : ""} ${className}`}>
      <div className="tilt-glare" aria-hidden="true" />
      {children}
    </div>
  );
}
