import { lazy, Suspense, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { profile } from "../data/profile";
import { useOnScreen } from "../lib/useOnScreen";

const HeroScene = lazy(() => import("./HeroScene"));

const MOVES = [
  { name: "Twirl", icon: "💃" },
  { name: "Cheer", icon: "🎉" },
  { name: "Nod", icon: "🙂" },
  { name: "Think", icon: "🤔" },
  { name: "Play", icon: "🎮" },
];
const ROLES = ["Game Developer", "AR/VR Developer", "Gameplay Programmer", "Unity & Unreal Creator"];

// Types out each role, pauses, deletes it, then moves to the next.
function RoleTyper() {
  const [i, setI] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const full = ROLES[i];
    let delay = deleting ? 35 : 75;
    if (!deleting && text === full) delay = 1500;
    const t = window.setTimeout(() => {
      if (!deleting && text === full) setDeleting(true);
      else if (deleting && text === "") {
        setDeleting(false);
        setI((i + 1) % ROLES.length);
      } else setText(deleting ? full.slice(0, text.length - 1) : full.slice(0, text.length + 1));
    }, delay);
    return () => window.clearTimeout(t);
  }, [text, deleting, i]);

  return (
    <p className="font-display mt-4 min-h-[2.2rem] text-2xl font-bold sm:text-3xl">
      <span className="sr-only">{profile.role}</span>
      <span aria-hidden="true" className="gradient-text">{text}</span>
      <span aria-hidden="true" className="caret text-accent2" />
    </p>
  );
}

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: "easeOut" as const },
});

export default function Hero() {
  const [sceneRef, sceneVisible] = useOnScreen<HTMLDivElement>();
  return (
    <section id="home" className="relative flex min-h-[170svh] items-start overflow-hidden pt-32 md:min-h-screen md:items-center md:pt-20">
      <div ref={sceneRef} className="absolute inset-0">
        <Suspense fallback={null}>
          <HeroScene active={sceneVisible} />
        </Suspense>
      </div>
      <div className="pointer-events-none relative z-10 mx-auto w-full max-w-6xl px-4">
        <motion.p className="eyebrow" {...rise(0.1)}>Hello, I&apos;m</motion.p>
        <motion.h1 className="title-3d text-5xl font-bold tracking-tight sm:text-7xl lg:text-8xl" {...rise(0.2)}>
          {profile.name}
        </motion.h1>
        <motion.div {...rise(0.3)}><RoleTyper /></motion.div>
        <motion.p className="mt-5 max-w-xl text-lg text-muted" {...rise(0.4)}>{profile.tagline}</motion.p>

        <motion.div className="pointer-events-auto mt-7 flex flex-wrap gap-3 sm:mt-9 sm:gap-4" {...rise(0.6)}>
          <a href="#projects" className="btn-3d !px-5 !py-2.5 text-sm sm:!px-7 sm:!py-3 sm:text-base">View projects</a>
          <a href="#contact" className="btn-ghost-3d !px-5 !py-2.5 text-sm sm:!px-7 sm:!py-3 sm:text-base">Contact me</a>
          <button
            type="button"
            className="btn-ghost-3d !px-5 !py-2.5 text-sm sm:!px-7 sm:!py-3 sm:text-base"
            onClick={() => window.dispatchEvent(new Event("avatar-wave"))}
          >
            <span aria-hidden="true">👋</span> Say hi
          </button>
        </motion.div>

        <motion.div className="pointer-events-auto mt-5 flex max-w-md flex-wrap items-center gap-2" {...rise(0.7)}>
          <span className="text-sm text-muted">Try a move:</span>
          {MOVES.map((m) => (
            <button
              key={m.name}
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("avatar-play", { detail: m.name }))}
              className="glass rounded-full px-3 py-1 text-sm font-semibold transition hover:border-accent"
            >
              <span aria-hidden="true">{m.icon}</span> {m.name}
            </button>
          ))}
        </motion.div>
        <p className="pointer-events-none mt-3 hidden max-w-sm text-sm text-muted sm:block">
          Drag the avatar to spin her around, click her to wave, or click her base to twirl.
        </p>
      </div>

      <a
        href="#about"
        className="pointer-events-auto absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted lg:flex"
      >
        Scroll
        <span className="flex h-9 w-6 justify-center rounded-full border-2 border-accent pt-1.5">
          <span className="h-2 w-1 rounded-full bg-accent" style={{ animation: "bounce-y 1.4s ease-in-out infinite" }} />
        </span>
      </a>
    </section>
  );
}
