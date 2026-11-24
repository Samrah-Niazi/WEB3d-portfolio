import Reveal from "./Reveal";
import type { ReactNode } from "react";

type Props = {
  id: string;
  title: string;
  eyebrow?: string;
  /** Light band with dark text (the Work section). */
  band?: boolean;
  /** "a": becomes a deep panel in the light theme (the dark theme keeps the misty page). "page": stays on the page in both. */
  tone?: "a" | "page";
  /** Big condensed capitals instead of the bold sans. */
  impact?: boolean;
  children: ReactNode;
};

// Every section rises out of the mist as it scrolls into view. 
export default function Section({ id, title, eyebrow, band = false, tone = "page", impact = false, children }: Props) {
  return (
    <section id={id} className={`relative ${band ? "band" : tone === "a" ? "tone-a" : ""}`}>
      <div className="mx-auto max-w-6xl px-4 py-24 sm:py-32">
        <Reveal>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h2
            className={
              impact
                ? "impact text-[clamp(3rem,10vw,8.5rem)]"
                : "heading text-[clamp(2.6rem,7vw,5.8rem)]"
            }
          >
            {title}
          </h2>
          <div aria-hidden="true" className="mb-12 mt-6 h-px w-28 bg-gradient-to-r from-accent to-transparent" />
          {children}
        </Reveal>
      </div>
    </section>
  );
}
