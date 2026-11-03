const ITEMS = [
  "Unity", "Unreal Engine", "C#", "C++", "AR / VR", "Vuforia", "Meta Quest", "Blender",
  "After Effects", "Gameplay Programming", "Level Design", "Python", "Node.js", "React", "Three.js",
];

// A slanted ribbon of technologies that scrolls forever. Hover to pause.
export default function Marquee({ compact = false }: { compact?: boolean }) {
  const row = (
    <div className="flex shrink-0 items-center" aria-hidden="true">
      {ITEMS.map((item) => (
        <span key={item} className="flex items-center">
          <span className={`font-display font-bold tracking-wide ${compact ? "px-4 text-base" : "px-6 text-xl sm:text-2xl"}`}>{item}</span>
          <span className="text-accent2">✦</span>
        </span>
      ))}
    </div>
  );

  return (
    <div
      className={
        compact
          ? "marquee relative overflow-hidden rounded-full border-2 border-accent bg-surface py-1.5 backdrop-blur-md"
          : "marquee relative z-10 -mt-6 mb-10 -rotate-1 overflow-hidden border-y-2 border-accent bg-surface py-4 backdrop-blur-md"
      }
      role="presentation"
    >
      <p className="sr-only">Technologies: {ITEMS.join(", ")}.</p>
      <div className="marquee-track">
        {row}
        {row}
      </div>
    </div>
  );
}
