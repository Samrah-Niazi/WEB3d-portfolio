import { useEffect, useMemo, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import Section from "./Section";
import GalleryLightbox from "./GalleryLightbox";
import { galleryItems, isAward, type GalleryItem } from "../data/gallery";

const columnCount = () => (window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1);

// Height/width of every image, measured once, so the columns below can be balanced.
function useRatios(items: GalleryItem[]) {
  const [ratios, setRatios] = useState<Record<string, number>>({});
  useEffect(() => {
    items.forEach((it) => {
      const img = new Image();
      img.onload = () => setRatios((r) => (r[it.id] ? r : { ...r, [it.id]: img.naturalHeight / img.naturalWidth }));
      img.src = it.src;
    });
  }, [items]);
  return ratios;
}

// Splits the pictures over the columns, always giving the next one to the shortest column, so no column ends with a gap.
function useColumns(items: GalleryItem[], ratios: Record<string, number>) {
  const [cols, setCols] = useState(columnCount);
  useEffect(() => {
    const onResize = () => setCols(columnCount());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return useMemo(() => {
    const out: GalleryItem[][] = Array.from({ length: cols }, () => []);
    const heights = new Array(cols).fill(0);
    items.forEach((it) => {
      const shortest = heights.indexOf(Math.min(...heights));
      out[shortest].push(it);
      heights[shortest] += ratios[it.id] ?? 0.75;
    });
    return out;
  }, [items, ratios, cols]);
}

// Where each floating card sits and how it is turned in 3D.
const SPOTS = [
  { left: "2%", top: "14%", w: "40%", rz: -7, ry: 16, z: 30 },
  { left: "28%", top: "34%", w: "38%", rz: 4, ry: -10, z: 110 },
  { left: "54%", top: "4%", w: "36%", rz: -3, ry: -18, z: 10 },
  { left: "60%", top: "44%", w: "34%", rz: 8, ry: 12, z: 70 },
];

// Game screenshots floating in space; the whole cluster leans toward the pointer.
function FloatingCards({ items, onOpen }: { items: GalleryItem[]; onOpen: (item: GalleryItem) => void }) {
  const calm = !!useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 16 });
  const sy = useSpring(my, { stiffness: 60, damping: 16 });
  const rotateY = useTransform(sx, [-0.5, 0.5], [-14, 14]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [10, -10]);

  return (
    <div
      className="relative mb-16 h-[22rem] sm:h-[32rem]"
      style={{ perspective: 1500 }}
      onPointerMove={(e) => {
        if (calm) return;
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onPointerLeave={() => {
        mx.set(0);
        my.set(0);
      }}
    >
      <div aria-hidden="true" className="absolute inset-x-[10%] bottom-0 h-24 rounded-[50%] bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--p2)_50%,transparent),transparent)] blur-xl" />
      <motion.div className="absolute inset-0" style={{ rotateX: calm ? 0 : rotateX, rotateY: calm ? 0 : rotateY, transformStyle: "preserve-3d" }}>
        {items.slice(0, SPOTS.length).map((item, i) => {
          const s = SPOTS[i];
          return (
            <button
              key={item.id}
              onClick={() => onOpen(item)}
              aria-label={`Open image: ${item.alt}`}
              className="group absolute overflow-hidden rounded-[14px] border border-fg/30 bg-black shadow-[0_30px_60px_rgb(0_0_0/0.6)] transition-[transform,border-color] duration-300 hover:border-accent"
              style={{
                left: s.left,
                top: s.top,
                width: s.w,
                transform: `translateZ(${s.z}px) rotateY(${s.ry}deg) rotateZ(${s.rz}deg)`,
              }}
            >
              <img src={item.src} alt="" loading="lazy" decoding="async" className="block aspect-video w-full object-cover transition duration-500 group-hover:scale-105" />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-2.5 text-left text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white">
                {item.category}
              </span>
            </button>
          );
        })}
      </motion.div>
    </div>
  );
}

// A masonry gallery of screenshots and achievement photos. Click one to open it full screen.
export default function Gallery() {
  const [open, setOpen] = useState<number | null>(null);
  const shown = galleryItems;
  const awards = useMemo(() => shown.filter(isAward), [shown]);
  const rest = useMemo(() => shown.filter((i) => !isAward(i)), [shown]);
  const floating = useMemo(() => shown.filter((i) => i.source === "itch.io"), [shown]);
  const ratios = useRatios(shown);
  const columns = useColumns(rest, ratios);

  if (shown.length === 0) return null;

  const card = (item: GalleryItem) => (
    <li key={item.id}>
      <button
        onClick={() => setOpen(shown.indexOf(item))}
        aria-label={`Open image: ${item.alt}`}
        className="group relative block w-full overflow-hidden rounded-[14px] border border-line bg-surface shadow-md transition hover:-translate-y-1 hover:border-accent hover:shadow-xl"
      >
        <img
          src={item.src}
          alt={item.alt}
          style={ratios[item.id] ? { aspectRatio: `1 / ${ratios[item.id]}` } : undefined}
          loading="lazy"
          decoding="async"
          className="block h-auto w-full transition duration-500 group-hover:scale-[1.04]"
        />
        <span className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/80 to-transparent p-3 text-left text-xs font-semibold text-white transition group-hover:translate-y-0 group-focus-visible:translate-y-0">
          {item.category}
          <span className="block font-normal opacity-80">{item.alt}</span>
        </span>
      </button>
    </li>
  );

  return (
    <Section id="gallery" title="Projects & achievements gallery" eyebrow="08 / Memories" tone="page">
      <p className="sr-only" role="status">{shown.length} images shown</p>
      {floating.length > 0 && <FloatingCards items={floating} onOpen={(it) => setOpen(shown.indexOf(it))} />}
      {/* The award photos get the whole first row; everything else is balanced across columns below. */}
      <ul className="mb-4 grid gap-4 sm:grid-cols-2">{awards.map(card)}</ul>
      <div className="flex items-start gap-4">
        {columns.map((col, i) => (
          <ul key={i} className="flex min-w-0 flex-1 flex-col gap-4">{col.map(card)}</ul>
        ))}
      </div>

      <GalleryLightbox items={shown} index={open} onClose={() => setOpen(null)} onChange={setOpen} />
    </Section>
  );
}
