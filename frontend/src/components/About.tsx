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

// Wide screens, all automatic: as you arrive the "About me" card slams in, holds for a beat, then zooms past you
// while the spotlight snaps on and the avatar rises into the beam. No scrolling needed to move it along.
function Stage() {
  const ref = useRef<HTMLElement>(null);
  const near = useInView(ref, { margin: "300px" });
  const arrived = useInView(ref, { amount: 0.5 });
  const [phase, setPhase] = useState<"idle" | "card" | "stage">("idle");
  const started = useRef(false);

  useEffect(() => {
    if (!arrived || started.current) return;
    started.current = true;
    setPhase("card");
    window.setTimeout(() => setPhase("stage"), 1900);
  }, [arrived]);

  const card = {
    idle: { opacity: 0, scale: 1.7, rotateX: 28, filter: "blur(20px)" },
    card: { opacity: 1, scale: 1, rotateX: 0, filter: "blur(0px)", transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] as const } },
    stage: { opacity: 0, scale: 6, rotateX: 0, filter: "blur(14px)", transition: { duration: 0.8, ease: [0.7, 0, 0.84, 0] as const } },
  };
  const lit = { idle: { opacity: 0 }, card: { opacity: 0 }, stage: { opacity: 1, transition: { duration: 0.6, delay: 0.35 } } };
  const beam = {
    idle: { opacity: 0, scaleX: 0.15 },
    card: { opacity: 0, scaleX: 0.15 },
    stage: { opacity: 1, scaleX: 1, transition: { duration: 1, delay: 0.3, ease: "easeOut" as const } },
  };
  const avatar = {
    idle: { opacity: 0, y: 90, scale: 0.9 },
    card: { opacity: 0, y: 90, scale: 0.9 },
    stage: { opacity: 1, y: 0, scale: 1, transition: { duration: 1, delay: 0.55, ease: [0.16, 1, 0.3, 1] as const } },
  };
  const side = (dir: number) => ({
    idle: { opacity: 0, x: dir * 70 },
    card: { opacity: 0, x: dir * 70 },
    stage: { opacity: 1, x: 0, transition: { duration: 0.8, delay: 0.95, ease: "easeOut" as const } },
  });

  return (
    <section id="about" ref={ref} className="dark-scope relative h-svh min-h-[40rem] overflow-hidden">
      <Painted />

      <motion.div variants={lit} animate={phase} initial="idle" className="absolute inset-0">
        <motion.div variants={beam} animate={phase} initial="idle" style={{ transformOrigin: "50% 0%" }} className="absolute inset-0">
          <Spot />
        </motion.div>
      </motion.div>
      <motion.div variants={avatar} animate={phase} initial="idle" className="absolute inset-0 z-10">
        <Suspense fallback={null}>
          <AboutScene active={near} />
        </Suspense>
      </motion.div>

      {/* a flash as the light snaps on */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-30 bg-white"
        initial={{ opacity: 0 }}
        animate={phase === "stage" ? { opacity: [0, 0.45, 0] } : { opacity: 0 }}
        transition={{ duration: 0.7, delay: 0.3 }}
      />

      {/* "About me" card */}
      <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center px-6" style={{ perspective: 1400 }}>
        <motion.div
          variants={card}
          animate={phase}
          initial="idle"
          className="relative w-[min(88vw,58rem)] rounded-[10px] border border-fg/30 bg-black/55 px-8 py-10 shadow-[0_40px_90px_rgb(0_0_0/0.7)] backdrop-blur-md"
        >
          <p className="eyebrow !text-fg/70">01 / About</p>
          <h2 className="impact glow-text text-[clamp(5rem,15vw,13rem)] text-fg">
            About<br />me
          </h2>
        </motion.div>
      </div>

      {/* the story, either side of the avatar */}
      <div className="pointer-events-none absolute inset-0 z-20">
        <motion.div
          variants={side(-1)}
          animate={phase}
          initial="idle"
          className="absolute left-[4vw] top-1/2 w-[27vw] max-w-sm -translate-y-1/2 space-y-4 text-[0.98rem] leading-relaxed text-fg/90"
        >
          <p className="eyebrow">01 / About</p>
          <p className="heading text-3xl text-fg">{profile.name}</p>
          {profile.about.slice(0, 2).map((t) => <p key={t}>{t}</p>)}
        </motion.div>
        <motion.div
          variants={side(1)}
          animate={phase}
          initial="idle"
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
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-24">
        <p className="eyebrow !text-fg/70">01 / About</p>
        <h2 className="impact glow-text text-[clamp(4.5rem,22vw,12rem)] text-fg">About me</h2>

        <div ref={ref} className="relative mt-6 h-[30rem] sm:h-[36rem]">
          <Spot />
          <div className="absolute inset-0 z-10">
            <Suspense fallback={null}>
              <AboutScene active={near} />
            </Suspense>
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-4 text-lg text-fg/90">
            {profile.about.map((t) => <p key={t}>{t}</p>)}
          </div>
          <div className="space-y-6">
            <Photo className="aspect-[3/4] w-44 -rotate-2" />
            <Stats />
            <MoveChips />
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
