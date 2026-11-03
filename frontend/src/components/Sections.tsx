import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { animate, useInView } from "framer-motion";
import Section from "./Section";
import ContactForm from "./ContactForm";
import MediaModal from "./MediaModal";
import { useAsset } from "../lib/useAsset";
import {
  profile,
  stats,
  skills,
  projects,
  achievements,
  timeline,
  certificates,
  community,
  type Media,
} from "../data/profile";

const SkillsGlobe = lazy(() => import("./SkillsGlobe"));

// Counts up to a number the first time it scrolls into view.
function CountUp({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, { duration: 1.4, ease: "easeOut", onUpdate: (v) => setN(Math.round(v)) });
    return () => controls.stop();
  }, [inView, to]);
  return <span ref={ref}>{n}</span>;
}

const GROUP_COLORS = ["text-accent", "text-accent2", "text-accent", "text-accent2", "text-accent"];
const PHOTO_URL = "/images/profile.jpg";

// Shows public/images/profile.jpg when it exists, otherwise initials.
function Photo() {
  const has = useAsset(PHOTO_URL);
  return (
    <div className="aspect-square w-44 -rotate-3 overflow-hidden border-4 border-fg bg-surface shadow-[7px_7px_0_var(--accent2)]">
      {has ? (
        <img src={PHOTO_URL} alt={`Portrait of ${profile.name}`} className="h-full w-full object-cover" />
      ) : (
        <div aria-hidden="true" className="flex h-full w-full items-center justify-center text-6xl font-extrabold text-accent">
          {profile.name.split(" ").map((w) => w[0]).join("")}
        </div>
      )}
    </div>
  );
}

export function About() {
  return (
    <Section id="about" title="About me" eyebrow="01 / About">
      <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4 text-lg text-muted">
          {profile.about.map((p) => <p key={p}>{p}</p>)}
        </div>
        <div className="space-y-6">
          <Photo />
          {/* A HUD read-out, not boxes: three numbers split by dashed rules. */}
          <dl className="grid grid-cols-3 divide-x-2 divide-dashed divide-line border-y-2 border-dashed border-line lg:grid-cols-1 lg:divide-x-0 lg:divide-y-2">
            {stats.map((s, i) => (
              <div key={s.label} className="px-3 py-3 lg:flex lg:items-baseline lg:justify-between">
                <dt className="font-mono text-xs font-bold uppercase tracking-wider text-muted">{s.label}</dt>
                <dd className={`font-display text-4xl font-extrabold ${GROUP_COLORS[i]}`}><CountUp to={Number(s.value)} /></dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </Section>
  );
}

export function Skills() {
  return (
    <Section id="skills" title="Skills & technologies" eyebrow="03 / Toolkit">
      <Suspense fallback={<div className="mb-10 h-[26rem]" />}>
        <SkillsGlobe />
      </Suspense>
      {/* A spec sheet: one ruled row per skill group, no cards. */}
      <div className="divide-y-2 divide-dashed divide-line border-y-2 border-dashed border-line">
        {skills.map((g, i) => (
          <div key={g.group} className="grid gap-3 py-5 md:grid-cols-[15rem_1fr] md:items-baseline md:gap-8">
            <h3 className="font-display text-xl font-bold">
              <span className="mr-2 font-mono text-sm text-accent2">{String(i + 1).padStart(2, "0")}</span>
              {g.group}
            </h3>
            <ul className="flex flex-wrap gap-2">
              {g.items.map((item) => <li key={item} className="tag">{item}</li>)}
            </ul>
          </div>
        ))}
      </div>
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
    <Section id="projects" title="Projects & achievements" eyebrow="04 / Work">
      <div className="mb-10 grid gap-5 sm:grid-cols-2">
        {achievements.map((a) => (
          <a
            key={a.title}
            href={a.link}
            target="_blank"
            rel="noreferrer"
            aria-label={`${a.title}: view on LinkedIn (opens in a new tab)`}
            className="ticket"
          >
            <span className="ticket-stub" aria-hidden="true"><span className="star">★</span><span className="vert">Unlocked</span></span>
            <span className="block p-4">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-accent2">Achievement</span>
              <span className="mt-1 block font-display text-xl font-extrabold">{a.title}</span>
              <span className="block text-sm text-muted">{a.detail}</span>
              <span className="mt-2 block text-sm font-bold text-accent underline">View on LinkedIn ↗</span>
            </span>
          </a>
        ))}
      </div>

      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search projects or tech (e.g. Unity, VR)"
          aria-label="Search projects"
          className="border-2 border-fg bg-bg px-4 py-2 font-mono text-sm shadow-[3px_3px_0_var(--accent)] sm:w-72"
        />
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              aria-pressed={cat === c}
              className={`border-2 px-3 py-1 font-mono text-xs font-bold uppercase tracking-wide transition ${
                cat === c ? "border-fg bg-accent text-on-accent shadow-[3px_3px_0_var(--accent2)]" : "border-line text-muted hover:border-fg"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 font-mono text-xs font-bold uppercase text-muted sm:ml-auto">
          Order
          <select
            value={order}
            onChange={(e) => setOrder(e.target.value as "featured" | "az")}
            className="border-2 border-fg bg-bg px-2 py-1.5 text-fg"
          >
            <option value="featured">Featured first</option>
            <option value="az">A to Z</option>
          </select>
        </label>
      </div>

      <p className="sr-only" role="status">{shown.length} projects shown</p>
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((p, i) => (
          <div key={p.title} className="cart">
            <div className={`cart-edge ${p.featured ? "feat" : ""}`}>
              <div
                className={`cart-body flex flex-col ${p.media ? "cursor-pointer" : ""}`}
                onClick={p.media ? () => setViewing(p.media!) : undefined}
              >
                <div className="cart-label flex items-center justify-between px-4 pb-2 pt-4 font-mono text-xs font-bold uppercase tracking-wider">
                  <span>No. {String(i + 1).padStart(2, "0")}</span>
                  <span className="text-accent2">{p.featured ? "★ " : ""}{p.category}</span>
                </div>
                <div className="px-4 pb-5 pt-3">
                  <h3 className="font-display text-xl font-extrabold">{p.title}</h3>
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

export function Experience() {
  const [viewing, setViewing] = useState<Media | null>(null);
  return (
    <Section id="experience" title="Education & experience" eyebrow="05 / Journey">
      {/* A quest log: checkpoints on a dashed rail, plain text, no boxes. */}
      <ol className="ml-4 space-y-9 border-l-[3px] border-dashed border-accent pl-9">
        {timeline.map((t, i) => (
          <li key={t.title} className="relative">
            <span className={`quest-node ${i % 2 ? "bg-accent2" : "bg-accent3"}`} aria-hidden="true" />
            <div className={t.media ? "cursor-pointer" : ""} onClick={t.media ? () => setViewing(t.media!) : undefined}>
              <p>
                <span className="stamp">{t.period}</span>
                <span className="ml-3 font-mono text-xs font-bold uppercase tracking-wider text-muted">
                  Quest {String(timeline.length - i).padStart(2, "0")} · {t.type}
                </span>
              </p>
              <h3 className="mt-3 font-display text-2xl font-extrabold">{t.title}</h3>
              <p className="font-semibold text-accent">{t.place}</p>
              <p className="mt-2 max-w-3xl text-sm text-muted">{t.detail}</p>
              {t.media && <MediaButton media={t.media} onOpen={setViewing} />}
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-16 grid gap-10 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 font-display text-2xl font-extrabold text-accent">Certificates</h3>
          <ul>
            {certificates.map((c) => (
              <li key={c.title} className="flex items-start gap-3 border-b-2 border-dotted border-line py-3">
                <span className="mt-0.5 grid h-8 w-8 flex-none place-items-center rounded-full bg-accent3 font-bold text-[#1a1a1a]" aria-hidden="true">✦</span>
                <span>
                  <span className="block font-bold">{c.title}</span>
                  <span className="block text-sm text-muted">{c.issuer}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-3 font-display text-2xl font-extrabold text-accent">Community & activities</h3>
          <ul className="space-y-3 text-sm text-muted">
            {community.map((c) => (
              <li key={c} className="flex gap-3 border-b-2 border-dotted border-line pb-3">
                <span className="font-bold text-accent2" aria-hidden="true">▸</span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <MediaModal media={viewing} onClose={() => setViewing(null)} />
    </Section>
  );
}

export function Contact() {
  return (
    <Section id="contact" title="Contact" eyebrow="06 / Say hello">
      <p className="mb-6 max-w-xl text-muted">
        Have a question or a project in mind? Send a message below, or email me at{" "}
        <a className="font-semibold text-accent underline" href={`mailto:${profile.email}`}>{profile.email}</a>.
      </p>
      <div className="cart max-w-xl">
        <div className="cart-edge feat">
          <div className="cart-body p-6 pt-8">
            <ContactForm />
          </div>
        </div>
      </div>
      <p className="mt-10 flex flex-wrap gap-4">
        <a className="btn-ghost-3d" href={profile.github} target="_blank" rel="noreferrer">GitHub</a>
        <a className="btn-ghost-3d" href={profile.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
        <a className="btn-ghost-3d" href={profile.itch} target="_blank" rel="noreferrer">itch.io</a>
      </p>
    </Section>
  );
}
