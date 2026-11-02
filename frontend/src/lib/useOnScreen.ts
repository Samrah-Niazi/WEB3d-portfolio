import { useEffect, useRef, useState } from "react";

// True while the element is near the viewport. Used to stop drawing 3D scenes nobody can see.
export function useOnScreen<T extends Element>(margin = "150px") {
  const ref = useRef<T>(null);
  const [onScreen, setOnScreen] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { rootMargin: margin });
    io.observe(el);
    return () => io.disconnect();
  }, [margin]);
  return [ref, onScreen] as const;
}
