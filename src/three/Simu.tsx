import React from "react";
import { useCurrentFrame } from "remotion";
import { simuEmblemTexture, simuHeadTexture } from "./textures";

/**
 * SIMU — maskot channel: robot kecil berkepala BOLA terbelah vertikal
 * toska #1F9E8E (kiri layar) / oranye #F08A24 (kanan layar), kode warna dua
 * dunia channel. Kepala SENGAJA bukan hitam (ciri channel referensi) — tidak
 * ada warna gelap dominan di rig ini. Wajah = garis bercahaya krem di atas
 * permukaan bola glossy; ekspresi ditukar lewat konfigurasi mata/mulut.
 * Satuan meter; asal grup di lantai. Kepala pusat y=1,32 r=0,42. Menghadap +Z.
 */
export type SimuExpression = "normal" | "senang" | "kaget" | "mikir" | "licik";
export type SimuArmPose = "down" | "wave" | "point" | "present";

const IVORY = "#EDEBE6";
const IVORY_DARK = "#D9D4C7";
const COLLAR = "#CFC9BA";
const GLOW = "#FFF3C4";
const TEAL = "#1F9E8E";
const ORANGE = "#F08A24";
const HEAD_R = 0.42;

type Props = {
  expression?: SimuExpression;
  armPose?: SimuArmPose;
  walking?: boolean;
  talking?: boolean;
  blinkOffset?: number;
  /** Miring kepala (rotasi Z, rad) — nilai boleh dianimasikan pemanggil per frame. */
  headTilt?: number;
  /** Kepala menoleh (rotasi Y, rad). */
  headTurn?: number;
  position?: [number, number, number];
  rotationY?: number;
};

/** Mata bercahaya: cincin / lengkung di permukaan bola, mengikuti lengkung kepala. */
const GlowEye: React.FC<{
  side: 1 | -1;
  expression: SimuExpression;
  blinking: boolean;
}> = ({ side, expression, blinking }) => {
  const x = side * 0.148;
  const z = 0.388;
  const rotY = side * 0.36;

  let y = 0.035;
  let content: React.ReactNode;
  if (expression === "senang") {
    // mata bahagia: lengkung ∩
    content = (
      <mesh>
        <torusGeometry args={[0.058, 0.0145, 10, 24, Math.PI]} />
        <meshBasicMaterial color={GLOW} />
      </mesh>
    );
  } else if (expression === "kaget") {
    content = (
      <mesh>
        <torusGeometry args={[0.08, 0.0145, 10, 28]} />
        <meshBasicMaterial color={GLOW} />
      </mesh>
    );
  } else if (expression === "mikir") {
    // sipit; mata sisi -1 (kiri layar) terangkat
    if (side === -1) y += 0.03;
    content = (
      <mesh scale={[1, 0.36, 1]}>
        <torusGeometry args={[0.06, 0.02, 10, 24]} />
        <meshBasicMaterial color={GLOW} />
      </mesh>
    );
  } else if (expression === "licik") {
    content = (
      <mesh scale={[1, 0.55, 1]} rotation={[0, 0, side * -0.14]}>
        <torusGeometry args={[0.062, 0.016, 10, 24]} />
        <meshBasicMaterial color={GLOW} />
      </mesh>
    );
  } else {
    content = (
      <mesh>
        <torusGeometry args={[0.06, 0.014, 10, 24]} />
        <meshBasicMaterial color={GLOW} />
      </mesh>
    );
  }

  return (
    <group
      position={[x, y, z]}
      rotation={[0, rotY, 0]}
      scale={[1, blinking ? 0.1 : 1, 1]}
    >
      {content}
    </group>
  );
};

/** Mulut bercahaya per ekspresi, menempel di permukaan bola (pusat wajah). */
const GlowMouth: React.FC<{ expression: SimuExpression; talking: boolean; frame: number }> = ({
  expression,
  talking,
  frame,
}) => {
  if (talking) {
    const s = 0.75 + Math.abs(Math.sin(frame * 0.45)) * 0.5;
    return (
      <mesh position={[0, -0.135, 0.394]} scale={[s, s, 1]}>
        <torusGeometry args={[0.03, 0.012, 10, 20]} />
        <meshBasicMaterial color={GLOW} />
      </mesh>
    );
  }
  switch (expression) {
    case "senang":
      return (
        <mesh position={[0, -0.125, 0.394]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.062, 0.015, 10, 24, Math.PI]} />
          <meshBasicMaterial color={GLOW} />
        </mesh>
      );
    case "kaget":
      return (
        <mesh position={[0, -0.145, 0.394]}>
          <torusGeometry args={[0.034, 0.0125, 10, 20]} />
          <meshBasicMaterial color={GLOW} />
        </mesh>
      );
    case "mikir":
      return (
        <mesh position={[0.012, -0.14, 0.394]} rotation={[0, 0, 0.14]}>
          <boxGeometry args={[0.075, 0.014, 0.012]} />
          <meshBasicMaterial color={GLOW} />
        </mesh>
      );
    case "licik":
      return (
        <mesh position={[0.018, -0.128, 0.394]} rotation={[0, 0, Math.PI - 0.55]}>
          <torusGeometry args={[0.052, 0.014, 10, 24, Math.PI]} />
          <meshBasicMaterial color={GLOW} />
        </mesh>
      );
    default:
      return (
        <mesh position={[0, -0.128, 0.396]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.046, 0.0135, 10, 24, Math.PI]} />
          <meshBasicMaterial color={GLOW} />
        </mesh>
      );
  }
};

const SimuArm: React.FC<{
  side: 1 | -1;
  pose: SimuArmPose;
  walking: boolean;
  frame: number;
}> = ({ side, pose, walking, frame }) => {
  const phase = frame * 0.5;
  let rotation: [number, number, number] = [0, 0, side * 0.14];
  if (pose === "wave" && side === 1) {
    // lengan kanan layar terangkat ke LUAR kepala lalu melambai (tangan terlihat di samping kepala)
    rotation = [0, 0, side * 2.55 + Math.sin(frame * 0.35) * 0.25];
  } else if (pose === "point" && side === 1) {
    rotation = [-1.25, 0, side * 0.08];
  } else if (pose === "present") {
    // kedua lengan terbuka menunjuk ke dua sisi
    rotation = [0, 0, side * 1.85];
  } else if (walking) {
    rotation = [Math.sin(phase + (side > 0 ? 0 : Math.PI)) * 0.45, 0, side * 0.14];
  }
  return (
    <group position={[side * 0.275, 0.88, 0]} rotation={rotation}>
      <mesh position={[0, -0.13, 0]}>
        <capsuleGeometry args={[0.053, 0.13, 6, 14]} />
        <meshStandardMaterial color={IVORY} roughness={0.55} />
      </mesh>
      <mesh position={[0, -0.285, 0]}>
        <sphereGeometry args={[0.056, 16, 12]} />
        <meshStandardMaterial color={IVORY_DARK} roughness={0.6} />
      </mesh>
    </group>
  );
};

const SimuLeg: React.FC<{ side: 1 | -1; walking: boolean; frame: number }> = ({
  side,
  walking,
  frame,
}) => {
  const swing = walking
    ? Math.sin(frame * 0.5 + (side > 0 ? 0 : Math.PI)) * 0.5
    : 0;
  return (
    <group position={[side * 0.105, 0.27, 0]} rotation={[swing, 0, 0]}>
      <mesh position={[0, -0.09, 0]}>
        <capsuleGeometry args={[0.058, 0.07, 6, 14]} />
        <meshStandardMaterial color={IVORY_DARK} roughness={0.65} />
      </mesh>
      {/* sepatu mengikuti kode warna sisi kepala: kiri toska, kanan oranye */}
      <mesh position={[0, -0.215, 0.028]}>
        <boxGeometry args={[0.098, 0.052, 0.165]} />
        <meshStandardMaterial color={side < 0 ? TEAL : ORANGE} roughness={0.5} />
      </mesh>
    </group>
  );
};

export const Simu: React.FC<Props> = ({
  expression = "normal",
  armPose = "down",
  walking = false,
  talking = false,
  blinkOffset = 0,
  headTilt = 0,
  headTurn = 0,
  position = [0, 0, 0],
  rotationY = 0,
}) => {
  const frame = useCurrentFrame();

  const blinkCycle = (frame + blinkOffset) % 105;
  const blinking = blinkCycle < 5;

  const bob = walking ? Math.abs(Math.sin(frame * 0.5)) * 0.04 : Math.sin(frame * 0.05) * 0.006;
  const antennaPulse = 1.5 + Math.sin(frame * 0.18) * 0.7;
  const antennaScale = 1 + Math.sin(frame * 0.18) * 0.07;
  const idleTilt = Math.sin(frame * 0.04) * 0.02;

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* bayangan gumpal lembut di lantai */}
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 0.62, 1]}>
        <circleGeometry args={[0.4, 24]} />
        <meshBasicMaterial color="#3a362c" transparent opacity={0.2} depthWrite={false} />
      </mesh>

      <group position={[0, bob, 0]}>
        <SimuLeg side={-1} walking={walking} frame={frame} />
        <SimuLeg side={1} walking={walking} frame={frame} />

        {/* badan robot kapsul krem terang */}
        <mesh position={[0, 0.62, 0]} scale={[1, 1, 0.8]}>
          <capsuleGeometry args={[0.26, 0.3, 8, 24]} />
          <meshStandardMaterial color={IVORY} roughness={0.45} />
        </mesh>

        {/* emblem dada: segitiga play terbelah toska/oranye */}
        <mesh position={[0, 0.66, 0.207]} rotation={[-0.06, 0, 0]}>
          <planeGeometry args={[0.17, 0.17]} />
          <meshBasicMaterial map={simuEmblemTexture()} transparent depthWrite={false} />
        </mesh>

        {/* kerah leher */}
        <mesh position={[0, 1.0, 0]}>
          <cylinderGeometry args={[0.135, 0.155, 0.075, 20]} />
          <meshStandardMaterial color={COLLAR} roughness={0.6} />
        </mesh>

        <SimuArm side={-1} pose={armPose} walking={walking} frame={frame} />
        <SimuArm side={1} pose={armPose} walking={walking} frame={frame} />

        {/* kepala bola terbelah */}
        <group position={[0, 1.32, 0]} rotation={[0, headTurn, headTilt + idleTilt]}>
          <mesh>
            <sphereGeometry args={[HEAD_R, 64, 48]} />
            <meshPhysicalMaterial
              map={simuHeadTexture()}
              roughness={0.18}
              metalness={0}
              clearcoat={0.7}
              clearcoatRoughness={0.25}
            />
          </mesh>

          <GlowEye side={-1} expression={expression} blinking={blinking} />
          <GlowEye side={1} expression={expression} blinking={blinking} />
          <GlowMouth expression={expression} talking={talking} frame={frame} />

          {/* antena: tangkai + bola bercahaya berdenyut */}
          <mesh position={[0, 0.47, 0]}>
            <cylinderGeometry args={[0.011, 0.013, 0.17, 8]} />
            <meshStandardMaterial color="#8A8578" roughness={0.4} metalness={0.5} />
          </mesh>
          <mesh position={[0, 0.6, 0]} scale={[antennaScale, antennaScale, antennaScale]}>
            <sphereGeometry args={[0.048, 20, 16]} />
            <meshStandardMaterial
              color={ORANGE}
              emissive={ORANGE}
              emissiveIntensity={antennaPulse}
              roughness={0.3}
            />
          </mesh>
        </group>
      </group>
    </group>
  );
};
