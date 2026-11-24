// Slow drifting maroon and grey mist with floating dust, fixed behind all content. CSS only, so it costs no GPU time.
export default function Backdrop() {
  return (
    <div className="fog pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <i className="fog-a" />
      <i className="fog-b" />
      <i className="fog-c" />
      <div className="fog-dust" />
    </div>
  );
}
