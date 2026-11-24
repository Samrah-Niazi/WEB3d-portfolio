import { profile } from "./profile";

export type GalleryItem = {
  id: string;
  src: string;
  alt: string;
  category: string;
  source: "itch.io" | "LinkedIn" | "Portfolio";
  href?: string; // where the image comes from (none for your own uploads)
};

// Every image under src/assets/gallery is picked up automatically:
//   itch/<game-slug>/NN.webp   the best screenshot of each game, from its itch.io page
//   linkedin/<name>.<ext>      pictures saved from LinkedIn posts (they appear under "Achievements")
//   <project-name>/<file>      your own pictures: the folder name becomes the filter, e.g. spikes-rush/1.jpg
const files = import.meta.glob("../assets/gallery/**/*.{webp,jpg,jpeg,png}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const GAMES: Record<string, { title: string; href: string }> = {
  "the-unbroken-oath": { title: "The Unbroken Oath", href: "https://samrah-niazi.itch.io/the-unbroken-oath" },
  "the-abduction": { title: "The Abduction", href: "https://samrah-niazi.itch.io/the-abduction" },
  "warp-fractured-reality": { title: "Warp: Fractured Reality", href: "https://samrah-niazi.itch.io/warp-fractured-reality" },
  "super-jump": { title: "Super Jump", href: "https://samrah-niazi.itch.io/super-jump" },
};

// What each screenshot shows, for screen readers and captions.
const ALT: Record<string, string> = {
  "the-unbroken-oath/01": "Morning outside the temple, with the minimap and rifle HUD",
  "the-abduction/01": "Exploring a hall in the asylum while guards patrol",
  "warp-fractured-reality/01": "Two-player split screen in the warp tunnel",
  "super-jump/01": "A platformer level with coins and a night city skyline",
};

// LinkedIn pictures are matched to a post by file name: "runner-up*" / "gamecon*" or "fydp*" / "winner*" / "taleem*".
function linkedinHref(name: string): string {
  if (/runner|gamecon/i.test(name)) return "https://lnkd.in/p/dyt3bmSK";
  if (/fydp|winner|taleem/i.test(name)) return "https://lnkd.in/p/ddcBM9Kg";
  return profile.linkedin;
}

const pretty = (s: string) => s.replace(/[-_]+/g, " ").replace(/\.[a-z]+$/i, "").trim();

// Folder names that need special capitalisation when used as a filter label.
const LABELS: Record<string, string> = {
  taleem360: "TALEEM360",
  "vr-escape-room": "VR Escape Room",
  "ai-code-mentor": "AI Code Mentor",
  "spikes-rush": "Spikes Rush",
  "spot-the-difference": "Spot the Difference",
  "ned-masters-admissions-portal": "NED Masters Admissions Portal",
  "cyber-cafe-management-system": "Cyber Cafe Management System",
};
const titleCase = (s: string) => pretty(s).replace(/\b\w/g, (c) => c.toUpperCase());

export const isAward = (i: GalleryItem) => /gamecon|award|winner|runner/i.test(i.id);

export const galleryItems: GalleryItem[] = Object.entries(files)
  .map(([path, src]): GalleryItem | null => {
    const parts = path.split("/assets/gallery/")[1].split("/");
    if (parts[0] === "itch" && parts.length === 3) {
      const slug = parts[1];
      const game = GAMES[slug];
      const n = parts[2].replace(/\.[a-z]+$/i, "");
      if (!game) return null;
      return {
        id: `${slug}/${n}`,
        src,
        alt: ALT[`${slug}/${n}`] ?? `${game.title} screenshot ${Number(n)}`,
        category: game.title,
        source: "itch.io",
        href: game.href,
      };
    }
    if (parts[0] === "linkedin") {
      const file = parts[parts.length - 1];
      return {
        id: `linkedin/${file}`,
        src,
        alt: /whatsapp|^img|^\d/i.test(pretty(file)) ? "Achievement photo from LinkedIn" : pretty(file),
        category: "Achievements",
        source: "LinkedIn",
        href: linkedinHref(file),
      };
    }
    if (parts.length === 2 && parts[0] !== "itch") {
      const folder = parts[0];
      const file = parts[1];
      const label = LABELS[folder.toLowerCase()] ?? titleCase(folder);
      return {
        id: `${folder}/${file}`,
        src,
        alt: `${label}: ${pretty(file)}`,
        category: label,
        source: "Portfolio",
      };
    }
    return null;
  })
  .filter((x): x is GalleryItem => x !== null)
  .sort((a, b) => {
    // The award photos come first, then the other LinkedIn pictures, then game screenshots and the rest.
    const rank = (i: GalleryItem) => (isAward(i) ? 0 : i.source === "LinkedIn" || i.category === "Achievements" ? 1 : 2);
    return rank(a) - rank(b) || a.id.localeCompare(b.id, undefined, { numeric: true });
  });

