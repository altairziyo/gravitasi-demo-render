import React, { useMemo } from "react";
import * as THREE from "three";
import { useCurrentFrame } from "remotion";

/**
 * Rig 3D DIMAS — Penjelajah Waktu Amatir, tokoh serial channel fresh Bos.
 * Dibangun di atas pola Character3D.tsx (kepala sphere, mata oval di permukaan
 * kepala, konfigurasi ekspresi, walk bob, blob shadow) tetapi dengan identitas
 * sendiri: kepala TAN hangat #D98E54 (TEGAS bukan hitam — kepala hitam adalah
 * ciri channel "Gimana Kalau?"), jaket indigo, dan dua ciri siluet wajib:
 * (1) kacamata las kuningan di dahi, (2) syal kunyit berkibar (ribbon
 * beranimasi gelombang kontinu). Tabung tembaga di punggung DIHAPUS atas
 * perintah Bos 22 Nov 2026 (cerita penjelajah waktu dicabut dari channel).
 * Satuan meter; asal grup di lantai di bawah kaki. Kepala pusat y=1,47 r=0,40.
 * Tokoh menghadap +Z.
 */
export type DimasExpression = "normal" | "kaget" | "mikir" | "licik";
export type DimasArmPose = "down" | "up" | "point" | "adjust";

const SKIN = "#D98E54";
const INDIGO = "#5B4B9E";
const INDIGO_DARK = "#463A7D";
const MUSTARD = "#E8862E";
const BRASS = "#C9962E";
const LEATHER = "#6B4226";
const HAIR = "#4A2C1A";
const PANTS = "#4A4038";

type Props = {
  expression?: DimasExpression;
  talking?: boolean;
  walking?: boolean;
  armPose?: DimasArmPose;
  /** 0..1 — seberapa jauh pose "adjust" (tangan ke dahi) tercapai. */
  adjustAmount?: number;
  /** 0..1 — goggles terangkat dari dahi (dipakai bersama pose adjust). */
  goggleLift?: number;
  /** Pitch kepala ekstra (rad, negatif = menengadah). */
  headPitch?: number;
  blinkOffset?: number;
  position?: [number, number, number];
  rotationY?: number;
};

type EyeCfg = { h: number; pupil: number; dx: number; dy: number };
const EYE_CFG: Record<DimasExpression, EyeCfg> = {
  normal: { h: 0.115, pupil: 0.036, dx: 0, dy: 0 },
  kaget: { h: 0.14, pupil: 0.023, dx: 0, dy: 0.008 },
  mikir: { h: 0.07, pupil: 0.032, dx: 0.02, dy: -0.008 },
  licik: { h: 0.082, pupil: 0.03, dx: -0.02, dy: 0 },
};

const browFor = (
  expression: DimasExpression,
  side: 1 | -1,
): { y: number; rz: number } => {
  switch (expression) {
    case "kaget":
      return { y: 0.238, rz: side * 0.18 };
    case "mikir":
      return side < 0 ? { y: 0.232, rz: 0.3 } : { y: 0.208, rz: -0.04 };
    case "licik":
      return { y: 0.205, rz: side * 0.32 };
    default:
      return { y: 0.215, rz: side * -0.08 };
  }
};

const Eye: React.FC<{ side: 1 | -1; cfg: EyeCfg; blinking: boolean }> = ({
  side,
  cfg,
  blinking,
}) => (
  <group position={[side * 0.15, 0.05, 0.35]} scale={[1, blinking ? 0.08 : 1, 1]}>
    <mesh scale={[0.08, cfg.h, 0.038]}>
      <sphereGeometry args={[1, 24, 16]} />
      <meshStandardMaterial color="#ffffff" roughness={0.35} />
    </mesh>
    <mesh position={[cfg.dx, cfg.dy, 0.03]}>
      <sphereGeometry args={[cfg.pupil, 16, 12]} />
      <meshStandardMaterial color="#241207" roughness={0.3} />
    </mesh>
    <mesh position={[cfg.dx + 0.012, cfg.dy + 0.014, 0.06]}>
      <sphereGeometry args={[0.009, 8, 8]} />
      <meshBasicMaterial color="#ffffff" />
    </mesh>
  </group>
);

const Mouth: React.FC<{ expression: DimasExpression; talking: boolean; frame: number }> = ({
  expression,
  talking,
  frame,
}) => {
  if (talking) {
    const open = Math.floor(frame / 4) % 2 === 0;
    return (
      <mesh position={[0, -0.145, 0.378]} scale={[0.034, open ? 0.046 : 0.012, 0.018]}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshStandardMaterial color="#5b2330" roughness={0.6} />
      </mesh>
    );
  }
  if (expression === "kaget") {
    return (
      <mesh position={[0, -0.15, 0.378]} scale={[0.03, 0.042, 0.018]}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshStandardMaterial color="#5b2330" roughness={0.6} />
      </mesh>
    );
  }
  if (expression === "licik") {
    // Nyengir lebar miring memperlihatkan gigi (perintah Bos, 22 Nov 2026):
    // interior mulut gelap (ellipsoid menempel permukaan kepala) + deretan
    // gigi putih 4 kolom x 2 baris; celah gelap di antara kotak gigi menjadi
    // garis pemisahnya. Tiap gigi mengikuti kelengkungan wajah (z dari rumus
    // ellipsoid + rotasi Y per kolom) supaya tidak terlihat seperti stiker.
    const RX = 0.1;
    const RY = 0.046;
    const RZ = 0.026;
    const zRel = (x: number, y: number) =>
      RZ * Math.sqrt(Math.max(0, 1 - (x / RX) ** 2 - (y / RY) ** 2));
    const cols = [-0.062, -0.021, 0.021, 0.062];
    const rows = [0.0145, -0.0155];
    return (
      <group position={[0.012, -0.148, 0.35]} rotation={[0, 0, 0.13]}>
        <mesh scale={[RX, RY, RZ]}>
          <sphereGeometry args={[1, 24, 16]} />
          <meshStandardMaterial color="#5b2330" roughness={0.6} />
        </mesh>
        {rows.map((ry) =>
          cols.map((cx) => (
            <mesh
              key={`${cx}:${ry}`}
              position={[cx, ry, zRel(cx, ry) - 0.002]}
              rotation={[0, cx * 2.0, 0]}
            >
              <boxGeometry args={[0.032, 0.026, 0.014]} />
              <meshStandardMaterial color="#ffffff" roughness={0.35} />
            </mesh>
          )),
        )}
      </group>
    );
  }
  const tilt = Math.PI;
  const r = expression === "mikir" ? 0.038 : 0.048;
  return (
    <mesh position={[0, -0.128, 0.382]} rotation={[0, 0, tilt]}>
      <torusGeometry args={[r, 0.0085, 8, 20, Math.PI]} />
      <meshStandardMaterial color="#3A1E0C" roughness={0.5} />
    </mesh>
  );
};

/**
 * Ujung syal yang berkibar: ribbon (strip segmen) yang titik-titiknya dihitung
 * ulang tiap frame dengan gelombang sinus kontinu — bukan stepped.
 * Mengalir dari leher ke sisi +X (kanan layar dari depan), sedikit ke belakang.
 */
const ScarfTail: React.FC<{ frame: number }> = ({ frame }) => {
  const geo = useMemo(() => {
    const N = 16;
    const positions: number[] = [];
    const indices: number[] = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const cx = 0.17 + t * 0.84;
      const cy =
        1.2 +
        Math.sin(t * Math.PI * 0.85) * 0.17 -
        t * 0.13 +
        Math.sin(frame * 0.18 - t * 5.2) * 0.05 * t;
      const cz = -0.03 - t * 0.3 + Math.cos(frame * 0.14 - t * 4.2) * 0.035 * t;
      const twist = 0.45 + t * 0.5;
      const w = (0.175 - t * 0.045) / 2;
      const wy = Math.cos(twist) * w;
      const wz = Math.sin(twist) * w;
      positions.push(cx, cy + wy, cz + wz, cx, cy - wy, cz - wz);
      if (i < N) {
        const a = i * 2;
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }, [frame]);
  return (
    <mesh geometry={geo}>
      <meshStandardMaterial color={MUSTARD} roughness={0.9} side={THREE.DoubleSide} />
    </mesh>
  );
};

/** Kacamata las kuningan bertengger di dahi + strap kulit memeluk kepala. */
const Goggles: React.FC<{ lift: number }> = ({ lift }) => (
  <>
    {/* strap: pita kulit berupa segmen bola mengikuti permukaan kepala */}
    <mesh rotation={[-0.18, 0, 0]}>
      <sphereGeometry args={[0.408, 32, 8, 0, Math.PI * 2, 0.92, 0.3]} />
      <meshStandardMaterial color={LEATHER} roughness={0.8} side={THREE.DoubleSide} />
    </mesh>
    <group
      position={[0, 0.245 + lift * 0.055, 0.3]}
      rotation={[-0.42 - lift * 0.3, 0, 0]}
    >
      {([-1, 1] as const).map((side) => (
        <group key={side} position={[side * 0.148, 0, 0]}>
          {/* cangkir kuningan */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.104, 0.112, 0.075, 24]} />
            <meshStandardMaterial color={BRASS} roughness={0.32} metalness={0.8} />
          </mesh>
          {/* bibir cangkir lebih terang */}
          <mesh position={[0, 0, 0.038]}>
            <torusGeometry args={[0.104, 0.017, 10, 28]} />
            <meshStandardMaterial color="#E3B34C" roughness={0.25} metalness={0.85} />
          </mesh>
          {/* lensa kaca gelap */}
          <mesh position={[0, 0, 0.036]}>
            <circleGeometry args={[0.088, 24]} />
            <meshStandardMaterial color="#2E2119" roughness={0.12} metalness={0.2} />
          </mesh>
          {/* rivet kecil di sisi cangkir */}
          <mesh position={[side * 0.108, 0, 0]}>
            <sphereGeometry args={[0.016, 8, 8]} />
            <meshStandardMaterial color="#8A6420" roughness={0.4} metalness={0.7} />
          </mesh>
        </group>
      ))}
      {/* jembatan penghubung */}
      <mesh position={[0, 0.01, 0.01]}>
        <boxGeometry args={[0.09, 0.035, 0.05]} />
        <meshStandardMaterial color={BRASS} roughness={0.35} metalness={0.8} />
      </mesh>
    </group>
  </>
);

/** Jumbai rambut acak cokelat di sekeliling atas/samping kepala (di belakang goggles). */
const HairTufts: React.FC = () => {
  const tufts: Array<{ pos: [number, number, number]; rot: [number, number, number]; h: number }> = [
    { pos: [0, 0.38, -0.14], rot: [-0.5, 0, 0], h: 0.2 },
    { pos: [0.2, 0.34, -0.2], rot: [-0.45, 0, -0.45], h: 0.18 },
    { pos: [-0.2, 0.34, -0.2], rot: [-0.45, 0, 0.45], h: 0.18 },
    { pos: [0.33, 0.2, -0.16], rot: [-0.3, 0, -0.9], h: 0.17 },
    { pos: [-0.33, 0.2, -0.16], rot: [-0.3, 0, 0.9], h: 0.17 },
    { pos: [0.38, 0.02, -0.02], rot: [0, 0, -1.25], h: 0.15 },
    { pos: [-0.38, 0.02, -0.02], rot: [0, 0, 1.25], h: 0.15 },
    { pos: [0.12, 0.37, 0.08], rot: [0.35, 0, -0.25], h: 0.14 },
    { pos: [-0.12, 0.37, 0.08], rot: [0.35, 0, 0.25], h: 0.14 },
  ];
  return (
    <>
      {tufts.map((t, i) => (
        <mesh key={i} position={t.pos} rotation={t.rot} scale={[1, 1, 0.62]}>
          <coneGeometry args={[0.052, t.h, 8]} />
          <meshStandardMaterial color={HAIR} roughness={0.9} />
        </mesh>
      ))}
    </>
  );
};

const Arm: React.FC<{
  side: 1 | -1;
  rotation: [number, number, number];
}> = ({ side, rotation }) => (
  <group position={[side * 0.335, 1.1, 0]} rotation={rotation}>
    <mesh position={[0, -0.21, 0]}>
      <capsuleGeometry args={[0.068, 0.3, 6, 16]} />
      <meshStandardMaterial color={INDIGO} roughness={0.85} />
    </mesh>
    <mesh position={[0, -0.47, 0]}>
      <sphereGeometry args={[0.072, 16, 12]} />
      <meshStandardMaterial color={SKIN} roughness={0.45} />
    </mesh>
  </group>
);

const Leg: React.FC<{ side: 1 | -1; swing: number }> = ({ side, swing }) => (
  <group position={[side * 0.115, 0.56, 0]} rotation={[swing, 0, 0]}>
    <mesh position={[0, -0.22, 0]}>
      <capsuleGeometry args={[0.082, 0.28, 6, 16]} />
      <meshStandardMaterial color={PANTS} roughness={0.9} />
    </mesh>
    <mesh position={[0, -0.505, 0.035]}>
      <boxGeometry args={[0.105, 0.07, 0.21]} />
      <meshStandardMaterial color="#2A2320" roughness={0.7} />
    </mesh>
  </group>
);

export const Dimas3D: React.FC<Props> = ({
  expression = "normal",
  talking = false,
  walking = false,
  armPose = "down",
  adjustAmount = 0,
  goggleLift = 0,
  headPitch = 0,
  blinkOffset = 0,
  position = [0, 0, 0],
  rotationY = 0,
}) => {
  const frame = useCurrentFrame();

  const blinkCycle = (frame + blinkOffset) % 105;
  const blinking = blinkCycle < 5;

  const phase = frame * 0.55;
  const bob = walking ? Math.abs(Math.sin(phase)) * 0.045 : 0;
  const sway = walking ? Math.sin(phase) * 0.03 : Math.sin(frame * 0.05) * 0.008;

  const armRotation = (side: 1 | -1): [number, number, number] => {
    // lengan sisi -1 adalah lengan pose (up/point/adjust)
    if (side === -1 && armPose === "up") return [0, 0, 2.35];
    if (side === -1 && armPose === "point") return [-1.3, 0, -0.05];
    if (side === -1 && armPose === "adjust") {
      const t = Math.max(0, Math.min(1, adjustAmount));
      // Terangkat ke samping kepala setinggi strap goggles. Kepala r=0,40 itu
      // besar: lengan yang lurus ke atas akan menembus bola kepala, jadi arah
      // angkat dibuat miring ke luar (rotasi Z negatif besar) + sedikit ke depan.
      return [0.3 * t, 0, -0.1 - 2.5 * t];
    }
    const swingX = walking ? Math.sin(phase + (side > 0 ? 0 : Math.PI)) * 0.5 : 0;
    return [swingX, 0, side * 0.1];
  };

  const eyeCfg = EYE_CFG[expression];

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* bayangan gumpal murah di lantai */}
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 0.62, 1]}>
        <circleGeometry args={[0.42, 24]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.26} depthWrite={false} />
      </mesh>

      <group position={[0, bob, 0]} rotation={[0, 0, sway]}>
        {/* kaki */}
        <Leg side={-1} swing={walking ? Math.sin(phase + Math.PI) * 0.55 : 0} />
        <Leg side={1} swing={walking ? Math.sin(phase) * 0.55 : 0} />

        {/* badan: jaket indigo */}
        <mesh position={[0, 0.88, 0]} scale={[1, 1, 0.74]}>
          <capsuleGeometry args={[0.295, 0.34, 8, 24]} />
          <meshStandardMaterial color={INDIGO} roughness={0.85} />
        </mesh>
        {/* kemeja krem di dada + kerah jaket */}
        <mesh position={[0, 1.08, 0.222]}>
          <boxGeometry args={[0.1, 0.22, 0.014]} />
          <meshStandardMaterial color="#EDE4D0" roughness={0.9} />
        </mesh>
        {([-1, 1] as const).map((side) => (
          <mesh
            key={side}
            position={[side * 0.082, 1.09, 0.222]}
            rotation={[0, 0, side * -0.32]}
          >
            <boxGeometry args={[0.085, 0.27, 0.016]} />
            <meshStandardMaterial color={INDIGO_DARK} roughness={0.85} />
          </mesh>
        ))}
        {/* saku jaket */}
        <mesh position={[-0.16, 0.72, 0.2]} rotation={[0.1, 0, 0]}>
          <boxGeometry args={[0.13, 0.09, 0.02]} />
          <meshStandardMaterial color={INDIGO_DARK} roughness={0.9} />
        </mesh>

        {/* lengan */}
        <Arm side={-1} rotation={armRotation(-1)} />
        <Arm side={1} rotation={armRotation(1)} />

        {/* syal kunyit: lilitan leher + ujung berkibar (juntaian depan dihapus atas perintah Bos, 22 Nov 2026) */}
        <mesh position={[0, 1.17, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.8]}>
          <torusGeometry args={[0.225, 0.062, 12, 28]} />
          <meshStandardMaterial color={MUSTARD} roughness={0.9} />
        </mesh>
        <ScarfTail frame={frame} />

        {/* kepala */}
        <group
          position={[0, 1.47, 0]}
          rotation={[
            headPitch + (expression === "mikir" ? 0.06 : 0),
            0,
            expression === "mikir" ? 0.05 : 0,
          ]}
        >
          <mesh>
            <sphereGeometry args={[0.4, 48, 32]} />
            <meshStandardMaterial color={SKIN} roughness={0.32} metalness={0.03} />
          </mesh>

          {/* telinga */}
          {([-1, 1] as const).map((side) => (
            <mesh key={side} position={[side * 0.395, -0.02, 0]} scale={[0.5, 1, 1]}>
              <sphereGeometry args={[0.07, 14, 10]} />
              <meshStandardMaterial color={SKIN} roughness={0.45} />
            </mesh>
          ))}

          <HairTufts />
          <Goggles lift={goggleLift} />

          <Eye side={-1} cfg={eyeCfg} blinking={blinking} />
          <Eye side={1} cfg={eyeCfg} blinking={blinking} />

          {/* alis */}
          {([-1, 1] as const).map((side) => {
            const b = browFor(expression, side);
            return (
              <mesh
                key={side}
                position={[side * 0.15, b.y, 0.345]}
                rotation={[0, side * 0.18, b.rz]}
              >
                <boxGeometry args={[0.115, 0.02, 0.02]} />
                <meshStandardMaterial color={HAIR} roughness={0.5} />
              </mesh>
            );
          })}

          {/* blush */}
          {([-1, 1] as const).map((side) => (
            <mesh
              key={side}
              position={[side * 0.265, -0.055, 0.295]}
              rotation={[0, side * 0.62, 0]}
            >
              <circleGeometry args={[0.055, 20]} />
              <meshBasicMaterial color="#E88CA0" transparent opacity={0.45} depthWrite={false} />
            </mesh>
          ))}

          <Mouth expression={expression} talking={talking} frame={frame} />
        </group>
      </group>
    </group>
  );
};
