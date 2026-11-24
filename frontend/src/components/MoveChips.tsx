const MOVES = [
  { name: "Twirl", icon: "💃" },
  { name: "Cheer", icon: "🎉" },
  { name: "Nod", icon: "🙂" },
  { name: "Think", icon: "🤔" },
  { name: "Play", icon: "🎮" },
];

// "Try a move" chips and the "Say hi" button: they send events the avatar listens for.
export default function MoveChips({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <button
        type="button"
        className="rounded-full border border-fg/40 bg-fg px-3.5 py-1 text-sm font-semibold text-bg transition hover:bg-accent"
        onClick={() => window.dispatchEvent(new Event("avatar-wave"))}
      >
        <span aria-hidden="true">👋</span> Say hi
      </button>
      <span className="text-sm text-muted">Try a move:</span>
      {MOVES.map((m) => (
        <button
          key={m.name}
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("avatar-play", { detail: m.name }))}
          className="glass rounded-full px-3 py-1 text-sm font-semibold transition hover:border-accent"
        >
          <span aria-hidden="true">{m.icon}</span> {m.name}
        </button>
      ))}
    </div>
  );
}
