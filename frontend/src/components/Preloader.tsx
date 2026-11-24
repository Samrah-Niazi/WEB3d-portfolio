import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { profile } from "../data/profile";

// Opening splash: the name lights up on black, then the curtain lifts to reveal the hero.
export default function Preloader() {
  const calm = !!useReducedMotion();
  const [visible, setVisible] = useState(true);
  const word = profile.name.split(" ")[0].toUpperCase();

  useEffect(() => {
    const t = window.setTimeout(() => setVisible(false), calm ? 600 : 2600);
    return () => window.clearTimeout(t);
  }, [calm]);

  useEffect(() => {
    document.body.style.overflow = visible ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          role="status"
          aria-label="Loading portfolio"
          className="dark-scope fixed inset-0 z-[100] flex flex-col items-center justify-center gap-7 bg-black"
          exit={{ y: "-100%" }}
          transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
        >
          <p aria-hidden="true" className="impact glow-text flex text-[clamp(3rem,11vw,8rem)] tracking-[0.22em] text-fg">
            {word.split("").map((ch, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 18, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.7, delay: 0.15 + i * 0.12, ease: "easeOut" }}
              >
                {ch}
              </motion.span>
            ))}
            <motion.span
              className="text-accent2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 + word.length * 0.12, duration: 0.5 }}
              style={{ color: "var(--hi)" }}
            >
              .
            </motion.span>
          </p>
          <div className="h-px w-44 overflow-hidden bg-line">
            <motion.div
              className="h-full bg-accent"
              initial={{ x: "-100%" }}
              animate={{ x: "0%" }}
              transition={{ duration: calm ? 0.4 : 2.2, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
