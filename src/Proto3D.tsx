import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  Series,
  useCurrentFrame,
} from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { Character3D } from "./three/Character3D";
import { Prison3D } from "./three/Prison3D";
import { denahMiniTexture } from "./three/textures";
import { SHOT_FRAMES } from "./Proto";
import {
  DenahCard,
  LocationBanner,
  SpeechBubble,
  Stamp,
  TimePill,
} from "./Graphics";

/**
 * Varian 3D dari prototipe "Gimana Kalau?": adegan three.js (@remotion/three)
 * dengan kamera 3D sungguhan (dolly/pan/orbit + parallax), sedangkan overlay
 * grafis 2D (banner, stempel, pill, balon, kartu denah) tetap dari Graphics.tsx.
 * 9 shot x 90 frame = 810 frame, 1280x720, 30fps, silent — alur sama seperti 2D.
 */

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Progres shot 0..1 dengan easing in-out kubik — dipakai kamera & gerak tokoh agar sinkron. */
const easeT = (frame: number) =>
  interpolate(frame, [0, SHOT_FRAMES - 1], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });

type CamPose = { pos: [number, number, number]; look: [number, number, number] };

/** Menggerakkan kamera three.js per frame Remotion: interpolasi posisi + lookAt. */
const CameraRig: React.FC<{ from: CamPose; to: CamPose }> = ({ from, to }) => {
  const frame = useCurrentFrame();
  const camera = useThree((s) => s.camera);
  const t = easeT(frame);
  camera.position.set(
    lerp(from.pos[0], to.pos[0], t),
    lerp(from.pos[1], to.pos[1], t),
    lerp(from.pos[2], to.pos[2], t),
  );
  camera.lookAt(
    lerp(from.look[0], to.look[0], t),
    lerp(from.look[1], to.look[1], t),
    lerp(from.look[2], to.look[2], t),
  );
  return null;
};

const DayLights: React.FC = () => (
  <>
    <hemisphereLight args={["#fff3da", "#5a6673", 0.85]} />
    <ambientLight intensity={0.25} />
    <directionalLight position={[5, 7, 6]} intensity={1.15} />
    <directionalLight position={[-6, 4, 2]} intensity={0.3} />
  </>
);

const NightLights: React.FC = () => (
  <>
    <hemisphereLight args={["#33507a", "#0c1420", 0.55]} />
    <directionalLight position={[5, 7, 6]} intensity={0.08} />
  </>
);

const Canvas3D: React.FC<{ night?: boolean; children: React.ReactNode }> = ({
  night = false,
  children,
}) => (
  <ThreeCanvas
    width={1280}
    height={720}
    camera={{ fov: 38, near: 0.1, far: 100, position: [0, 1.7, 8] }}
  >
    <color attach="background" args={[night ? "#232c3d" : "#a8a294"]} />
    {night ? <NightLights /> : <DayLights />}
    <Prison3D night={night} />
    {children}
  </ThreeCanvas>
);

/** S1 — Wide koridor, dolly maju: tahanan jalan masuk diantar sipir, banner lokasi pop. */
const Shot1: React.FC = () => {
  const frame = useCurrentFrame();
  const t = easeT(frame);
  const px = lerp(-2.8, -0.3, t);
  return (
    <AbsoluteFill>
      <Canvas3D>
        <CameraRig
          from={{ pos: [0, 1.75, 8.8], look: [0, 1.0, -0.8] }}
          to={{ pos: [0.5, 1.65, 7.6], look: [0.3, 1.0, -0.8] }}
        />
        <Character3D outfit="tahanan" walking position={[px, 0, -0.7]} rotationY={0.12} />
        <Character3D outfit="sipir" walking blinkOffset={40} position={[px + 1.75, 0, -0.3]} rotationY={0.12} />
      </Canvas3D>
      <LocationBanner text="LAPAS BATU HITAM" delay={12} style={{ left: 36, top: 30 }} />
    </AbsoluteFill>
  );
};

/** S2 — Medium depan sel C-07: stempel hukuman menghantam layar + guncangan frame. */
const Shot2: React.FC = () => {
  const frame = useCurrentFrame();
  const shakeT = frame >= 24 && frame <= 34 ? 34 - frame : 0;
  const sx = shakeT ? Math.sin(frame * 2.3) * shakeT * 0.8 : 0;
  const sy = shakeT ? Math.cos(frame * 2.9) * shakeT * 0.6 : 0;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", inset: 0, transform: `translate(${sx}px, ${sy}px)` }}>
        <Canvas3D>
          <CameraRig
            from={{ pos: [0.7, 1.5, 4.6], look: [0.35, 1.05, -1.5] }}
            to={{ pos: [0.6, 1.45, 4.0], look: [0.35, 1.05, -1.5] }}
          />
          <Character3D outfit="tahanan" expression="kaget" position={[0, 0, -1.25]} rotationY={0.05} />
          <Character3D outfit="sipir" blinkOffset={25} position={[1.75, 0, -1.15]} rotationY={-0.15} />
        </Canvas3D>
      </div>
      <Stamp text="10 TAHUN PENJARA" delay={24} style={{ left: 300, top: 96 }} />
    </AbsoluteFill>
  );
};

/** S3 — Two-shot: sipir bicara, balon dialog dengan nama. */
const Shot3: React.FC = () => (
  <AbsoluteFill>
    <Canvas3D>
      <CameraRig
        from={{ pos: [0.85, 1.5, 4.7], look: [0.6, 1.02, -1.3] }}
        to={{ pos: [0.95, 1.47, 4.35], look: [0.6, 1.02, -1.3] }}
      />
      <Character3D outfit="sipir" talking blinkOffset={15} position={[-0.55, 0, -1.15]} rotationY={0.38} />
      <Character3D outfit="tahanan" position={[1.55, 0, -1.2]} rotationY={-0.32} />
    </Canvas3D>
    <SpeechBubble
      name="SIPIR"
      text="Sel C-07. Ini rumah barumu untuk waktu yang lama."
      delay={10}
      width={470}
      style={{ left: 90, top: 84 }}
    />
  </AbsoluteFill>
);

/** S4 — Close-up 3D tahanan kaget (dolly-in ke kepala bola). */
const Shot4: React.FC = () => (
  <AbsoluteFill>
    <Canvas3D>
      <CameraRig
        from={{ pos: [0.18, 1.52, 1.3], look: [0, 1.44, -1.0] }}
        to={{ pos: [0.14, 1.5, 1.05], look: [0, 1.44, -1.0] }}
      />
      <Character3D outfit="tahanan" expression="kaget" talking position={[0, 0, -1.0]} />
    </Canvas3D>
    <SpeechBubble
      name="C-07"
      nameColor="#b35c14"
      text="Sepuluh tahun?! Lama banget!"
      delay={12}
      width={430}
      style={{ left: 770, top: 110 }}
    />
  </AbsoluteFill>
);

/** S5 — Di dekat ranjang susun: mikir, pill HARI KE-1. */
const Shot5: React.FC = () => (
  <AbsoluteFill>
    <Canvas3D>
      <CameraRig
        from={{ pos: [5.0, 1.55, 2.1], look: [6.35, 1.02, -0.95] }}
        to={{ pos: [5.15, 1.5, 1.8], look: [6.35, 1.02, -0.95] }}
      />
      <Character3D outfit="tahanan" expression="mikir" armPose="up" position={[6.35, 0, -0.95]} rotationY={-0.25} />
    </Canvas3D>
    <TimePill text="HARI KE-1" delay={14} style={{ right: 40, top: 34 }} />
  </AbsoluteFill>
);

/** S6 — Lompatan waktu: pill berganti HARI KE-40, licik sambil memegang denah mini. */
const Shot6: React.FC = () => {
  const frame = useCurrentFrame();
  const outScale = interpolate(frame, [28, 38], [1, 0], clamp);
  return (
    <AbsoluteFill>
      <Canvas3D>
        <CameraRig
          from={{ pos: [5.1, 1.52, 1.95], look: [6.35, 1.02, -0.95] }}
          to={{ pos: [5.25, 1.5, 1.65], look: [6.35, 1.02, -0.95] }}
        />
        <Character3D outfit="tahanan" expression="licik" armPose="point" position={[6.35, 0, -0.95]} rotationY={-0.25} />
        {/* kertas denah mini di depan tangan yang menunjuk */}
        <mesh position={[6.02, 1.0, -0.36]} rotation={[0, -0.25, -0.12]}>
          <planeGeometry args={[0.34, 0.25]} />
          <meshStandardMaterial map={denahMiniTexture()} roughness={0.9} side={THREE.DoubleSide} />
        </mesh>
      </Canvas3D>
      <div style={{ position: "absolute", right: 40, top: 34, transform: `scale(${outScale})`, opacity: outScale }}>
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "4px solid #23272e",
            borderRadius: 999,
            padding: "8px 26px",
            fontFamily: "Arial, Helvetica, sans-serif",
            fontWeight: 800,
            fontSize: 30,
            color: "#23272e",
          }}
        >
          HARI KE-1
        </div>
      </div>
      <TimePill text="HARI KE-40" delay={40} style={{ right: 40, top: 34 }} />
    </AbsoluteFill>
  );
};

/** S7 — Kartu denah 2D layar penuh di atas set 3D yang digelapkan. */
const Shot7: React.FC = () => (
  <AbsoluteFill>
    <Canvas3D>
      <CameraRig
        from={{ pos: [0, 1.75, 8.4], look: [0, 1.0, -1.0] }}
        to={{ pos: [0, 1.75, 8.4], look: [0, 1.0, -1.0] }}
      />
    </Canvas3D>
    <AbsoluteFill style={{ backgroundColor: "rgba(20,26,36,0.55)" }} />
    <DenahCard style={{ left: 150, top: 60 }} />
  </AbsoluteFill>
);

/** S8 — Close-up licik: kesimpulan tokoh. */
const Shot8: React.FC = () => (
  <AbsoluteFill>
    <Canvas3D>
      <CameraRig
        from={{ pos: [0.18, 1.52, 1.3], look: [0, 1.44, -1.0] }}
        to={{ pos: [0.14, 1.5, 1.05], look: [0, 1.44, -1.0] }}
      />
      <Character3D outfit="tahanan" expression="licik" talking position={[0, 0, -1.0]} />
    </Canvas3D>
    <SpeechBubble
      name="C-07"
      nameColor="#b35c14"
      text="Patroli cuma tiap dua jam. Menarik..."
      delay={12}
      width={450}
      style={{ left: 750, top: 110 }}
    />
  </AbsoluteFill>
);

/** Sorotan patroli yang mengikuti sipir di shot malam. */
const PatrolLight: React.FC<{ x: number }> = ({ x }) => {
  const light = useRef<THREE.SpotLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  useEffect(() => {
    if (light.current) {
      light.current.target = target;
    }
  }, [target]);
  return (
    <group position={[x, 0, -0.5]}>
      <spotLight
        ref={light}
        position={[0, 2.6, 0.3]}
        angle={0.52}
        penumbra={0.6}
        intensity={55}
        distance={13}
        color="#ffe9b8"
      />
      <primitive object={target} position={[0.4, 0, 2.4]} />
      <pointLight position={[0, 1.6, 0.4]} intensity={2.5} distance={4.5} color="#ffd9a0" />
    </group>
  );
};

/** S9 — Malam: sipir patroli dengan sorotan lampu, kamera pan mengikuti; tahanan mengintip. */
const Shot9: React.FC = () => {
  const frame = useCurrentFrame();
  const t = easeT(frame);
  const gx = lerp(-3.6, 2.4, t);
  return (
    <AbsoluteFill>
      <Canvas3D night>
        <CameraRig
          from={{ pos: [-1.4, 1.65, 5.4], look: [-3.3, 1.0, -0.6] }}
          to={{ pos: [2.0, 1.65, 5.4], look: [2.7, 1.0, -0.6] }}
        />
        <Character3D outfit="sipir" walking blinkOffset={30} position={[gx, 0, -0.5]} rotationY={0.08} />
        <PatrolLight x={gx} />
        <Character3D outfit="tahanan" expression="licik" position={[5.9, 0, -1.35]} rotationY={-0.3} />
      </Canvas3D>
      <AbsoluteFill style={{ backgroundColor: "rgba(14,28,54,0.30)" }} />
      <TimePill text="PUKUL 02.00" delay={10} style={{ right: 40, top: 34 }} />
    </AbsoluteFill>
  );
};

export const Proto3D: React.FC = () => {
  return (
    <Series>
      <Series.Sequence durationInFrames={SHOT_FRAMES}>
        <Shot1 />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SHOT_FRAMES}>
        <Shot2 />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SHOT_FRAMES}>
        <Shot3 />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SHOT_FRAMES}>
        <Shot4 />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SHOT_FRAMES}>
        <Shot5 />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SHOT_FRAMES}>
        <Shot6 />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SHOT_FRAMES}>
        <Shot7 />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SHOT_FRAMES}>
        <Shot8 />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SHOT_FRAMES}>
        <Shot9 />
      </Series.Sequence>
    </Series>
  );
};
