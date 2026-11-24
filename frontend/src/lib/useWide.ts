import { useEffect, useState } from "react";

// true on tablets and desktops (768px and up). Phones get simpler, left-aligned layouts and no sideways slides.
export function useWide() {
  const query = "(min-width: 768px)";
  const [wide, setWide] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setWide(mq.matches);
    mq.addEventListener("change", on);
    on();
    return () => mq.removeEventListener("change", on);
  }, []);
  return wide;
}
