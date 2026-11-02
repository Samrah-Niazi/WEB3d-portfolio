import { useMemo } from "react";
import { RoundedBox } from "@react-three/drei";
import { BoxGeometry, Shape } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

// Floating decoration themed around games, film and animation. Each shape is about 1.5 units wide,
// built from simple primitives so it stays light. `color` is the main body, `accent` the highlights.
export const GAME_KINDS = ["gamepad", "clapper", "reel", "play", "joystick", "heart", "handheld", "star"] as const;
export type GameKind = (typeof GAME_KINDS)[number];

type Colors = { color: string; accent: string };
const DARK = "#1c1b2e";
const LIGHT = "#ffffff";

const Mat = ({ c, r = 0.45, m = 0.15 }: { c: string; r?: number; m?: number }) => (
  <meshStandardMaterial color={c} roughness={r} metalness={m} />
);

function Gamepad({ color, accent }: Colors) {
  return (
    <group>
      <RoundedBox args={[1.5, 0.62, 0.3]} radius={0.22} smoothness={2}><Mat c={color} /></RoundedBox>
      {[-1, 1].map((s) => (
        <RoundedBox key={s} args={[0.42, 0.72, 0.3]} radius={0.18} smoothness={2} position={[s * 0.62, -0.38, 0]} rotation={[0, 0, s * 0.35]}>
          <Mat c={color} />
        </RoundedBox>
      ))}
      <group position={[-0.45, 0.05, 0.16]}>
        <mesh><boxGeometry args={[0.32, 0.1, 0.06]} /><Mat c={DARK} /></mesh>
        <mesh><boxGeometry args={[0.1, 0.32, 0.06]} /><Mat c={DARK} /></mesh>
      </group>
      {[[0, 0.13], [0, -0.13], [-0.13, 0], [0.13, 0]].map(([x, y], i) => (
        <mesh key={i} position={[0.45 + x, 0.05 + y, 0.17]}>
          <sphereGeometry args={[0.065, 10, 8]} />
          <Mat c={i === 0 ? accent : LIGHT} />
        </mesh>
      ))}
      {[-0.17, 0.17].map((x) => (
        <mesh key={x} position={[x, -0.14, 0.16]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.085, 0.085, 0.08, 12]} />
          <Mat c={DARK} />
        </mesh>
      ))}
    </group>
  );
}

function Clapper({ color, accent }: Colors) {
  return (
    <group>
      <RoundedBox args={[1.4, 0.9, 0.12]} radius={0.04} position={[0, -0.12, 0]}><Mat c={DARK} /></RoundedBox>
      {[-0.3, -0.05, 0.2].map((y, i) => (
        <mesh key={y} position={[-0.1 + i * 0.05, y - 0.08, 0.07]}><boxGeometry args={[0.8 - i * 0.2, 0.06, 0.02]} /><Mat c={LIGHT} /></mesh>
      ))}
      {/* the clapper stick, hinged at the left and slightly open */}
      <group position={[-0.7, 0.36, 0]} rotation={[0, 0, 0.22]}>
        <group position={[0.7, 0.11, 0]}>
          <RoundedBox args={[1.4, 0.22, 0.14]} radius={0.03}><Mat c={DARK} /></RoundedBox>
          {[-0.55, -0.27, 0.01, 0.29, 0.57].map((x, i) => (
            <mesh key={x} position={[x, 0, 0.075]} rotation={[0, 0, 0.6]}>
              <boxGeometry args={[0.12, 0.3, 0.02]} />
              <Mat c={i % 2 ? accent : color} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}

function Reel({ color, accent }: Colors) {
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.66, 0.66, 0.16, 28]} /><Mat c={color} /></mesh>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2 + Math.PI / 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.4, Math.sin(a) * 0.4, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.13, 0.13, 0.17, 12]} />
            <Mat c={DARK} />
          </mesh>
        );
      })}
      <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.11, 0.11, 0.22, 12]} /><Mat c={accent} /></mesh>
    </group>
  );
}

function PlayButton({ color, accent }: Colors) {
  const tri = useMemo(() => {
    const s = new Shape();
    s.moveTo(-0.17, -0.3);
    s.lineTo(0.34, 0);
    s.lineTo(-0.17, 0.3);
    s.closePath();
    return s;
  }, []);
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.7, 0.7, 0.2, 28]} /><Mat c={color} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.7, 0.05, 8, 32]} /><Mat c={accent} /></mesh>
      <mesh position={[0, 0, 0.1]}>
        <extrudeGeometry args={[tri, { depth: 0.08, bevelEnabled: false }]} />
        <Mat c={LIGHT} />
      </mesh>
    </group>
  );
}

function Joystick({ color, accent }: Colors) {
  return (
    <group>
      <RoundedBox args={[1.1, 0.3, 0.9]} radius={0.1} position={[0, -0.45, 0]}><Mat c={color} /></RoundedBox>
      <mesh position={[0, -0.05, 0]}><cylinderGeometry args={[0.07, 0.07, 0.8, 10]} /><Mat c={DARK} /></mesh>
      <mesh position={[0, 0.45, 0]}><sphereGeometry args={[0.26, 14, 12]} /><Mat c={accent} r={0.3} /></mesh>
      {[-0.28, 0.28].map((x) => (
        <mesh key={x} position={[x, -0.28, 0.32]}><cylinderGeometry args={[0.09, 0.09, 0.08, 12]} /><Mat c={LIGHT} /></mesh>
      ))}
    </group>
  );
}

// 8-bit pixel heart, merged into three meshes (one per color) so it costs three draw calls
const HEART = ["0110110", "1111111", "1111111", "0111110", "0011100", "0001000"];
function PixelHeart({ color, accent }: Colors) {
  const [a, b, c] = useMemo(() => {
    const groups: BoxGeometry[][] = [[], [], []];
    HEART.forEach((row, r) =>
      [...row].forEach((cell, col) => {
        if (cell !== "1") return;
        const g = new BoxGeometry(0.17, 0.17, 0.17);
        g.translate((col - 3) * 0.19, (2.5 - r) * 0.19, 0);
        groups[r === 0 && col === 1 ? 2 : r % 2 ? 0 : 1].push(g);
      }),
    );
    return groups.map((list) => mergeGeometries(list));
  }, []);
  return (
    <group>
      <mesh geometry={a}><Mat c={color} r={0.4} /></mesh>
      <mesh geometry={b}><Mat c={accent} r={0.4} /></mesh>
      <mesh geometry={c}><Mat c={LIGHT} r={0.4} /></mesh>
    </group>
  );
}

function Handheld({ color, accent }: Colors) {
  return (
    <group>
      <RoundedBox args={[0.95, 1.5, 0.28]} radius={0.12} smoothness={2}><Mat c={color} /></RoundedBox>
      <mesh position={[0, 0.34, 0.15]}><boxGeometry args={[0.66, 0.54, 0.03]} /><Mat c={DARK} /></mesh>
      <mesh position={[0, 0.34, 0.17]}>
        <boxGeometry args={[0.54, 0.42, 0.01]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.6} />
      </mesh>
      <group position={[-0.25, -0.38, 0.15]}>
        <mesh><boxGeometry args={[0.3, 0.09, 0.05]} /><Mat c={DARK} /></mesh>
        <mesh><boxGeometry args={[0.09, 0.3, 0.05]} /><Mat c={DARK} /></mesh>
      </group>
      {[[0.2, -0.33], [0.34, -0.46]].map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0.15]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.05, 12]} />
          <Mat c={i ? accent : LIGHT} />
        </mesh>
      ))}
    </group>
  );
}

function Star({ color, accent }: Colors) {
  const star = useMemo(() => {
    const s = new Shape();
    for (let i = 0; i < 10; i++) {
      const a = Math.PI / 2 + (i * Math.PI) / 5;
      const rad = i % 2 ? 0.3 : 0.7;
      const x = Math.cos(a) * rad;
      const y = Math.sin(a) * rad;
      if (i) s.lineTo(x, y);
      else s.moveTo(x, y);
    }
    s.closePath();
    return s;
  }, []);
  return (
    <group>
      <mesh position={[0, 0, -0.1]}>
        <extrudeGeometry args={[star, { depth: 0.2, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 2 }]} />
        <Mat c={color} r={0.3} m={0.3} />
      </mesh>
      <mesh position={[0, 0, 0.17]} scale={0.55}>
        <extrudeGeometry args={[star, { depth: 0.03, bevelEnabled: false }]} />
        <Mat c={accent} />
      </mesh>
    </group>
  );
}

const SHAPES: Record<GameKind, (p: Colors) => React.JSX.Element> = {
  gamepad: Gamepad,
  clapper: Clapper,
  reel: Reel,
  play: PlayButton,
  joystick: Joystick,
  heart: PixelHeart,
  handheld: Handheld,
  star: Star,
};

export default function GameShape({ kind, color, accent }: { kind: GameKind } & Colors) {
  const Component = SHAPES[kind];
  return <Component color={color} accent={accent} />;
}
