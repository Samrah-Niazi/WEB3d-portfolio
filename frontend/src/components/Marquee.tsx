const ITEMS = [
  "Unity", "Unreal Engine", "C#", "C++", "AR / VR", "Vuforia", "Meta Quest", "Blender",
  "After Effects", "Gameplay Programming", "Level Design", "Python", "Node.js", "React", "Three.js",
];

// A slanted ribbon of technologies that scrolls forever. Hover to pause.
export default function Marquee() {
  const row = (
    <div className="flex shrink-0 items-center" aria-hidden="true">
      {ITEMS.map((item) => (
        <span key={item} className="flex items-center">
          <span className="font-display px-6 text-xl font-bold tracking-wide sm:text-2xl">{item}</span>
          <span className="text-accent2">✦</span>
        </span>
      ))}
    </div>
  );

  return (
    <div className="marquee relative z-10 -mt-6 mb-10 -rotate-1 overflow-hidden border-y-2 border-accent bg-surface py-4 backdrop-blur-md" role="presentation">
      <p className="sr-only">Technologies: {ITEMS.join(", ")}.</p>
      <div className="marquee-track">
        {row}
        {row}
      </div>
    </div>
  );
}
