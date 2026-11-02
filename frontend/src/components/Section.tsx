import { motion } from "framer-motion";
import type { ReactNode } from "react";

type Props = { id: string; title: string; eyebrow?: string; children: ReactNode };

// Each section swings up out of the page in 3D as it scrolls into view.
export default function Section({ id, title, eyebrow, children }: Props) {
  return (
    <section id={id} className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20" style={{ perspective: 1200 }}>
      <motion.div
        initial={{ opacity: 0, y: 60, rotateX: -22, scale: 0.96 }}
        whileInView={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        style={{ transformOrigin: "50% 0%" }}
      >
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className="title-3d text-4xl font-bold tracking-tight sm:text-5xl">{title}</h2>
        <div aria-hidden="true" className="mb-10 mt-4 h-1.5 w-24 rounded-full bg-gradient-to-r from-accent via-accent2 to-accent3" />
        {children}
      </motion.div>
    </section>
  );
}
