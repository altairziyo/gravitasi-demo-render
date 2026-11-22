import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { Simu, SimuArmPose, SimuExpression } from "./three/Simu";
import { LocationBanner } from "./Graphics";

/**
 * Showcase maskot SIMU: 420 frame (14 dtk), 1280x720, 30fps, silent.
 * Urutan: jalan masuk -> lambaian + label "SIMU" -> parade 5 ekspresi
 * (masing-masing 45 frame, ada label namanya) -> momen identitas berlatar
 * terbelah toska/oranye sambil menunjuk dua sisi -> orbit + push-in penutup.
 * Kamera digerakkan useCurrentFrame + easing kontinu (dolly + orbit).
 */
export const SIMU_SHOWCASE_FRAMES = 420;

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};
const easeIO = { ...clamp, easing: Easing.inOut(Easing.cubic) };

const exprAt = (f: number): SimuExpression => {
  if (f < 80) return "normal"; // jalan masuk
  if (f < 120) return "senang"; // lambaian
  if (f < 165) return "normal"; // parade 1
  if (f < 210) return "senang"; // parade 2
  if (f < 255) return "kaget"; // parade 3
  if (f < 300) return "mikir"; // parade 4
  if (f < 345) return "licik"; // parade 5
  return "senang"; // momen identitas
};

const armAt = (f: number): SimuArmPose => {
  if (f < 80) return "down";
  if (f < 120) return "wave";
  if (f < 345) return "down";
  return "present";
};

const PARADE: Array<{ from: number; label: string }> = [
  { from: 120, label: "NORMAL" },
  { from: 165, label: "SENANG" },
  { from: 210, label: "KAGET" },
  { from: 255, label: "MIKIR" },
  { from: 300, label: "LICIK" },
];

/** Kamera showcase: dolly masuk, push-in selama parade, orbit ringan di penutup. */
const ShowcaseCamera: React.FC = () => {
  const frame = useCurrentFrame();
  const camera = useThree((s) => s.camera);
  const radius = interpolate(frame, [0, 75, 300, 420], [6.6, 5.2, 4.6, 3.9], easeIO);
  const angle = interpolate(frame, [345, 420], [0, 0.38], easeIO);
  const lookX = interpolate(frame, [0, 75], [-1.1, 0], easeIO);
  const camY = interpolate(frame, [0, 420], [1.42, 1.28], clamp);
  camera.position.set(Math.sin(angle) * radius, camY, Math.cos(angle) * radius);
  camera.lookAt(lookX, 1.16, 0);
  return null;
};

const StudioLights: React.FC = () => (
  <>
    <hemisphereLight args={["#ffffff", "#b3aa99", 1.05]} />
    <ambientLight intensity={0.38} />
    <directionalLight position={[4, 6.5, 5]} intensity={1.15} />
    <directionalLight position={[-5, 3.5, 3]} intensity={0.35} />
  </>
);

/** Set studio: lantai terang, dinding netral, dua bidang belahan yang memudar masuk di momen identitas. */
const StudioSet: React.FC = () => {
  const frame = useCurrentFrame();
  const splitOpacity = interpolate(frame, [348, 372], [0, 0.92], easeIO);
  return (
    <>
      {/* dinding belakang netral */}
      <mesh position={[0, 3, -5]}>
        <planeGeometry args={[34, 12]} />
        <meshStandardMaterial color="#F4F2ED" roughness={1} />
      </mesh>
      {/* belahan identitas: kiri toska, kanan oranye */}
      <mesh position={[-8.5, 3, -4.9]}>
        <planeGeometry args={[17, 12]} />
        <meshBasicMaterial color="#1F9E8E" transparent opacity={splitOpacity} depthWrite={false} />
      </mesh>
      <mesh position={[8.5, 3, -4.9]}>
        <planeGeometry args={[17, 12]} />
        <meshBasicMaterial color="#F08A24" transparent opacity={splitOpacity} depthWrite={false} />
      </mesh>
      {/* lantai terang */}
      <mesh position={[0, 0, 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[34, 18]} />
        <meshStandardMaterial color="#E2DFD8" roughness={1} />
      </mesh>
    </>
  );
};

/** Label nama ekspresi selama parade: pil putih di bawah tengah, pop tiap ganti ekspresi. */
const ExprLabel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < 120 || frame >= 345) return null;
  const seg = [...PARADE].reverse().find((s) => frame >= s.from)!;
  const p = spring({
    frame: frame - seg.from,
    fps,
    config: { damping: 14, stiffness: 180, mass: 0.6 },
  });
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 36,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "4px solid #23272e",
          borderRadius: 999,
          padding: "8px 30px",
          transform: `scale(${Math.max(0, p)})`,
          opacity: p,
          boxShadow: "0 6px 14px rgba(0,0,0,0.25)",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontWeight: 800,
          fontSize: 28,
          letterSpacing: 2,
          color: "#23272e",
        }}
      >
        {seg.label}
      </div>
    </div>
  );
};

export const SimuShowcase: React.FC = () => {
  const frame = useCurrentFrame();

  const simuX = interpolate(frame, [0, 75], [-2.5, 0], easeIO);
  const walking = frame < 75;
  const faceTurn = interpolate(frame, [58, 85], [0.55, 0], easeIO);

  // postur kepala per segmen parade (mikir menoleh+miring, licik miring balik)
  const headTilt =
    interpolate(frame, [255, 265, 295, 305], [0, 0.13, 0.13, 0], easeIO) +
    interpolate(frame, [300, 310, 340, 350], [0, -0.08, -0.08, 0], easeIO);
  const headTurn =
    interpolate(frame, [255, 265, 295, 305], [0, 0.35, 0.35, 0], easeIO) +
    interpolate(frame, [300, 310, 340, 350], [0, -0.18, -0.18, 0], easeIO);

  return (
    <AbsoluteFill>
      <ThreeCanvas
        width={1280}
        height={720}
        camera={{ fov: 38, near: 0.1, far: 100, position: [0, 1.4, 6.6] }}
      >
        <color attach="background" args={["#ECEAE6"]} />
        <StudioLights />
        <StudioSet />
        <ShowcaseCamera />
        <Simu
          expression={exprAt(frame)}
          armPose={armAt(frame)}
          walking={walking}
          headTilt={headTilt}
          headTurn={headTurn}
          position={[simuX, 0, 0]}
          rotationY={faceTurn}
        />
      </ThreeCanvas>
      {/* label nama dari template grafis yang sudah ada */}
      <LocationBanner text="SIMU" delay={82} style={{ left: 36, top: 30 }} />
      <ExprLabel />
    </AbsoluteFill>
  );
};
