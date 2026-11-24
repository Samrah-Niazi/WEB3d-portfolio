import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import CountUp from "./CountUp";
import MoveChips from "./MoveChips";
import { BRUSH } from "../lib/textures";
import { profile, stats } from "../data/profile";

const AboutScene = lazy(() => import("./AboutScene"));
const PHOTO_URL = "/images/profile.jpg";

// true while the media query matches (and keeps following it).
function useMedia(query: string) {
  const [match, setMatch] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    mq.addEventListener("change", on);
    on();
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return match;
}

// Painted maroon strokes on black: the backdrop of this page.
function Painted() {
  return (
    <>
      <div aria-hidden="true" className="absolute inset-0 bg-[#07080a]" />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-80"
        style={{
          maskImage: "radial-gradient(90% 80% at 50% 45%, #000 20%, transparent 85%)",
          WebkitMaskImage: "radial-gradient(90% 80% at 50% 45%, #000 20%, transparent 85%)",
        }}
      >
        <div
          className="h-full w-full"
          style={{
            backgroundColor: "color-mix(in srgb, var(--p3) 85%, var(--tint) 15%)",
            maskImage: BRUSH,
            WebkitMaskImage: BRUSH,
            maskSize: "900px 900px",
            WebkitMaskSize: "900px 900px",
          }}
        />
      </div>
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_100%,rgb(0_0_0/0.65),transparent)]" />
    </>
  );
}

function Stats() {
  return (
    <dl className="divide-y divide-line border-y border-line">
      {stats.map((s) => (
        <div key={s.label} className="flex items-baseline justify-between gap-4 py-2.5">
          <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted">{s.label}</dt>
          <dd className="font-display text-4xl font-extrabold text-accent"><CountUp to={Number(s.value)} /></dd>
        </div>
      ))}
    </dl>
  );
}

function Photo({ className = "" }: { className?: string }) {
  return (
    <div className={`overflow-hidden rounded-[14px] border border-fg/30 bg-black shadow-[0_24px_50px_rgb(0_0_0/0.55)] ${className}`}>
      <img src={PHOTO_URL} alt={`Portrait of ${profile.name}`} className="h-full w-full object-cover object-top" loading="lazy" />
    </div>
  );
}

// The spotlight: a beam of light and a pool of light on the floor.
function Spot() {
  return (
    <>
      <div aria-hidden="true" className="beam" />
      <div aria-hidden="true" className="absolute bottom-[9%] left-1/2 h-24 w-[min(70vw,34rem)] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgb(255_240_236/0.5),transparent)] blur-md" />
    </>
  );
}

// Wide screens: the spotlight stage is simply there, right after the hero, with the avatar already in the beam.
// The text slides in as it comes into view; nothing waits on an intro animation.
function Stage() {
  const ref = useRef<HTMLElement>(null);
  const near = useInView(ref, { margin: "1200px" }); // start drawing the avatar well before it is on screen
  const side = (dir: number) => ({
    initial: { opacity: 0, x: dir * 40 },
    whileInView: { opacity: 1, x: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.5, ease: "easeOut" as const },
  });

  return (
    <section id="about" ref={ref} className="dark-scope relative h-svh min-h-[40rem] overflow-hidden">
      <Painted />
      <h2 className="sr-only">About me</h2>
      <Spot />
      <div className="absolute inset-0 z-10">
        <Suspense fallback={null}>
          <AboutScene active={near} />
        </Suspense>
      </div>

      {/* the story, either side of the avatar */}
      <div className="pointer-events-none absolute inset-0 z-20">
        <motion.div
          {...side(-1)}
          className="absolute left-[4vw] top-1/2 w-[27vw] max-w-sm -translate-y-1/2 space-y-4 text-[0.98rem] leading-relaxed text-fg/90"
        >
          <p className="eyebrow">01 / About</p>
          <p className="heading text-3xl text-fg">{profile.name}</p>
          {profile.about.slice(0, 2).map((t) => <p key={t}>{t}</p>)}
        </motion.div>
        <motion.div
          {...side(1)}
          className="pointer-events-auto absolute right-[4vw] top-1/2 w-[27vw] max-w-sm -translate-y-1/2 space-y-4 text-[0.98rem] leading-relaxed text-fg/90"
        >
          <div className="flex items-end gap-4">
            <Photo className="h-36 w-28 flex-none -rotate-3" />
            <p className="text-sm text-muted">Drag the avatar to spin her, click her to wave, or click her base to twirl.</p>
          </div>
          <p>{profile.about[2]}</p>
          <Stats />
          <MoveChips />
        </motion.div>
      </div>
    </section>
  );
}

// Phones, tablets and "reduce motion": the same content, stacked, with no scroll-driven stage.
function Stacked() {
  const ref = useRef<HTMLDivElement>(null);
  const near = useInView(ref, { margin: "300px" });
  return (
    <section id="about" className="dark-scope relative overflow-hidden">
      <Painted />
      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-24 pt-20">
        <p className="eyebrow !text-fg/70">01 / About</p>
        <h2 className="impact glow-text text-[clamp(3.4rem,17vw,10rem)] text-fg">About me</h2>

        <div ref={ref} className="relative mt-3 h-[21rem] sm:h-[34rem]">
          <Spot />
          <div className="absolute inset-0 z-10">
            <Suspense fallback={null}>
              <AboutScene active={near} />
            </Suspense>
          </div>
        </div>
        {/* the move buttons live right under the avatar, so you can see her do each move without scrolling */}
        <MoveChips className="relative z-20 mb-12 mt-2 justify-center" />

        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-4 text-lg text-fg/90">
            {profile.about.map((t) => <p key={t}>{t}</p>)}
          </div>
          <div className="space-y-6">
            <Photo className="aspect-[3/4] w-44 -rotate-2" />
            <Stats />
          </div>
        </div>
      </div>
    </section>
  );
}

export default function About() {
  const stage = useMedia("(min-width: 1024px) and (min-height: 600px) and (prefers-reduced-motion: no-preference)");
  return stage ? <Stage /> : <Stacked />;
}
