import { profile } from "../data/profile";

const links = [
  { label: "GitHub", href: profile.github },
  { label: "LinkedIn", href: profile.linkedin },
  { label: "itch.io", href: profile.itch },
  { label: "Email", href: `mailto:${profile.email}` },
];

export default function Footer() {
  return (
    <footer className="dark-scope relative overflow-hidden border-t border-line" style={{ background: "var(--footer-bg)" }}>
      <p aria-hidden="true" className="ghost-year left-0 right-0 top-8 text-center text-[11vw] tracking-[0.04em]">{profile.name}</p>
      <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-7 px-4 pb-12 pt-32 text-center sm:pt-44">
        <p className="heading text-4xl text-fg sm:text-5xl">{profile.name}</p>
        <p className="max-w-md text-muted">Game developer building worlds in Unity and Unreal, from gameplay to AR and VR.</p>
        <ul className="flex flex-wrap justify-center gap-3">
          {links.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                target={l.href.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                className="glass rounded-full px-5 py-2 text-sm font-semibold transition hover:-translate-y-0.5 hover:border-accent"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="btn-ghost-3d !px-5 !py-2 text-sm"
        >
          Back to top ↑
        </button>
        <p className="text-sm text-muted">
          © {new Date().getFullYear()} {profile.name}. Built with React, Three.js, Blender and Node.js.
        </p>
      </div>
    </footer>
  );
}
