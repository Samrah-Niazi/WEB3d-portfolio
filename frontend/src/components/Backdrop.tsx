import { useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import GameShape, { GAME_KINDS } from "./GameShapes";
import { useReducedMotion } from "framer-motion";
import { usePaletteColors } from "../lib/usePalette";

const COUNT = 10;
const DEPTH = 26; // how far the camera travels down while you scroll the whole page

// Deterministic pseudo-random so the layout is the same on every load.
const rand = (i: number, k: number) => {
  const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

function Scene({ calm }: { calm: boolean }) {
  const { viewport } = useThree();
  const { c1, c2, c3 } = usePaletteColors();
  const colors = [c1, c2, c3];
  const shapes = useMemo(
    () =>
      Array.from({ length: COUNT }, (_, i) => ({
        side: i % 2 ? 1 : -1,
        spread: 0.3 + rand(i, 1) * 0.22,
        y: -(i / COUNT) * (DEPTH + 4) + 2,
        z: -1 - rand(i, 2) * 4,
        size: 0.35 + rand(i, 3) * 0.45,
        kind: i % 5,
        speed: 1 + rand(i, 4) * 2,
      })),
    [],
  );

  // The camera follows the scroll position, so the shapes drift past as you read.
  useFrame((state) => {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const t = Math.min(1, window.scrollY / max);
    state.camera.position.y += (-t * DEPTH - state.camera.position.y) * 0.08;
  });

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 6, 5]} intensity={1.5} />
      <pointLight position={[-4, -2, 3]} intensity={30} color={c2} />
      <pointLight position={[4, -6, 3]} intensity={30} color={c1} />
      {shapes.map((s, i) => (
        <Float key={i} speed={calm ? 0 : s.speed} rotationIntensity={calm ? 0 : 0.5} floatIntensity={calm ? 0 : 1.5}>
          <group position={[s.side * s.spread * viewport.width * 1.5, s.y, s.z]} scale={s.size * 0.95} rotation={[0.15, s.side * 0.35, 0]}>
            <GameShape kind={GAME_KINDS[i % GAME_KINDS.length]} color={colors[i % 3]} accent={colors[(i + 1) % 3]} />
          </group>
        </Float>
      ))}
    </>
  );
}

// Fixed full-page 3D layer behind all content.
export default function Backdrop() {
  const calm = !!useReducedMotion();
  return (
    <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }} dpr={1}>
        <Scene calm={calm} />
      </Canvas>
    </div>
  );
}
