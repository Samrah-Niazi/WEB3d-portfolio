import { useState } from "react";

export default function ThemeToggle() {
  const [light, setLight] = useState(document.documentElement.dataset.theme !== "dark");

  const toggle = () => {
    const next = !light;
    setLight(next);
    if (next) delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = "dark";
    try {
      localStorage.setItem("theme", next ? "light" : "dark");
    } catch {}
  };

  return (
    <button
      onClick={toggle}
      aria-label={light ? "Switch to dark theme" : "Switch to light theme"}
      className="rounded-full border-2 border-accent px-3 py-1.5 text-sm font-semibold hover:bg-accent hover:text-on-accent"
    >
      {light ? "Dark" : "Light"}
    </button>
  );
}
