import { useEffect, useMemo, useState } from "react";
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

// A masonry gallery of screenshots and achievement photos. Click one to open it full screen.
export default function Gallery() {
  const [open, setOpen] = useState<number | null>(null);
  const shown = galleryItems;
  const awards = useMemo(() => shown.filter(isAward), [shown]);
  const rest = useMemo(() => shown.filter((i) => !isAward(i)), [shown]);
  const ratios = useRatios(shown);
  const columns = useColumns(rest, ratios);

  if (shown.length === 0) return null;

  const card = (item: GalleryItem) => (
    <li key={item.id}>
      <button
        onClick={() => setOpen(shown.indexOf(item))}
        aria-label={`Open image: ${item.alt}`}
        className="group relative block w-full overflow-hidden rounded-2xl border-2 border-line bg-surface shadow-md transition hover:-translate-y-1 hover:border-accent hover:shadow-xl"
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
    <Section id="gallery" title="Projects & achievements gallery" eyebrow="07 / Memories">
      <p className="sr-only" role="status">{shown.length} images shown</p>
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
