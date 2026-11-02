import { Suspense, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Html, Stars, useProgress } from "@react-three/drei";
import { useReducedMotion } from "framer-motion";
import type { Group } from "three";
import Avatar from "./Avatar";
import GameShape from "./GameShapes";
import { usePaletteColors } from "../lib/usePalette";

// Floating low-poly shapes that drift toward the mouse.
function Shapes({ calm }: { calm: boolean }) {
  const group = useRef<Group>(null);
  const { viewport } = useThree();
  const { c1, c2, c3 } = usePaletteColors();
  const wide = viewport.width > 7;

  useFrame((state, dt) => {
    const g = group.current;
    if (!g || calm) return;
    const k = Math.min(dt * 2, 1);
    g.rotation.y += (state.pointer.x * 0.5 - g.rotation.y) * k;
    g.rotation.x += (-state.pointer.y * 0.3 - g.rotation.x) * k;
    g.position.x += (state.pointer.x * 0.4 - g.position.x) * k;
  });

  return (
    <group ref={group} position={[0, 0, -1]} scale={wide ? 1 : 0.7}>
      <Float speed={calm ? 0 : 2} floatIntensity={1.2}>
        <group position={[wide ? 1.3 : -1.5, wide ? 2.0 : -1.5, 0]} scale={0.7} rotation={[0.2, 0.4, 0.1]}>
          <GameShape kind="gamepad" color={c1} accent={c2} />
        </group>
      </Float>
      <Float speed={calm ? 0 : 3} floatIntensity={2}>
        <group position={[wide ? 2.8 : 1.5, wide ? 1.7 : -1.2, 0.5]} scale={0.7} rotation={[0.1, -0.4, -0.1]}>
          <GameShape kind="clapper" color={c2} accent={c3} />
        </group>
      </Float>
      <Float speed={calm ? 0 : 2.5} floatIntensity={1.6}>
        <group position={[wide ? 0.8 : -1.5, wide ? -0.9 : -3.0, 0.3]} scale={0.6} rotation={[0.1, 0.3, 0]}>
          <GameShape kind="play" color={c3} accent={c1} />
        </group>
      </Float>
      <Float speed={calm ? 0 : 1.8} floatIntensity={1.4}>
        <group position={[wide ? 3.0 : 1.5, wide ? -0.8 : -2.8, -0.4]} scale={0.8} rotation={[0.1, -0.3, 0]}>
          <GameShape kind="heart" color={c2} accent={c3} />
        </group>
      </Float>
    </group>
  );
}

// Shown while the avatar model downloads, so the page never looks stuck.
function LoadingBadge() {
  const { progress } = useProgress();
  return (
    <Html center position={[2.4, -0.5, 0]}>
      <div className="whitespace-nowrap rounded-full border-2 border-accent bg-surface px-4 py-2 text-sm font-bold text-accent">
        Loading avatar… {Math.round(progress)}%
      </div>
    </Html>
  );
}

export default function HeroScene({ active = true }: { active?: boolean }) {
  const calm = !!useReducedMotion();
  const { c1, c2 } = usePaletteColors();
  return (
    <Canvas camera={{ position: [0, 0.4, 6.5], fov: 50 }} dpr={[1, 1.5]} frameloop={active ? "always" : "never"} aria-hidden="true">
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 5, 5]} intensity={1.7} />
      <pointLight position={[-4, 1, 3]} intensity={40} color={c2} />
      <pointLight position={[5, -1, 3]} intensity={40} color={c1} />
      <Stars radius={40} depth={30} count={400} factor={3} fade speed={calm ? 0 : 1} />
      <Shapes calm={calm} />
      <Suspense fallback={<LoadingBadge />}>
        <Avatar calm={calm} />
      </Suspense>
    </Canvas>
  );
}
