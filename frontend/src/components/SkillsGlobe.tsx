import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import { useReducedMotion } from "framer-motion";
import type { Group } from "three";
import { skills } from "../data/profile";
import { usePaletteColors } from "../lib/usePalette";
import { useOnScreen } from "../lib/useOnScreen";

const RADIUS = 3.4;

// Every distinct skill becomes a label placed evenly on a sphere (Fibonacci spiral).
function useWords(colors: string[]) {
  return useMemo(() => {
    const seen = new Set<string>();
    const list: { label: string; color: string }[] = [];
    skills.forEach((g, gi) =>
      g.items.forEach((label) => {
        if (!seen.has(label)) {
          seen.add(label);
          list.push({ label, color: colors[gi % colors.length] });
        }
      }),
    );
    const golden = Math.PI * (3 - Math.sqrt(5));
    return list.map((w, i) => {
      const y = 1 - (i / (list.length - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const a = i * golden;
      return { ...w, pos: [Math.cos(a) * r * RADIUS, y * RADIUS, Math.sin(a) * r * RADIUS] as [number, number, number] };
    });
  }, [colors[0], colors[1]]); // eslint-disable-line react-hooks/exhaustive-deps
}

function Globe({ calm }: { calm: boolean }) {
  const group = useRef<Group>(null);
  const { c1, c2, label1, label2 } = usePaletteColors();
  const words = useWords([label1, label2]);
  useFrame((_, dt) => {
    if (group.current && !calm) group.current.rotation.y += dt * 0.18;
  });

  return (
    <group ref={group}>
      <mesh>
        <icosahedronGeometry args={[RADIUS * 0.92, 2]} />
        <meshBasicMaterial color={c1} wireframe transparent opacity={0.45} />
      </mesh>
      <mesh scale={0.55}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color={c2} emissive={c2} emissiveIntensity={0.4} flatShading />
      </mesh>
      {words.map((w) => (
        <Html key={w.label} position={w.pos} center distanceFactor={8.5}>
          <span
            style={{ color: w.color, borderColor: w.color }}
            className="select-none whitespace-nowrap rounded-full border-2 bg-white/90 px-3 py-1 text-sm font-bold shadow-md"
          >
            {w.label}
          </span>
        </Html>
      ))}
    </group>
  );
}

// A draggable 3D sphere of skills. The skill cards below carry the same information as text.
export default function SkillsGlobe() {
  const calm = !!useReducedMotion();
  const { c2 } = usePaletteColors();
  const [boxRef, visible] = useOnScreen<HTMLDivElement>();
  return (
    <div ref={boxRef} className="relative mb-10 h-[26rem] sm:h-[32rem]" aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 9.5], fov: 50 }} dpr={[1, 1.5]} frameloop={visible ? "always" : "never"}>
        <ambientLight intensity={0.8} />
        <pointLight position={[5, 5, 5]} intensity={40} color={c2} />
        <Globe calm={calm} />
        <OrbitControls enableZoom={false} enablePan={false} rotateSpeed={0.8} />
      </Canvas>
      <p className="pointer-events-none absolute bottom-1 left-0 right-0 text-center text-xs text-muted">
        Drag to spin
      </p>
    </div>
  );
}
