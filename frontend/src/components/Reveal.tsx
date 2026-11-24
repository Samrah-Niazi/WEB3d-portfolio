import { useRef, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

// A small effect for switching between sections: the content fades in and pops up a little as it arrives,
// and fades back softly as it leaves. It follows the scroll, so it works the same going down or up.
export default function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const calm = !!useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  // 0 to 1 while the top of the block travels from the bottom of the screen up to 65% down the screen.
  const { scrollYProgress: enter } = useScroll({ target: ref, offset: ["start end", "start 65%"] });
  // 0 to 1 while the bottom of the block travels from 35% down the screen to the top.
  const { scrollYProgress: leave } = useScroll({ target: ref, offset: ["end 35%", "end start"] });

  const opacity = useTransform([enter, leave], ([e, l]: number[]) => e * (1 - 0.75 * l));
  const y = useTransform([enter, leave], ([e, l]: number[]) => (1 - e) * 50 - l * 24);
  const scale = useTransform([enter, leave], ([e, l]: number[]) => 0.965 + e * 0.035 - l * 0.015);

  if (calm) return <div className={className}>{children}</div>;
  return (
    <motion.div ref={ref} style={{ opacity, y, scale, transformOrigin: "50% 30%" }} className={className}>
      {children}
    </motion.div>
  );
}
