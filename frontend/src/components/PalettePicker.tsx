import { useState } from "react";
import { PALETTES, type PaletteId } from "../lib/usePalette";

export default function PalettePicker() {
  const [palette, setPalette] = useState<PaletteId>(
    (document.documentElement.dataset.palette as PaletteId | undefined) ?? "mint",
  );

  const choose = (id: PaletteId) => {
    setPalette(id);
    document.documentElement.dataset.palette = id;
    try {
      localStorage.setItem("palette", id);
    } catch {}
  };

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="sr-only">Color palette</span>
      <select
        value={palette}
        onChange={(e) => choose(e.target.value as PaletteId)}
        className="rounded-full border-2 border-accent bg-surface px-3 py-1.5 text-sm font-semibold text-fg"
        aria-label="Color palette"
      >
        {PALETTES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
      </select>
    </label>
  );
}
