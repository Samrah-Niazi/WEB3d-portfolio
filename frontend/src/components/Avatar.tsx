import { useCallback, useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useAnimations, useGLTF } from "@react-three/drei";
import { Box3, LoopOnce, MathUtils, Vector3, type Group, type Mesh } from "three";
import { useAssetStatus } from "../lib/useAsset";
import { usePaletteColors } from "../lib/usePalette";

export const AVATAR_URL = "/models/avatar.glb";
const HEIGHT = 3; // avatar height in scene units; feet sit at y = 0

type Props = { calm: boolean };
// `spin` carries the base's turn angle (radians) while the avatar twirls, so the platform can turn with her.
type SpinProps = Props & { spin: MutableRefObject<number> };

/*
 * Real avatar: the Blender export in public/models/avatar.glb.
 * Clips are matched by name: "Idle" loops (she sits behind a Dell laptop, peeking over it and waving); Hi, Wave, Nod, Cheer,
 * Twirl, Think and Play play once and hand back to Idle. Every move except Hi stands her up for the move.
 * Interaction: drag to spin (she eases back to face you), click or tap to wave, and the
 * "Say hi" button in the hero sends an "avatar-wave" event. User-triggered motion always works;
 * the "reduce motion" setting only turns off the automatic pointer-following.
 */
function GlbAvatar({ calm, spin }: SpinProps) {
  const gltf = useGLTF(AVATAR_URL);
  const root = useRef<Group>(null);
  const { actions, mixer } = useAnimations(gltf.animations, root);
  const drag = useRef({ active: false, moved: 0, lastX: 0, yaw: 0, vel: 0, follow: 0 });
  const gl = useThree((state) => state.gl);
  const hit = useRef(false); // the press started on the avatar itself, so a tap (not a drag) makes her say hi

  // Scale to a fixed height and stand the feet on y = 0, whatever size it was modelled at.
  // The desk, chair and laptop (meshes named Mesh_Desk*) are left out, so she is centered on the base the same way
  // whether she sits or stands.
  const { scale, offset } = useMemo(() => {
    const box = new Box3();
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse((o) => {
      if ((o as Mesh).isMesh && !o.name.startsWith("Mesh_Desk")) box.expandByObject(o);
    });
    const size = box.getSize(new Vector3());
    const s = size.y > 0 ? HEIGHT / size.y : 1;
    return { scale: s, offset: new Vector3(-((box.min.x + box.max.x) / 2) * s, -box.min.y * s, -((box.min.z + box.max.z) / 2) * s) };
  }, [gltf.scene]);

  // Bones that the clips show or hide by scaling them: the console (Play only), the desk and laptop (Idle and Hi only)
  // and the two mouths (soft mouth in Idle, smile otherwise).
  const toggles = useMemo(
    () => ({
      console: gltf.scene.getObjectByName("console"),
      desk: gltf.scene.getObjectByName("desk"),
      mouth: gltf.scene.getObjectByName("mouth"),
      smile: gltf.scene.getObjectByName("smile"),
    }),
    [gltf.scene],
  );

  useEffect(() => {
    actions["Idle"]?.reset().fadeIn(0.4).play();
    window.dispatchEvent(new Event("avatar-ready")); // lets the splash screen lift
  }, [actions]);

  // Plays one named clip, then hands back to Idle. Moves: Wave, Nod, Cheer, Twirl, Think, Play.
  const play = useCallback((name: string) => {
    const clip = actions[name];
    if (!clip || clip.isRunning()) return;
    Object.entries(actions).forEach(([n, a]) => {
      if (a && n !== name && a.isRunning()) a.fadeOut(0.2); // blend to this clip alone, or arms only half-move
    });
    clip.setLoop(LoopOnce, 1);
    clip.reset();
    clip.clampWhenFinished = false;
    clip.fadeIn(0.2).play();
  }, [actions]);

  useEffect(() => {
    const onFinished = (e: { action: unknown }) => {
      if (e.action !== actions["Idle"]) actions["Idle"]?.reset().fadeIn(0.3).play();
    };
    const onWave = () => play(actions["Hi"] ? "Hi" : "Wave"); // "Say hi": the seated hello over the laptop
    const onPlay = (e: Event) => play(String((e as CustomEvent).detail));
    mixer.addEventListener("finished", onFinished as never);
    window.addEventListener("avatar-wave", onWave);
    window.addEventListener("avatar-play", onPlay);
    return () => {
      mixer.removeEventListener("finished", onFinished as never);
      window.removeEventListener("avatar-wave", onWave);
      window.removeEventListener("avatar-play", onPlay);
    };
  }, [mixer, actions, play]);

  useFrame((state, dt) => {
    const g = root.current;
    if (!g) return;
    // Between clips no animation drives these bones, and the mixer falls back to the model's rest pose (everything visible).
    // So pin them every frame, after the mixer has run: the console only while Play is on, the smile only while not idling.
    const running = Object.entries(actions).filter(([, a]) => a?.isRunning() && a.getEffectiveWeight() > 0.01).map(([n]) => n);
    const HIDDEN = 0.001;
    if (!running.includes("Play")) toggles.console?.scale.setScalar(HIDDEN);
    // She sits at the laptop in Idle and Hi; any other move stands her up, and the desk goes away until she sits again.
    const sitting = running.every((n) => n === "Idle" || n === "Hi");
    toggles.desk?.scale.setScalar(sitting ? 1 : HIDDEN);
    const idling = running.every((n) => n === "Idle");
    toggles.mouth?.scale.setScalar(idling ? 1 : HIDDEN);
    toggles.smile?.scale.setScalar(idling ? HIDDEN : 1);
    // While she twirls, report how far round she has turned (the clip eases in and out) so the base can follow.
    const twirl = actions["Twirl"];
    if (twirl?.isRunning()) {
      const start = 1 / 24; // the clip's first keyframe is one frame in
      const p = MathUtils.clamp((twirl.time - start) / (twirl.getClip().duration - start), 0, 1);
      spin.current = p * p * (3 - 2 * p) * Math.PI * 2;
    } else {
      spin.current = 0;
    }
    const d = drag.current;
    if (!d.active) {
      d.yaw += d.vel * dt * 60;
      d.vel *= Math.pow(0.92, dt * 60);
      const home = Math.round(d.yaw / (2 * Math.PI)) * 2 * Math.PI; // ease back to facing the camera
      d.yaw += (home - d.yaw) * Math.min(dt * 1.5, 1);
    }
    const target = d.active || calm ? 0 : state.pointer.x * 0.35;
    d.follow += (target - d.follow) * Math.min(dt * 4, 1);
    g.rotation.y = d.yaw + d.follow;
  });

  // Spin her by dragging anywhere on the 3D area (a small target is hard to hit with a thumb). touch-action "pan-y" keeps
  // vertical swipes scrolling the page, while horizontal swipes turn her.
  useEffect(() => {
    const el = gl.domElement;
    const before = el.style.touchAction;
    el.style.touchAction = "pan-y";
    const down = (e: PointerEvent) => {
      Object.assign(drag.current, { active: true, moved: 0, lastX: e.clientX, vel: 0 });
      el.setPointerCapture?.(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      const d = drag.current;
      if (!d.active) return;
      const dx = e.clientX - d.lastX;
      d.lastX = e.clientX;
      d.moved += Math.abs(dx);
      d.yaw += dx * 0.014;
      d.vel = dx * 0.014;
    };
    const end = (e: PointerEvent, tap: boolean) => {
      const d = drag.current;
      if (!d.active) return;
      d.active = false;
      el.releasePointerCapture?.(e.pointerId);
      if (tap && d.moved < 6 && hit.current) play(actions["Hi"] ? "Hi" : "Wave"); // a tap on her, not a drag
      hit.current = false;
    };
    const up = (e: PointerEvent) => end(e, true);
    const cancel = (e: PointerEvent) => end(e, false); // the browser took the gesture to scroll the page
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", cancel);
    return () => {
      el.style.touchAction = before;
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", cancel);
    };
  }, [gl, actions, play]);

  return (
    <group
      ref={root}
      onPointerDown={() => {
        hit.current = true;
      }}
      onPointerOver={() => (document.body.style.cursor = "grab")}
      onPointerOut={() => {
        if (!drag.current.active) document.body.style.cursor = "";
      }}
    >
      <primitive object={gltf.scene} scale={scale} position={offset} />
    </group>
  );
}

/*
 * Stand-in character built from primitives, shown until avatar.glb exists.
 * It breathes, blinks, looks toward the mouse, and waves with a smile when clicked.
 */
function PlaceholderAvatar({ calm }: Props) {
  const root = useRef<Group>(null);
  const head = useRef<Group>(null);
  const arm = useRef<Group>(null);
  const eyes = useRef<Group>(null);
  const mouth = useRef<Mesh>(null);
  const { c1, c2 } = usePaletteColors();
  const wavingUntil = useRef(0);
  const clicked = useRef(false);

  useEffect(() => {
    const onWave = () => (clicked.current = true);
    window.addEventListener("avatar-wave", onWave);
    return () => window.removeEventListener("avatar-wave", onWave);
  }, []);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    if (clicked.current) {
      clicked.current = false;
      wavingUntil.current = t + 1.8;
    }
    const k = Math.min(dt * 4, 1);
    if (root.current) {
      root.current.position.y = calm ? 0 : Math.sin(t * 2) * 0.03;
      root.current.rotation.y += ((calm ? 0 : state.pointer.x * 0.4) - root.current.rotation.y) * k;
    }
    if (head.current && !calm) {
      head.current.rotation.y += (state.pointer.x * 0.5 - head.current.rotation.y) * k;
      head.current.rotation.x += (-state.pointer.y * 0.3 - head.current.rotation.x) * k;
    }
    if (eyes.current) {
      const blink = !calm && t % 4 < 0.12 ? 0.1 : 1;
      eyes.current.scale.y = MathUtils.lerp(eyes.current.scale.y, blink, 0.6);
    }
    const waving = t < wavingUntil.current;
    if (arm.current) {
      const target = waving ? 2.6 + Math.sin(t * 12) * 0.35 : 0.15;
      arm.current.rotation.z = MathUtils.lerp(arm.current.rotation.z, -target, k);
    }
    if (mouth.current) {
      mouth.current.scale.set(waving ? 1.5 : 1, waving ? 1.6 : 1, 1);
    }
  });

  const skin = "#e8b998";
  return (
    <group
      ref={root}
      onClick={(e) => {
        e.stopPropagation();
        clicked.current = true;
      }}
      onPointerOver={() => (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "")}
    >
      {/* legs + torso */}
      <mesh position={[0, 0.5, 0]}>
        <capsuleGeometry args={[0.32, 0.6, 6, 12]} />
        <meshStandardMaterial color={c1} roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.4, 0]}>
        <capsuleGeometry args={[0.42, 0.55, 8, 16]} />
        <meshStandardMaterial color={c2} roughness={0.4} />
      </mesh>
      {/* left arm (static) */}
      <mesh position={[-0.62, 1.35, 0]} rotation={[0, 0, 0.15]}>
        <capsuleGeometry args={[0.11, 0.6, 6, 10]} />
        <meshStandardMaterial color={skin} roughness={0.7} />
      </mesh>
      {/* right arm pivots at the shoulder to wave */}
      <group ref={arm} position={[0.55, 1.75, 0]}>
        <mesh position={[0.1, -0.35, 0]}>
          <capsuleGeometry args={[0.11, 0.6, 6, 10]} />
          <meshStandardMaterial color={skin} roughness={0.7} />
        </mesh>
      </group>
      {/* head */}
      <group ref={head} position={[0, 2.35, 0]}>
        <mesh>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial color={skin} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.08, -0.04]} scale={[1.06, 1.02, 1.04]}>
          <sphereGeometry args={[0.5, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          <meshStandardMaterial color="#1f1b2e" roughness={0.8} />
        </mesh>
        <group ref={eyes} position={[0, 0.02, 0.46]}>
          {[-0.17, 0.17].map((x) => (
            <mesh key={x} position={[x, 0, 0]}>
              <sphereGeometry args={[0.06, 16, 16]} />
              <meshStandardMaterial color="#1f1b2e" />
            </mesh>
          ))}
        </group>
        <mesh ref={mouth} position={[0, -0.14, 0.46]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.08, 0.018, 8, 16, Math.PI]} />
          <meshStandardMaterial color="#9f1239" />
        </mesh>
      </group>
    </group>
  );
}

// Glowing ring and disc under the avatar's feet.
// Clicking it starts the twirl; the whole base turns with her.
function Platform({ calm, spin }: SpinProps) {
  const { c2, c3, disc } = usePaletteColors();
  const ring = useRef<Group>(null);
  const turntable = useRef<Group>(null);
  useFrame((_, dt) => {
    if (ring.current && !calm) ring.current.rotation.z += dt * 0.8;
    if (turntable.current) turntable.current.rotation.z = spin.current;
  });
  return (
    <group
      position={[0, -0.05, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      onClick={(e) => {
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent("avatar-play", { detail: "Twirl" }));
      }}
      onPointerOver={() => (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "")}
    >
      <group ref={turntable}>
      <mesh>
        <circleGeometry args={[1.3, 48]} />
        <meshStandardMaterial color={disc} metalness={0.3} roughness={0.4} />
      </mesh>
      {/* markers around the edge make the turning base easy to see */}
      {Array.from({ length: 9 }, (_, i) => {
        const a = (i / 9) * Math.PI * 2;
        const north = i === 0; // one bigger white marker so a partial turn is easy to see
        const col = north ? "#ffffff" : i % 3 === 1 ? c3 : c2;
        return (
          <mesh key={i} position={[Math.cos(a) * 1.0, Math.sin(a) * 1.0, 0.015]} rotation={[0, 0, a]}>
            <boxGeometry args={north ? [0.4, 0.13, 0.04] : [0.22, 0.07, 0.03]} />
            <meshStandardMaterial color={col} emissive={col} emissiveIntensity={north ? 0.8 : 0.5} />
          </mesh>
        );
      })}
      <group ref={ring} position={[0, 0, 0.02]}>
        <mesh>
          <torusGeometry args={[1.25, 0.05, 12, 64]} />
          <meshStandardMaterial color={c2} emissive={c2} emissiveIntensity={0.9} />
        </mesh>
        <mesh position={[1.25, 0, 0]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color={c3} emissive={c3} emissiveIntensity={1.2} />
        </mesh>
      </group>
      </group>
    </group>
  );
}

// `at` overrides where she stands ([x, y] in scene units); by default she stands to the right on wide screens.
export default function Avatar({ calm, at, boost = 1, narrowBoost }: Props & { at?: [number, number]; boost?: number; narrowBoost?: number }) {
  const modelStatus = useAssetStatus(AVATAR_URL); // null while checking, so the stand-in never flashes
  const { viewport } = useThree();
  const wide = viewport.width > 7;
  // `narrowBoost` is the size multiplier on phones (it defaults to `boost`)
  const s = (wide ? 1 : 0.7) * (wide ? boost : (narrowBoost ?? boost));
  const spin = useRef(0);

  return (
    <group position={at ? [at[0], at[1], 0] : [wide ? 2.4 : 0, wide ? -1.9 : -2.5, 0]} scale={s}>
      <Platform calm={calm} spin={spin} />
      {modelStatus === true && <GlbAvatar calm={calm} spin={spin} />}
      {modelStatus === false && <PlaceholderAvatar calm={calm} />}
    </group>
  );
}
