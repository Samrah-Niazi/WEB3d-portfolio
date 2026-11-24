import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Html, useProgress } from "@react-three/drei";
import { useReducedMotion } from "framer-motion";
import Avatar from "./Avatar";
import { usePaletteColors } from "../lib/usePalette";

function LoadingBadge() {
  const { progress } = useProgress();
  return (
    <Html center position={[0, 0, 0]}>
      <div className="whitespace-nowrap rounded-full border border-line bg-black/70 px-4 py-2 text-sm font-semibold text-fg">
        Loading avatar… {Math.round(progress)}%
      </div>
    </Html>
  );
}

// The Blender avatar standing in the spotlight on the About page.
export default function AboutScene({ active = true }: { active?: boolean }) {
  const calm = !!useReducedMotion();
  const { c1, c3 } = usePaletteColors();
  return (
    <Canvas camera={{ position: [0, 0.2, 7.2], fov: 46 }} dpr={[1, 1.5]} frameloop={active ? "always" : "never"} aria-hidden="true">
      <ambientLight intensity={0.55} />
      <directionalLight position={[0, 6, 4]} intensity={2.2} />
      <pointLight position={[-3, 1, 3]} intensity={22} color={c1} />
      <pointLight position={[3, 1, 3]} intensity={18} color={c3} />
      <Suspense fallback={<LoadingBadge />}>
        <Avatar calm={calm} at={[0, -1.55]} boost={1.2} />
      </Suspense>
    </Canvas>
  );
}
