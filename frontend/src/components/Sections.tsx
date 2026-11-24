import { useMemo, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Section from "./Section";
import Reveal from "./Reveal";
import ContactForm from "./ContactForm";
import MediaModal from "./MediaModal";
import { galleryItems } from "../data/gallery";
import { useWide } from "../lib/useWide";
import {
  profile,
  skills,
  projects,
  achievements,
  timeline,
  certificates,
  community,
  type Media,
} from "../data/profile";

// Game screenshots that pop up beside the pointer while a skill group is hovered.
const SHOTS = galleryItems.filter((g) => g.source === "itch.io").map((g) => g.src);
const OFFSETS = ["0%", "6%", "2%", "8%", "4%"];

type Peek = { x: number; y: number; src: string } | null;

// One skill group as a huge line of type. Every other line is outlined, and each slides sideways as you scroll.
function SkillRow({ group, items, index, onPeek }: { group: string; items: string[]; index: number; onPeek: (p: Peek) => void }) {
  const calm = !!useReducedMotion();
  const ref = useRef<HTMLLIElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const dir = index % 2 ? 1 : -1;
  const x = useTransform(scrollYProgress, [0, 1], [`${dir * 2.5}%`, `${dir * -2.5}%`]);
  const src = SHOTS.length ? SHOTS[index % SHOTS.length] : "";
  // The staggered indent and the sideways slide are only for wide screens; on a phone every row lines up on the left.
  const wide = useWide();

  return (
    <li
      ref={ref}
      className={`skill-row py-5 sm:py-7 ${index % 2 ? "alt" : ""}`}
      onPointerMove={(e) => src && e.pointerType === "mouse" && onPeek({ x: e.clientX, y: e.clientY, src })}
      onPointerLeave={() => onPeek(null)}
    >
      <motion.div style={{ x: calm || !wide ? 0 : x, paddingLeft: wide ? OFFSETS[index % OFFSETS.length] : 0 }}>
        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
          <span className="text-xs font-semibold tracking-[0.2em] text-accent">{String(index + 1).padStart(2, "0")}</span>
          <h3 className="skill-word text-[clamp(2.4rem,8.4vw,7.4rem)]">{group}</h3>
        </div>
        <ul className="mt-3 flex flex-wrap gap-2 sm:pl-10">
          {items.map((item) => <li key={item} className="tag">{item}</li>)}
        </ul>
      </motion.div>
    </li>
  );
}

export function Skills() {
  const [peek, setPeek] = useState<Peek>(null);
  return (
    <Section id="skills" title="Skills & technologies" eyebrow="03 / Toolkit" tone="a">
      <ul className="border-t border-line">
        {skills.map((g, i) => (
          <SkillRow key={g.group} group={g.group} items={g.items} index={i} onPeek={setPeek} />
        ))}
      </ul>
      <div
        aria-hidden="true"
        className="skill-peek hidden md:block"
        style={{
          left: (peek?.x ?? 0) + 24,
          top: (peek?.y ?? 0) - 90,
          opacity: peek ? 1 : 0,
          scale: peek ? "1" : "0.85",
          backgroundImage: peek ? `url(${peek.src})` : undefined,
        }}
      />
    </Section>
  );
}

const categories = ["All", "Game", "Research", "Web & Software"] as const;

// Button that opens a card's media; the whole card is clickable for mouse users.
function MediaButton({ media, onOpen }: { media: Media; onOpen: (m: Media) => void }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onOpen(media);
      }}
      className="pix-btn mr-2 mt-3"
    >
      <span aria-hidden="true">{media.type === "video" ? "▶" : "🖼"}</span> {media.label}
    </button>
  );
}

export function Projects() {
  const [viewing, setViewing] = useState<Media | null>(null);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<(typeof categories)[number]>("All");
  const [order, setOrder] = useState<"featured" | "az">("featured");
  const shown = useMemo(() => {
    const list = projects.filter(
      (p) =>
        (cat === "All" || p.category === cat) &&
        [p.title, p.stack, p.summary, ...p.tags].join(" ").toLowerCase().includes(query.toLowerCase()),
    );
    // "featured" keeps the CV order but puts featured projects first.
    return order === "az"
      ? [...list].sort((a, b) => a.title.localeCompare(b.title))
      : [...list].sort((a, b) => Number(!!b.featured) - Number(!!a.featured));
  }, [query, cat, order]);

  return (
    <Section id="projects" title="Projects & achievements" eyebrow="05 / Work" band>
      <div className="mb-14 grid gap-7 lg:grid-cols-2">
        {achievements.map((a, i) => (
          <a
            key={a.title}
            href={a.link}
            target="_blank"
            rel="noreferrer"
            aria-label={`${a.title}: view on LinkedIn (opens in a new tab)`}
            className="ticket"
          >
            <span className="ticket-stub" aria-hidden="true">
              <span className="admit">Admit one</span>
              <span className="no">No.{String(i + 1).padStart(2, "0")}</span>
              <span className="bars" />
            </span>
            <span className="ticket-main block">
              <span className="tk-kicker text-[0.66rem] font-bold uppercase tracking-[0.28em]">Achievement unlocked</span>
              <span className="heading mt-1 block text-[1.7rem] leading-tight sm:text-3xl">{a.title}</span>
              <span className="tk-detail mt-1 block text-sm">{a.detail}</span>
              <span className="mt-3 inline-block rounded-full border border-[color:var(--tm-fg)] px-3 py-1 text-xs font-semibold">View on LinkedIn ↗</span>
            </span>
          </a>
        ))}
      </div>

      <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search projects or tech (e.g. Unity, VR)"
          aria-label="Search projects"
          className="rounded-full border border-fg/40 bg-transparent px-5 py-2 text-sm placeholder:text-muted sm:w-80"
        />
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              aria-pressed={cat === c}
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                cat === c ? "border-fg bg-fg text-bg" : "border-fg/30 text-muted hover:border-fg hover:text-fg"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted sm:ml-auto">
          Order
          <select
            value={order}
            onChange={(e) => setOrder(e.target.value as "featured" | "az")}
            className="rounded-full border border-fg/30 bg-transparent px-3 py-1.5 text-fg"
          >
            <option value="featured">Featured first</option>
            <option value="az">A to Z</option>
          </select>
        </label>
      </div>

      <p className="sr-only" role="status">{shown.length} projects shown</p>
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((p, i) => (
          <div key={p.title} className="cart card-scope">
            <div className={`cart-edge ${p.featured ? "feat" : ""}`}>
              <div
                className={`cart-body flex flex-col ${p.media ? "cursor-pointer" : ""}`}
                onClick={p.media ? () => setViewing(p.media!) : undefined}
              >
                <div className="cart-label flex items-center justify-between px-4 pb-2 pt-4 font-mono text-xs font-bold uppercase tracking-wider">
                  <span>No. {String(i + 1).padStart(2, "0")}</span>
                  <span className="text-[color:var(--hi)]">{p.featured ? "★ " : ""}{p.category}</span>
                </div>
                <div className="px-4 pb-5 pt-3">
                  <h3 className="heading text-xl">{p.title}</h3>
                  <p className="mt-1 text-sm font-semibold text-accent">{p.stack}</p>
                  <p className="mt-3 text-sm text-muted">{p.summary}</p>
                  <ul className="mt-4 flex flex-wrap gap-1.5">
                    {p.tags.map((t) => <li key={t} className="tag">{t}</li>)}
                  </ul>
                  {p.media && <MediaButton media={p.media} onOpen={setViewing} />}
                  {p.play && (
                    <a
                      href={p.play}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Play ${p.title} on itch.io (opens in a new tab)`}
                      className="pix-btn mr-2 mt-3"
                    >
                      <span aria-hidden="true">🎮</span> Play on itch.io
                    </a>
                  )}
                  {p.repo && (
                    <a
                      href={p.repo}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`${p.title} source code on GitHub (opens in a new tab)`}
                      className="pix-btn mt-3"
                    >
                      <span aria-hidden="true">{"</>"}</span> GitHub
                    </a>
                  )}
                </div>
                <div className="cart-pins" aria-hidden="true" />
              </div>
            </div>
          </div>
        ))}
        {shown.length === 0 && <p className="text-muted">No projects match.</p>}
      </div>
      <MediaModal media={viewing} onClose={() => setViewing(null)} />
    </Section>
  );
}

const WORD_NUMBERS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight"];

// The timeline: a glowing line draws itself down the page as you scroll, one "level" per milestone.
function Timeline({ onMedia }: { onMedia: (m: Media) => void }) {
  const calm = !!useReducedMotion();
  const wide = useWide();
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 60%"] });

  return (
    <ol ref={ref} className="relative pb-4">
      <div className="tl-rail" aria-hidden="true" />
      <motion.div className="tl-fill" aria-hidden="true" style={{ scaleY: calm ? 1 : scrollYProgress }} />
      {timeline.map((t, i) => {
        const year = t.period.match(/\d{4}/)?.[0] ?? "";
        const right = i % 2 === 1;
        return (
          <li key={t.title} className="relative pb-12 pl-12 md:pl-0">
            <span className="tl-node" aria-hidden="true" style={{ top: "1.6rem" }} />
            <motion.div
              initial={{ opacity: 0, y: 50, x: calm || !wide ? 0 : right ? 60 : -60 }}
              whileInView={{ opacity: 1, y: 0, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`md:w-[calc(50%-3rem)] ${right ? "md:ml-auto" : ""}`}
            >
              <div
                className={`tl-card card-scope p-6 sm:p-7 ${t.type === "Research" ? "hot" : ""} ${t.media ? "cursor-pointer" : ""}`}
                onClick={t.media ? () => onMedia(t.media!) : undefined}
              >
                <span className="tl-year" aria-hidden="true">{year}</span>
                <p className="relative text-[0.68rem] font-bold uppercase tracking-[0.26em] text-accent">
                  Level {String(timeline.length - i).padStart(2, "0")} · {t.type}
                </p>
                <p className="relative mt-2 inline-block rounded-full border border-fg/40 px-3 py-1 text-xs font-semibold">{t.period}</p>
                <h3 className="heading relative mt-4 text-2xl leading-tight sm:text-3xl">{t.title}</h3>
                <p className="relative mt-1 font-semibold text-accent">{t.place}</p>
                <p className="relative mt-3 text-sm leading-relaxed text-muted">{t.detail}</p>
                {t.media && <MediaButton media={t.media} onOpen={onMedia} />}
              </div>
            </motion.div>
          </li>
        );
      })}
    </ol>
  );
}

export function Experience() {
  const [viewing, setViewing] = useState<Media | null>(null);
  return (
    <Section id="experience" title="Where I've been" eyebrow="06 / Education & experience" impact tone="page">
      <Timeline onMedia={setViewing} />

      <div className="mt-24">
        <h3 className="heading text-4xl sm:text-5xl">Certifications</h3>
        <p className="sr-only">{WORD_NUMBERS[certificates.length] ?? certificates.length} certificates.</p>
        <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4" style={{ perspective: 1200 }}>
          {certificates.map((c, i) => (
            <li
              key={c.title}
              className="cert-card card-scope"
              style={{ ["--ry" as string]: `${[-9, -3, 3, 9][i % 4]}deg`, ["--ty" as string]: `${i % 2 ? 22 : 0}px` }}
            >
              <span className="grid h-9 w-9 place-items-center rounded-full border border-accent text-accent" aria-hidden="true">✦</span>
              <p className="mt-4 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-muted">Certificate {String(i + 1).padStart(2, "0")}</p>
              <p className="heading mt-1 text-xl leading-snug">{c.title}</p>
              <p className="mt-2 text-sm text-muted">{c.issuer}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-24">
        <h3 className="heading text-4xl sm:text-5xl">Community & activities</h3>
        <ul className="mt-8 grid gap-x-12 md:grid-cols-2">
          {community.map((c) => (
            <li key={c} className="flex gap-3 border-b border-line py-4 text-sm text-muted">
              <span className="font-bold text-accent" aria-hidden="true">▸</span>
              {c}
            </li>
          ))}
        </ul>
      </div>
      <MediaModal media={viewing} onClose={() => setViewing(null)} />
    </Section>
  );
}

export function Contact() {
  return (
    <section
      id="contact"
      className="dark-scope grain relative overflow-hidden"
      style={{ background: "radial-gradient(75% 95% at 25% 15%, var(--p2) 0%, var(--p1) 45%, var(--p0) 100%)" }}
    >
      <Reveal className="relative z-10 mx-auto grid max-w-6xl gap-14 px-4 py-24 sm:py-32 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div>
          <p className="eyebrow !text-fg/80">07 / Say hello</p>
          <h2 className="impact text-[clamp(3.6rem,11vw,9rem)] text-fg">Contact</h2>
          <p className="mt-6 max-w-md text-lg text-fg/90">
            Have a question or a project in mind? Send a message, or email me at{" "}
            <a className="font-semibold underline underline-offset-4" href={`mailto:${profile.email}`}>{profile.email}</a>.
          </p>
          <p className="mt-8 flex flex-wrap gap-3">
            <a className="btn-ghost-3d !px-5 !py-2 text-sm" href={profile.github} target="_blank" rel="noreferrer">GitHub</a>
            <a className="btn-ghost-3d !px-5 !py-2 text-sm" href={profile.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
            <a className="btn-ghost-3d !px-5 !py-2 text-sm" href={profile.itch} target="_blank" rel="noreferrer">itch.io</a>
          </p>
        </div>
        <div className="door">
          <ContactForm />
        </div>
      </Reveal>
    </section>
  );
}
