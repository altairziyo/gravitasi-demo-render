import React from "react";
import { useCurrentFrame } from "remotion";
import { labelTexture, stripesTexture } from "./textures";

/**
 * Rig karakter 3D universal gaya "Gimana Kalau?" (three.js).
 * Satu rig untuk semua tokoh: kepala BOLA hitam besar glossy, mata putih oval
 * di permukaan kepala (berkedip via scale Y, berganti ekspresi via konfigurasi),
 * blush, mulut kecil. Diferensiasi lewat outfit + ekspresi saja — sama seperti 2D.
 * Satuan meter; asal grup di lantai tepat di bawah kaki. Tinggi total ±1,87.
 * Kepala pusat y=1,47 r=0,40. Tokoh menghadap +Z.
 */
export type Outfit3D = "tahanan" | "sipir" | "hoodie";
export type Expression3D = "normal" | "kaget" | "mikir" | "licik";
export type ArmPose3D = "down" | "up" | "point";

const SKIN = "#1b1b21";

type Props = {
  outfit: Outfit3D;
  expression?: Expression3D;
  talking?: boolean;
  walking?: boolean;
  armPose?: ArmPose3D;
  blinkOffset?: number;
  label?: string;
  position?: [number, number, number];
  rotationY?: number;
};

type EyeCfg = { h: number; pupil: number; dx: number; dy: number };
const EYE_CFG: Record<Expression3D, EyeCfg> = {
  normal: { h: 0.115, pupil: 0.036, dx: 0, dy: 0 },
  kaget: { h: 0.14, pupil: 0.023, dx: 0, dy: 0.008 },
  mikir: { h: 0.07, pupil: 0.032, dx: 0.02, dy: -0.008 },
  licik: { h: 0.082, pupil: 0.03, dx: -0.02, dy: 0 },
};

const browFor = (
  expression: Expression3D,
  side: 1 | -1,
): { y: number; rz: number } => {
  switch (expression) {
    case "kaget":
      return { y: 0.238, rz: side * 0.18 };
    case "mikir":
      // satu alis terangkat (sisi -1), satu datar
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
    {/* putih mata: bola pipih menempel di permukaan kepala */}
    <mesh scale={[0.08, cfg.h, 0.038]}>
      <sphereGeometry args={[1, 24, 16]} />
      <meshStandardMaterial color="#ffffff" roughness={0.35} />
    </mesh>
    {/* pupil */}
    <mesh position={[cfg.dx, cfg.dy, 0.03]}>
      <sphereGeometry args={[cfg.pupil, 16, 12]} />
      <meshStandardMaterial color="#101014" roughness={0.3} />
    </mesh>
    {/* kilau pupil */}
    <mesh position={[cfg.dx + 0.012, cfg.dy + 0.014, 0.06]}>
      <sphereGeometry args={[0.009, 8, 8]} />
      <meshBasicMaterial color="#ffffff" />
    </mesh>
  </group>
);

const Mouth: React.FC<{ expression: Expression3D; talking: boolean; frame: number }> = ({
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
  const tilt = expression === "licik" ? Math.PI + 0.28 : Math.PI;
  const r = expression === "mikir" ? 0.038 : 0.048;
  return (
    <mesh position={[0, -0.128, 0.382]} rotation={[0, 0, tilt]}>
      <torusGeometry args={[r, 0.0085, 8, 20, Math.PI]} />
      <meshStandardMaterial color="#0c0c10" roughness={0.5} />
    </mesh>
  );
};

const Arm: React.FC<{
  side: 1 | -1;
  color: string;
  rotation: [number, number, number];
}> = ({ side, color, rotation }) => (
  <group position={[side * 0.335, 1.1, 0]} rotation={rotation}>
    <mesh position={[0, -0.21, 0]}>
      <capsuleGeometry args={[0.068, 0.3, 6, 16]} />
      <meshStandardMaterial color={color} roughness={0.85} />
    </mesh>
    <mesh position={[0, -0.47, 0]}>
      <sphereGeometry args={[0.072, 16, 12]} />
      <meshStandardMaterial color={SKIN} roughness={0.45} />
    </mesh>
  </group>
);

const Leg: React.FC<{
  side: 1 | -1;
  color: string;
  swing: number;
}> = ({ side, color, swing }) => (
  <group position={[side * 0.115, 0.56, 0]} rotation={[swing, 0, 0]}>
    <mesh position={[0, -0.22, 0]}>
      <capsuleGeometry args={[0.082, 0.28, 6, 16]} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
    <mesh position={[0, -0.505, 0.035]}>
      <boxGeometry args={[0.105, 0.07, 0.21]} />
      <meshStandardMaterial color="#22242a" roughness={0.7} />
    </mesh>
  </group>
);

export const Character3D: React.FC<Props> = ({
  outfit,
  expression = "normal",
  talking = false,
  walking = false,
  armPose = "down",
  blinkOffset = 0,
  label = "C-07",
  position = [0, 0, 0],
  rotationY = 0,
}) => {
  const frame = useCurrentFrame();

  const blinkCycle = (frame + blinkOffset) % 105;
  const blinking = blinkCycle < 5;

  const phase = frame * 0.55;
  const bob = walking ? Math.abs(Math.sin(phase)) * 0.045 : 0;
  const sway = walking ? Math.sin(phase) * 0.03 : Math.sin(frame * 0.05) * 0.008;

  const pants =
    outfit === "sipir" ? "#22354f" : outfit === "hoodie" ? "#3a3f47" : "#8a8f96";
  const sleeve =
    outfit === "sipir" ? "#2e4a73" : outfit === "hoodie" ? "#c03a30" : "#e8862e";

  const armRotation = (side: 1 | -1): [number, number, number] => {
    // lengan sisi -1 adalah lengan pose (up/point)
    if (side === -1 && armPose === "up") return [0, 0, 2.35];
    if (side === -1 && armPose === "point") return [-1.3, 0, -0.05];
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
        <Leg side={-1} color={pants} swing={walking ? Math.sin(phase + Math.PI) * 0.55 : 0} />
        <Leg side={1} color={pants} swing={walking ? Math.sin(phase) * 0.55 : 0} />

        {/* badan kapsul */}
        <mesh position={[0, 0.88, 0]} scale={[1, 1, 0.74]}>
          <capsuleGeometry args={[0.295, 0.34, 8, 24]} />
          {outfit === "tahanan" ? (
            <meshStandardMaterial map={stripesTexture()} roughness={0.85} />
          ) : outfit === "sipir" ? (
            <meshStandardMaterial color="#2e4a73" roughness={0.85} />
          ) : (
            <meshStandardMaterial color="#c03a30" roughness={0.85} />
          )}
        </mesh>

        {/* detail outfit di dada */}
        {outfit === "tahanan" && (
          <mesh position={[0, 0.98, 0.222]}>
            <planeGeometry args={[0.17, 0.09]} />
            <meshStandardMaterial map={labelTexture(label)} roughness={0.6} />
          </mesh>
        )}
        {outfit === "sipir" && (
          <>
            <mesh position={[0, 0.95, 0.212]}>
              <boxGeometry args={[0.07, 0.3, 0.02]} />
              <meshStandardMaterial color="#24405f" roughness={0.7} />
            </mesh>
            {[0.78, 0.92, 1.06].map((y) => (
              <mesh key={y} position={[0.09, y, 0.208]}>
                <sphereGeometry args={[0.016, 10, 8]} />
                <meshStandardMaterial color="#e8c85a" roughness={0.35} metalness={0.6} />
              </mesh>
            ))}
            <mesh position={[-0.25, 1.14, 0]}>
              <boxGeometry args={[0.15, 0.04, 0.1]} />
              <meshStandardMaterial color="#e8c85a" roughness={0.35} metalness={0.6} />
            </mesh>
          </>
        )}
        {outfit === "hoodie" && (
          <>
            <mesh position={[0, 0.68, 0.2]}>
              <boxGeometry args={[0.26, 0.15, 0.03]} />
              <meshStandardMaterial color="#a8322a" roughness={0.9} />
            </mesh>
            {[-0.045, 0.045].map((x) => (
              <mesh key={x} position={[x, 1.06, 0.215]} rotation={[0.15, 0, 0]}>
                <cylinderGeometry args={[0.008, 0.008, 0.11, 6]} />
                <meshStandardMaterial color="#f2d0cb" roughness={0.8} />
              </mesh>
            ))}
          </>
        )}

        {/* lengan */}
        <Arm side={-1} color={sleeve} rotation={armRotation(-1)} />
        <Arm side={1} color={sleeve} rotation={armRotation(1)} />

        {/* tudung hoodie: bola sedikit lebih besar di belakang kepala */}
        {outfit === "hoodie" && (
          <mesh position={[0, 1.48, -0.075]}>
            <sphereGeometry args={[0.435, 32, 24]} />
            <meshStandardMaterial color="#a8322a" roughness={0.9} />
          </mesh>
        )}

        {/* kepala */}
        <group position={[0, 1.47, 0]} rotation={[expression === "mikir" ? 0.06 : 0, 0, expression === "mikir" ? 0.05 : 0]}>
          <mesh>
            <sphereGeometry args={[0.4, 48, 32]} />
            <meshStandardMaterial color="#26262e" roughness={0.3} metalness={0.05} />
          </mesh>

          {/* topi sipir */}
          {outfit === "sipir" && (
            <group rotation={[0.05, 0, 0]}>
              <mesh position={[0, 0.335, 0.01]}>
                <cylinderGeometry args={[0.295, 0.315, 0.17, 24]} />
                <meshStandardMaterial color="#22354f" roughness={0.8} />
              </mesh>
              <mesh position={[0, 0.255, 0.03]}>
                <cylinderGeometry args={[0.325, 0.325, 0.028, 24]} />
                <meshStandardMaterial color="#182a42" roughness={0.8} />
              </mesh>
              <mesh position={[0, 0.33, 0.295]}>
                <sphereGeometry args={[0.028, 12, 10]} />
                <meshStandardMaterial color="#e8c85a" roughness={0.3} metalness={0.7} />
              </mesh>
            </group>
          )}

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
                <meshStandardMaterial color="#0c0c10" roughness={0.5} />
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
              <meshBasicMaterial color="#e88ca0" transparent opacity={0.5} depthWrite={false} />
            </mesh>
          ))}

          <Mouth expression={expression} talking={talking} frame={frame} />
        </group>
      </group>
    </group>
  );
};
