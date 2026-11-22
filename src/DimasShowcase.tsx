import React, { useMemo } from "react";
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
import { Dimas3D, DimasExpression } from "./three/Dimas3D";
import { LocationBanner } from "./Graphics";

/**
 * Showcase DIMAS: 420 frame (14 dtk), 1280x720, 30fps, silent.
 * Urutan: DIMAS jalan masuk dari portal waktu rakitan -> push-in ->
 * parade 4 ekspresi (normal/kaget/mikir/licik, 45 frame masing-masing) ->
 * membetulkan goggles di dahi sambil syal berkibar -> label "DIMAS" ->
 * orbit halus menutup (memperlihatkan tabung tembaga dari sudut 3/4 belakang).
 * Semua gerak kamera kontinu dengan easing in-out kubik.
 */
export const DIMAS_SHOWCASE_FRAMES = 420;

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};
const easeIO = { ...clamp, easing: Easing.inOut(Easing.cubic) };

const exprAt = (f: number): DimasExpression => {
  if (f < 135) return "normal"; // jalan masuk + parade 1 (90-134)
  if (f < 180) return "kaget"; // parade 2
  if (f < 225) return "mikir"; // parade 3
  if (f < 270) return "licik"; // parade 4
  if (f < 345) return "normal"; // segmen betulkan goggles
  return "licik"; // penutup percaya diri
};

const PARADE: Array<{ from: number; label: string }> = [
  { from: 90, label: "NORMAL" },
  { from: 135, label: "KAGET" },
  { from: 180, label: "MIKIR" },
  { from: 225, label: "LICIK" },
];

/** Portal waktu rakitan: ring logam berdiri, tepi bercahaya biru elektrik, partikel cahaya berputar halus. */
const Portal: React.FC<{ position: [number, number, number]; rotationY: number }> = ({
  position,
  rotationY,
}) => {
  const frame = useCurrentFrame();
  const particles = useMemo(() => {
    const pts: Array<{ pos: [number, number, number]; r: number }> = [];
    for (let i = 0; i < 42; i++) {
      const a = Math.sin(i * 127.1) * 43758.5453;
      const frac = a - Math.floor(a);
      const b = Math.sin(i * 311.7) * 12543.123;
      const frac2 = b - Math.floor(b);
      const ang = frac * Math.PI * 2;
      const rad = 0.25 + frac2 * 0.68;
      pts.push({
        pos: [Math.cos(ang) * rad, Math.sin(ang) * rad, (frac - 0.5) * 0.1],
        r: 0.014 + frac2 * 0.02,
      });
    }
    return pts;
  }, []);
  const glowPulse = 0.26 + Math.sin(frame * 0.09) * 0.07;
  const lampOn = Math.floor(frame / 18) % 2 === 0;

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* ring logam utama */}
      <mesh position={[0, 1.28, 0]}>
        <torusGeometry args={[1.18, 0.075, 14, 48]} />
        <meshStandardMaterial color="#6A7078" roughness={0.35} metalness={0.8} />
      </mesh>
      {/* tepi bercahaya biru elektrik */}
      <mesh position={[0, 1.28, 0]}>
        <torusGeometry args={[1.05, 0.02, 8, 48]} />
        <meshBasicMaterial color="#7FDCFF" />
      </mesh>
      {/* cakram cahaya portal */}
      <mesh position={[0, 1.28, -0.03]}>
        <circleGeometry args={[1.04, 40]} />
        <meshBasicMaterial color="#2F7FD0" transparent opacity={glowPulse} depthWrite={false} />
      </mesh>
      {/* partikel cahaya berputar perlahan */}
      <group position={[0, 1.28, 0]} rotation={[0, 0, frame * 0.02]}>
        {particles.map((p, i) => (
          <mesh key={i} position={p.pos}>
            <sphereGeometry args={[p.r, 8, 8]} />
            <meshBasicMaterial color="#BDEBFF" />
          </mesh>
        ))}
      </group>
      {/* baut di ring */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2 + 0.26;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 1.18, 1.28 + Math.sin(a) * 1.18, 0.07]}
          >
            <sphereGeometry args={[0.035, 10, 8]} />
            <meshStandardMaterial color="#C9962E" roughness={0.3} metalness={0.8} />
          </mesh>
        );
      })}
      {/* kaki penyangga */}
      {([-1, 1] as const).map((side) => (
        <mesh key={side} position={[side * 0.95, 0.09, 0]}>
          <boxGeometry args={[0.34, 0.18, 0.5]} />
          <meshStandardMaterial color="#565C63" roughness={0.5} metalness={0.6} />
        </mesh>
      ))}
      {/* kotak kendali + lampu berkedip */}
      <group position={[1.35, 0, 0.1]}>
        <mesh position={[0, 0.3, 0]}>
          <boxGeometry args={[0.3, 0.6, 0.3]} />
          <meshStandardMaterial color="#707880" roughness={0.45} metalness={0.6} />
        </mesh>
        <mesh position={[0, 0.68, 0]}>
          <sphereGeometry args={[0.045, 12, 10]} />
          <meshBasicMaterial color={lampOn ? "#FFCF4D" : "#8A6D1F"} />
        </mesh>
      </group>
    </group>
  );
};

/** Kamera showcase: mengikuti jalan masuk, push-in selama parade, orbit menutup. */
const ShowcaseCamera: React.FC = () => {
  const frame = useCurrentFrame();
  const camera = useThree((s) => s.camera);
  const radius = interpolate(frame, [0, 90, 270, 345, 420], [7.6, 5.1, 3.6, 3.5, 3.35], easeIO);
  const angle = interpolate(frame, [345, 420], [0, -2.05], easeIO);
  const camY = interpolate(frame, [0, 90, 270, 420], [1.75, 1.55, 1.42, 1.5], easeIO);
  const lookX = interpolate(frame, [0, 90], [-1.15, 0], easeIO);
  const lookZ = interpolate(frame, [0, 90], [-1.35, -0.05], easeIO);
  camera.position.set(Math.sin(angle) * radius, camY, Math.cos(angle) * radius);
  camera.lookAt(lookX, 1.16, lookZ);
  return null;
};

const StudioLights: React.FC = () => (
  <>
    <hemisphereLight args={["#ffffff", "#b3aa99", 1.05]} />
    <ambientLight intensity={0.38} />
    <directionalLight position={[4, 6.5, 5]} intensity={1.15} />
    <directionalLight position={[-5, 3.5, 3]} intensity={0.35} />
    {/* cahaya biru lembut dari arah portal */}
    <pointLight position={[-2.3, 1.4, -2.2]} intensity={6} distance={7} color="#7FDCFF" />
  </>
);

/** Set studio terang sederhana: lantai terang + dinding netral. */
const StudioSet: React.FC = () => (
  <>
    <mesh position={[0, 3, -5]}>
      <planeGeometry args={[34, 12]} />
      <meshStandardMaterial color="#F4F2ED" roughness={1} />
    </mesh>
    <mesh position={[0, 0, 2]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[34, 18]} />
      <meshStandardMaterial color="#E2DFD8" roughness={1} />
    </mesh>
  </>
);

/** Label nama ekspresi selama parade: pil putih di bawah tengah, pop tiap ganti ekspresi. */
const ExprLabel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < 90 || frame >= 270) return null;
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

export const DimasShowcase: React.FC = () => {
  const frame = useCurrentFrame();

  // jalan masuk dari portal menuju titik tengah
  const walkT = interpolate(frame, [0, 82], [0, 1], easeIO);
  const dimasPos: [number, number, number] = [
    -2.17 + walkT * 2.17,
    0,
    -2.46 + walkT * 2.36,
  ];
  const walking = frame < 82;
  const faceTurn = interpolate(frame, [0, 82], [0.74, 0], easeIO);

  // segmen betulkan goggles (270-344): tangan naik, goggles terangkat, kepala menengadah sedikit
  const adjustT = interpolate(frame, [272, 292, 318, 338], [0, 1, 1, 0], easeIO);
  const inAdjust = frame >= 270 && frame < 345;

  return (
    <AbsoluteFill>
      <ThreeCanvas
        width={1280}
        height={720}
        camera={{ fov: 38, near: 0.1, far: 100, position: [0, 1.7, 7.6] }}
      >
        <color attach="background" args={["#ECEAE6"]} />
        <StudioLights />
        <StudioSet />
        <ShowcaseCamera />
        <Portal position={[-2.35, 0, -2.7]} rotationY={0.65} />
        <Dimas3D
          expression={exprAt(frame)}
          talking={frame >= 95 && frame < 125}
          walking={walking}
          armPose={inAdjust ? "adjust" : "down"}
          adjustAmount={adjustT}
          goggleLift={adjustT * 0.9}
          headPitch={-0.07 * adjustT}
          position={dimasPos}
          rotationY={faceTurn}
        />
      </ThreeCanvas>
      {/* label nama dari template grafis yang sudah ada */}
      <LocationBanner text="DIMAS" delay={350} style={{ left: 36, top: 30 }} />
      <ExprLabel />
    </AbsoluteFill>
  );
};
