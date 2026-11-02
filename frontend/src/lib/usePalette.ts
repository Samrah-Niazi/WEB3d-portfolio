import { useEffect, useState } from "react";

export const PALETTES = [
  { id: "mint", label: "Mint pop" },
  { id: "cyber", label: "Electric cyber" },
  { id: "sunset", label: "Sunset candy" },
  { id: "royal", label: "Purple & gold" },
] as const;

export type PaletteId = (typeof PALETTES)[number]["id"];

const read = () => {
  const s = getComputedStyle(document.documentElement);
  const v = (name: string) => s.getPropertyValue(name).trim();
  return { c1: v("--c1"), c2: v("--c2"), c3: v("--c3"), label1: v("--label1"), label2: v("--label2"), disc: v("--disc") };
};

// Colors for the 3D scenes. They come from the same CSS variables as the page,
// so changing the palette or theme recolors both.
export function usePaletteColors() {
  const [colors, setColors] = useState(read);
  useEffect(() => {
    const mo = new MutationObserver(() => setColors(read()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-palette", "data-theme"] });
    setColors(read());
    return () => mo.disconnect();
  }, []);
  return colors;
}
