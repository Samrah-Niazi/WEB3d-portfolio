import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { profile } from "../data/profile";

const ROLES = ["Game Developer", "AR/VR Developer", "Gameplay Programmer", "Unity & Unreal Creator"];
const SILHOUETTE = "/images/silhouette.png";
export const CV_URL = "/Samrah_Niazi_CV.pdf";

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
    <p className="mt-3 min-h-[2rem] text-xl font-bold tracking-tight text-fg sm:text-2xl">
      <span className="sr-only">{profile.role}</span>
      <span aria-hidden="true">{text}</span>
      <span aria-hidden="true" className="caret" style={{ color: "var(--hi)" }} />
    </p>
  );
}

function Buttons({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      <a href="#projects" className="btn-3d !px-5 !py-2.5 text-sm">View projects</a>
      <a href={CV_URL} download="Samrah_Niazi_CV.pdf" className="btn-ghost-3d !px-5 !py-2.5 text-sm">
        <span aria-hidden="true">↓</span> Download CV
      </a>
      <a href="#contact" className="btn-ghost-3d !px-5 !py-2.5 text-sm">Contact me</a>
    </div>
  );
}

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 36 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.9, delay, ease: "easeOut" as const },
});

// Page one: the shadow of the portrait in the middle, the giant name behind it, small text on either side.
export default function Hero() {
  const calm = !!useReducedMotion();
  const ref = useRef<HTMLElement>(null);

  // Mouse parallax: the shadow and the name drift in opposite directions.
  const mx = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 50, damping: 18 });
  const figureX = useTransform(sx, (v) => v * -20);
  const textX = useTransform(sx, (v) => v * 26);

  // Scrolling away: the name grows past you while the shadow sinks back.
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const nameScale = useTransform(p, [0, 1], [1, 1.35]);
  const nameY = useTransform(p, [0, 1], [0, -120]);
  const nameOpacity = useTransform(p, [0, 0.8], [1, 0]);
  const figY = useTransform(p, [0, 1], [0, 140]);
  const figScale = useTransform(p, [0, 1], [1, 1.1]);
  const figOpacity = useTransform(p, [0.3, 1], [1, 0]);

  const [first, ...rest] = profile.name.toUpperCase().split(" ");

  return (
    <section
      id="home"
      ref={ref}
      className="grain relative isolate min-h-[100svh] overflow-hidden"
      style={{ background: "var(--hero-bg)" }}
      onPointerMove={(e) => !calm && mx.set(e.clientX / window.innerWidth - 0.5)}
    >
      {/* the giant name, behind the shadow */}
      <motion.div style={{ scale: calm ? 1 : nameScale, y: calm ? 0 : nameY, opacity: calm ? 1 : nameOpacity }} className="absolute inset-x-0 top-[11svh] z-10 select-none text-center">
        <motion.div style={{ x: calm ? 0 : textX }}>
          <motion.p className="eyebrow !text-[color:var(--hero-text)]" {...rise(2.7)}>Hello, I&apos;m</motion.p>
          <motion.h1
            className="impact text-[min(19vw,29svh)] leading-[0.88]" style={{ color: "var(--hero-name)" }}
            initial={{ opacity: 0, y: 90 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 2.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {first}
            <br />
            {rest.join(" ")}
          </motion.h1>
        </motion.div>
      </motion.div>

      {/* the shadow of the portrait, centered */}
      <motion.div
        aria-hidden="true"
        style={{ y: calm ? 0 : figY, scale: calm ? 1 : figScale, opacity: calm ? 1 : figOpacity }}
        className="pointer-events-none absolute bottom-0 left-1/2 z-20 -translate-x-1/2"
      >
        <motion.img
          src={SILHOUETTE}
          alt=""
          draggable={false}
          style={{ x: calm ? 0 : figureX, filter: "drop-shadow(0 0 40px color-mix(in srgb, var(--tint) 30%, transparent))" }}
          className="block h-[58svh] w-auto max-w-none select-none md:h-[67svh]"
          initial={{ opacity: 0, y: 70 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.3, delay: 2.7, ease: "easeOut" }}
        />
      </motion.div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-44"
        style={{ background: "linear-gradient(to top, color-mix(in srgb, var(--hero-fade) 90%, transparent), color-mix(in srgb, var(--hero-fade) 40%, transparent), transparent)" }}
      />

      {/* small text, left and right of the shadow (desktop) */}
      <motion.div {...rise(3.0)} className="absolute bottom-[16svh] left-[4vw] z-40 hidden w-[24vw] max-w-sm md:block">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-fg/70">About</p>
        <p className="mt-2 text-base leading-relaxed text-fg/90">{profile.tagline}</p>
      </motion.div>
      <motion.div {...rise(3.1)} className="absolute bottom-[16svh] right-[4vw] z-40 hidden w-[24vw] min-w-[17rem] max-w-sm md:block">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-fg/70">Currently</p>
        <RoleTyper />
        <Buttons className="mt-5" />
      </motion.div>

      {/* phones: one block under the shadow */}
      <motion.div {...rise(3.0)} className="absolute inset-x-0 bottom-0 z-40 px-5 pb-24 md:hidden">
        <p className="text-base leading-relaxed text-fg/90">{profile.tagline}</p>
        <RoleTyper />
        <Buttons className="mt-4" />
      </motion.div>

      <a
        href="#about"
        className="absolute bottom-6 left-1/2 z-40 hidden -translate-x-1/2 flex-col items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-fg/80 md:flex"
      >
        Scroll
        <span className="flex h-9 w-6 justify-center rounded-full border border-fg/60 pt-1.5">
          <span className="h-2 w-px rounded-full bg-fg" style={{ animation: "bounce-y 1.4s ease-in-out infinite" }} />
        </span>
      </a>
    </section>
  );
}
