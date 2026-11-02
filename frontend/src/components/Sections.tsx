import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { animate, useInView } from "framer-motion";
import Section from "./Section";
import Tilt from "./Tilt";
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
    <Tilt className="aspect-square w-44 overflow-hidden rounded-3xl border-2 border-accent bg-surface" max={16}>
      {has ? (
        <img src={PHOTO_URL} alt={`Portrait of ${profile.name}`} className="h-full w-full object-cover" />
      ) : (
        <div aria-hidden="true" className="pop flex h-full w-full items-center justify-center text-6xl font-extrabold text-accent">
          {profile.name.split(" ").map((w) => w[0]).join("")}
        </div>
      )}
    </Tilt>
  );
}

export function About() {
  return (
    <Section id="about" title="About me" eyebrow="01 / About">
      <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4 text-lg text-muted">
          {profile.about.map((p) => <p key={p}>{p}</p>)}
        </div>
        <div className="space-y-5">
          <Photo />
          <dl className="grid grid-cols-3 gap-3 lg:grid-cols-1">
            {stats.map((s, i) => (
              <Tilt key={s.label} className="rounded-2xl border-2 border-line bg-surface p-4">
                <dt className="pop text-sm text-muted">{s.label}</dt>
                <dd className={`pop title-3d text-4xl font-extrabold ${GROUP_COLORS[i]}`}><CountUp to={Number(s.value)} /></dd>
              </Tilt>
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
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {skills.map((g, i) => (
          <Tilt key={g.group} className="rounded-2xl border-2 border-line bg-surface p-5">
            <h3 className={`pop mb-3 text-lg font-bold ${GROUP_COLORS[i % GROUP_COLORS.length]}`}>{g.group}</h3>
            <ul className="flex flex-wrap gap-2">
              {g.items.map((item) => (
                <li key={item} className="rounded-full border border-line px-3 py-1 text-sm text-muted">{item}</li>
              ))}
            </ul>
          </Tilt>
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
      className="pop mt-3 inline-flex items-center gap-2 rounded-full border-2 border-accent2 px-3 py-1 text-sm font-bold text-accent2 hover:bg-accent2 hover:text-[var(--btn-text)]"
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
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        {achievements.map((a) => (
          <Tilt
            key={a.title}
            className="rounded-2xl border-2 border-accent3 bg-surface p-5"
            onClick={() => window.open(a.link, "_blank", "noopener,noreferrer")}
          >
            <p className="pop text-sm font-bold uppercase tracking-wide text-accent2">★ Achievement</p>
            <h3 className="pop text-xl font-extrabold">{a.title}</h3>
            <p className="pop text-sm text-muted">{a.detail}</p>
            <a
              href={a.link}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              aria-label={`${a.title}: view on LinkedIn (opens in a new tab)`}
              className="pop mt-3 inline-flex items-center gap-2 rounded-full border-2 border-accent px-3 py-1 text-sm font-bold text-accent hover:bg-accent hover:text-on-accent"
            >
              View on LinkedIn <span aria-hidden="true">↗</span>
            </a>
          </Tilt>
        ))}
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search projects or tech (e.g. Unity, VR)"
          aria-label="Search projects"
          className="rounded-xl border-2 border-line bg-surface px-4 py-2 sm:w-72"
        />
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              aria-pressed={cat === c}
              className={`rounded-full border-2 px-4 py-1 text-sm font-semibold transition ${
                cat === c ? "border-accent bg-accent text-on-accent" : "border-line text-muted hover:border-accent"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-muted sm:ml-auto">
          Order
          <select
            value={order}
            onChange={(e) => setOrder(e.target.value as "featured" | "az")}
            className="rounded-lg border-2 border-line bg-surface px-2 py-1.5 text-fg"
          >
            <option value="featured">Featured first</option>
            <option value="az">A to Z</option>
          </select>
        </label>
      </div>

      <p className="sr-only" role="status">{shown.length} projects shown</p>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((p) => (
          <Tilt
            key={p.title}
            onClick={p.media ? () => setViewing(p.media!) : undefined}
            className={`rounded-2xl border-2 bg-surface p-5 ${p.featured ? "border-accent" : "border-line"}`}
          >
            <p className="pop text-xs font-bold uppercase tracking-wide text-muted">
              {p.featured ? "★ Featured · " : ""}{p.category}
            </p>
            <h3 className="pop mt-1 text-xl font-extrabold">{p.title}</h3>
            <p className="pop mt-1 text-sm font-semibold text-accent">{p.stack}</p>
            <p className="mt-3 text-sm text-muted">{p.summary}</p>
            <ul className="pop mt-4 flex flex-wrap gap-2 text-xs font-semibold text-accent">
              {p.tags.map((t) => <li key={t} className="rounded-full border border-accent/50 px-2 py-0.5">{t}</li>)}
            </ul>
            {p.media && <MediaButton media={p.media} onOpen={setViewing} />}
            {p.play && (
              <a
                href={p.play}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                aria-label={`Play ${p.title} on itch.io (opens in a new tab)`}
                className="pop mr-2 mt-3 inline-flex items-center gap-2 rounded-full border-2 border-accent2 px-3 py-1 text-sm font-bold text-accent2 hover:bg-accent2 hover:text-[var(--btn-text)]"
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
                className="pop mt-3 inline-flex items-center gap-2 rounded-full border-2 border-accent px-3 py-1 text-sm font-bold text-accent hover:bg-accent hover:text-on-accent"
              >
                <span aria-hidden="true">{"</>"}</span> View on GitHub
              </a>
            )}
          </Tilt>
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
      <ol className="space-y-6 border-l-4 border-accent pl-6">
        {timeline.map((t, i) => (
          <li key={t.title} className="relative">
            <span
              className={`absolute -left-[38px] top-5 h-5 w-5 rounded-full border-4 border-bg ${
                ["bg-accent", "bg-accent2"][i % 2]
              }`}
            />
            <Tilt
              className="rounded-2xl border-2 border-line bg-surface p-5"
              max={6}
              onClick={t.media ? () => setViewing(t.media!) : undefined}
            >
              <p className="pop text-sm font-semibold text-muted">{t.period} · {t.type}</p>
              <h3 className="pop text-xl font-extrabold">{t.title}</h3>
              <p className="pop font-semibold text-accent">{t.place}</p>
              <p className="mt-2 max-w-3xl text-sm text-muted">{t.detail}</p>
              {t.media && <MediaButton media={t.media} onOpen={setViewing} />}
            </Tilt>
          </li>
        ))}
      </ol>

      <div className="mt-14 grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="mb-4 text-2xl font-extrabold text-accent">Certificates</h3>
          <ul className="space-y-3">
            {certificates.map((c) => (
              <li key={c.title}>
                <Tilt className="rounded-xl border-2 border-line bg-surface px-4 py-3" max={8}>
                  <p className="pop font-bold">{c.title}</p>
                  <p className="text-sm text-muted">{c.issuer}</p>
                </Tilt>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-4 text-2xl font-extrabold text-accent">Community & activities</h3>
          <Tilt className="rounded-2xl border-2 border-line bg-surface p-5" max={5}>
            <ul className="list-disc space-y-2 pl-5 text-sm text-muted">
              {community.map((c) => <li key={c}>{c}</li>)}
            </ul>
          </Tilt>
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
      <Tilt className="max-w-xl rounded-3xl border-2 border-accent bg-surface p-6" max={4}>
        <ContactForm />
      </Tilt>
      <p className="mt-8 flex flex-wrap gap-4">
        <a className="btn-ghost-3d" href={profile.github} target="_blank" rel="noreferrer">GitHub</a>
        <a className="btn-ghost-3d" href={profile.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
        <a className="btn-ghost-3d" href={profile.itch} target="_blank" rel="noreferrer">itch.io</a>
      </p>
    </Section>
  );
}
