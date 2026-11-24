import { useEffect, useState } from "react";

export const PALETTES = [
  { id: "maroon", label: "Maroon & noir" },
  { id: "noir", label: "Black & beige" },
  { id: "emerald", label: "Emerald & pink" },
  { id: "sunset", label: "Indigo & sunset" },
] as const;

export type PaletteId = (typeof PALETTES)[number]["id"];

const read = () => {
  const s = getComputedStyle(document.documentElement);
  const v = (name: string) => s.getPropertyValue(name).trim();
  return {
    c1: v("--c1"), c2: v("--c2"), c3: v("--c3"), label1: v("--label1"), label2: v("--label2"), disc: v("--disc"),
    p1: v("--p1"), p2: v("--p2"), p3: v("--p3"), tint: v("--tint"), ink: v("--ink"), paper: v("--paper"), hi: v("--hi"),
  };
};

// Colors for the 3D scenes. They come from the same CSS variables as the page,
// so changing the palette or the theme recolors both.
export function usePaletteColors() {
  const [colors, setColors] = useState(read);
  useEffect(() => {
    const mo = new MutationObserver(() => setColors(read()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-palette"] });
    setColors(read());
    return () => mo.disconnect();
  }, []);
  return colors;
}
