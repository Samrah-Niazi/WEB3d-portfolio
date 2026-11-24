import { useState } from "react";

// Dark is the default. "Light" swaps the page tokens (the hero, about stage and contact keep their dark scene).
export default function ThemeToggle() {
  const [light, setLight] = useState(document.documentElement.dataset.theme === "light");

  const toggle = () => {
    const next = !light;
    setLight(next);
    if (next) document.documentElement.dataset.theme = "light";
    else delete document.documentElement.dataset.theme;
    try {
      localStorage.setItem("pf-theme", next ? "light" : "dark");
    } catch {}
  };

  return (
    <button
      onClick={toggle}
      aria-label={light ? "Switch to dark theme" : "Switch to light theme"}
      className="rounded-full border border-line px-3 py-1.5 text-sm font-semibold text-fg transition hover:border-accent hover:text-accent"
    >
      {light ? "Dark" : "Light"}
    </button>
  );
}
