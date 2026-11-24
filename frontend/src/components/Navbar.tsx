import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import ThemeToggle from "./ThemeToggle";
import PalettePicker from "./PalettePicker";
import { profile } from "../data/profile";

const links = ["about", "video", "skills", "projects", "experience", "contact", "gallery"];

// Highlights the link for the section currently in view.
function useActiveSection() {
  const [active, setActive] = useState("");
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-40% 0px -55% 0px" },
    );
    links.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    // At the very bottom the last section can't reach the middle of the screen, so pick it explicitly.
    const onScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 8) setActive(links[links.length - 1]);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);
  return active;
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const active = useActiveSection();
  const initials = profile.name.split(" ").map((w) => w[0]).join("");

  return (
    <header className="fixed inset-x-0 top-3 z-40 flex justify-center px-3">
      <nav aria-label="Main" className="glass relative flex w-full max-w-5xl items-center justify-between gap-3 rounded-full px-3 py-2">
        <a href="#home" className="flex items-center gap-2.5 pl-1" aria-label={`${profile.name}, back to top`}>
          <span className="font-display grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-accent to-accent2 text-sm font-bold text-on-accent shadow-md">
            {initials}
          </span>
          <span className="font-display hidden whitespace-nowrap text-lg font-bold tracking-tight lg:block">{profile.name}</span>
        </a>

        <ul className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <li key={l}>
              <a
                href={`#${l}`}
                aria-current={active === l ? "true" : undefined}
                className={`relative isolate block rounded-full px-3 py-1.5 text-sm font-semibold capitalize transition-colors ${
                  active === l ? "text-accent" : "text-muted hover:text-fg"
                }`}
              >
                {active === l && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-accent/15 ring-1 ring-accent/40"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                {l}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 md:flex">
          <PalettePicker />
          <div className="theme-toggle"><ThemeToggle /></div>
        </div>

        <button
          className="rounded-full border border-line px-4 py-1.5 text-sm font-semibold md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen(!open)}
        >
          {open ? "Close" : "Menu"}
        </button>

        {open && (
          <ul id="mobile-menu" className="glass absolute inset-x-0 top-full mt-2 flex flex-col gap-1 rounded-3xl p-3 md:hidden">
            {links.map((l) => (
              <li key={l}>
                <a
                  href={`#${l}`}
                  onClick={() => setOpen(false)}
                  aria-current={active === l ? "true" : undefined}
                  className={`block rounded-xl px-3 py-2 font-semibold capitalize ${active === l ? "bg-accent/15 text-accent" : "text-muted"}`}
                >
                  {l}
                </a>
              </li>
            ))}
            <li className="flex items-center gap-2 px-1 pt-2">
              <PalettePicker />
              <div className="theme-toggle"><ThemeToggle /></div>
            </li>
          </ul>
        )}
      </nav>
    </header>
  );
}
