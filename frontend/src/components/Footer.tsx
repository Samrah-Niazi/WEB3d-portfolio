import { profile } from "../data/profile";

const links = [
  { label: "GitHub", href: profile.github },
  { label: "LinkedIn", href: profile.linkedin },
  { label: "itch.io", href: profile.itch },
  { label: "Email", href: `mailto:${profile.email}` },
];

export default function Footer() {
  return (
    <footer className="relative mt-10 border-t-2 border-accent bg-surface backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-12 text-center">
        <p className="font-display gradient-text text-3xl font-bold">{profile.name}</p>
        <p className="max-w-md text-muted">Game developer building worlds in Unity and Unreal, from gameplay to AR and VR.</p>
        <ul className="flex flex-wrap justify-center gap-3">
          {links.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                target={l.href.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                className="glass rounded-full px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5 hover:border-accent"
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
