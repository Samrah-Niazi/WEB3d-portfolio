import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, Sparkles } from "@react-three/drei";
import { useReducedMotion } from "framer-motion";
import type { Group } from "three";
import Section from "./Section";
import CountUp from "./CountUp";
import { achievements, certificates, totals } from "../data/profile";
import { useOnScreen } from "../lib/useOnScreen";
import { usePaletteColors } from "../lib/usePalette";

type Bar = { value: number; label: string; note: string };

const MAX_H = 3.0;

// One glossy maroon pillar with a glowing rose cap and halo. It rises from the floor the first time it is seen.
function Pillar({ bar, x, max, grow, calm }: { bar: Bar; x: number; max: number; grow: boolean; calm: boolean }) {
  const body = useRef<Group>(null);
  const cap = useRef<Group>(null);
  const h = useRef(calm ? 1 : 0.001);
  const target = (bar.value / max) * MAX_H;
  const { p1, p3, tint } = usePaletteColors();
  // The number label is a DOM overlay. Mounting it a beat after the pillar avoids a dev-mode StrictMode race that dropped the first label.
  const [labelReady, setLabelReady] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setLabelReady(true), 60);
    return () => window.clearTimeout(t);
  }, []);

  useFrame((_, dt) => {
    if (grow) h.current += (1 - h.current) * Math.min(dt * 2, 1);
    const height = target * h.current;
    if (body.current) body.current.scale.y = Math.max(height, 0.001);
    if (cap.current) cap.current.position.y = height;
  });

  return (
    <group position={[x, 0, 0]}>
      <group ref={body}>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[1.15, 1, 1.15]} />
          <meshStandardMaterial color={p3} emissive={p1} emissiveIntensity={0.6} metalness={0.55} roughness={0.22} />
        </mesh>
      </group>
      <group ref={cap}>
        <mesh>
          <boxGeometry args={[1.2, 0.1, 1.2]} />
          <meshStandardMaterial color={tint} emissive={tint} emissiveIntensity={1.8} />
        </mesh>
        <mesh position={[0, 0.2, 0]}>
          <sphereGeometry args={[0.8, 24, 24]} />
          <meshBasicMaterial color={tint} transparent opacity={0.045} depthWrite={false} />
        </mesh>
        <pointLight position={[0, 0.5, 0]} intensity={6} distance={5} color={tint} />
        {labelReady && (
          <Html center position={[0, 0.75, 0]} distanceFactor={9} zIndexRange={[5, 0]}>
            <span className="select-none text-6xl font-extrabold leading-none" style={{ color: "var(--fg)", textShadow: "0 0 22px color-mix(in srgb, var(--tint) 80%, transparent)" }}>
              {bar.value}
            </span>
          </Html>
        )}
      </group>
    </group>
  );
}

function Scene({ bars, grow, calm }: { bars: Bar[]; grow: boolean; calm: boolean }) {
  const { viewport } = useThree();
  const fit = Math.min(1, viewport.width / 11.5);
  const max = Math.max(...bars.map((b) => b.value));
  const root = useRef<Group>(null);
  const { p2, disc, tint } = usePaletteColors();
  useFrame((state, dt) => {
    if (!root.current || calm) return;
    // slow sway plus a lean toward the pointer
    const t = state.clock.elapsedTime;
    root.current.rotation.y += (Math.sin(t * 0.35) * 0.3 + state.pointer.x * 0.35 - root.current.rotation.y) * Math.min(dt * 2, 1);
  });
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 7, 5]} intensity={1.8} />
      <pointLight position={[-6, 2, 3]} intensity={40} color={p2} />
      <group ref={root} scale={fit} position={[0, -1.7 * fit, 0]}>
        {bars.map((b, i) => (
          <Pillar key={b.label} bar={b} x={(i - (bars.length - 1) / 2) * 2.7} max={max} grow={grow} calm={calm} />
        ))}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]}>
          <circleGeometry args={[8, 64]} />
          <meshStandardMaterial color={disc} metalness={0.6} roughness={0.35} />
        </mesh>
        <gridHelper args={[14, 28, p2, p2]} position={[0, 0.005, 0]} />
        <Sparkles count={70} scale={[11, 5, 4]} size={3.5} speed={calm ? 0 : 0.5} color={tint} position={[0, 2.2, 0]} />
      </group>
    </>
  );
}

export default function Numbers() {
  const calm = !!useReducedMotion();
  const [boxRef, visible] = useOnScreen<HTMLDivElement>("0px");
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (visible) setSeen(true);
  }, [visible]);

  const bars = useMemo<Bar[]>(
    () => [
      { value: totals.projects, label: "Projects built", note: "Including work that was never deployed" },
      { value: totals.games, label: "Game projects", note: "Unity and Unreal" },
      { value: certificates.length, label: "Certificates", note: "Unity, Unreal, pre and post production" },
      { value: achievements.length, label: "Awards", note: "Both at TechFest'26" },
    ],
    [],
  );

  return (
    <Section id="numbers" title="By the numbers" eyebrow="04 / Numbers" tone="page">
      <div ref={boxRef} className="relative -mx-4 h-[24rem] sm:h-[30rem]" aria-hidden="true">
        <Canvas camera={{ position: [0, 2.4, 10.5], fov: 38 }} dpr={[1, 1.5]} frameloop={visible ? "always" : "never"}>
          <Scene bars={bars} grow={seen} calm={calm} />
        </Canvas>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {bars.map((b) => (
          <div key={b.label} className="stat-card card-scope">
            <dd className="impact text-[clamp(3.4rem,8vw,5.5rem)] text-fg"><CountUp to={b.value} /></dd>
            <dt className="relative mt-1 text-sm font-bold uppercase tracking-[0.16em] text-accent">{b.label}</dt>
            <p className="relative mt-1 text-xs text-muted">{b.note}</p>
          </div>
        ))}
      </dl>
    </Section>
  );
}
