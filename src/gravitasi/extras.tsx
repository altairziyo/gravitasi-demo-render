import React from "react";
import { useCurrentFrame } from "remotion";
import { PALETTE } from "./timeline";

export type WargaPose =
  | "stand"
  | "hug"
  | "grip"
  | "sit"
  | "walk"
  | "type"
  | "freeze";

export type WargaProps = {
  position?: [number, number, number];
  rotationY?: number;
  /** Tinggi total figur dalam meter (dewasa ~1.7 m; anak ~1.224 m / scale 0.72). */
  tinggi?: number;
  skinColor?: string;
  shirtColor?: string;
  pantsColor?: string;
  pose?: WargaPose;
  /** Tambahan untuk mengombinasikan duduk + berpegangan (mis. S06-B, S06-F). */
  grip?: boolean;
  /** Warna helm keselamatan opsional. */
  helm?: string;
  /** Tampilkan celemek (true = krem default, atau string warna). */
  apron?: boolean | string;
  /** Warna kerudung opsional untuk ibu-ibu. */
  kerudung?: string;
  /** Seragam anak sekolah SD (atasan putih + bawahan merah). */
  seragam?: boolean;
  /** Sabuk pengaman oranye-hitam menyilang di dada saat duduk (untuk S06-A). */
  sabuk?: boolean;
  blinkOffset?: number;
  phaseOffset?: number;
  /** Sudut beku langkah saat pose="freeze". */
  freezePhase?: number;
};

type LimbRot = [number, number, number];

const WargaLeg: React.FC<{
  side: 1 | -1;
  pants: string;
  hipRot: LimbRot;
  kneeRotX: number;
}> = ({ side, pants, hipRot, kneeRotX }) => (
  <group position={[side * 0.1, 0.56, 0]} rotation={hipRot}>
    <mesh position={[0, -0.14, 0]}>
      <capsuleGeometry args={[0.068, 0.16, 6, 12]} />
      <meshStandardMaterial color={pants} roughness={0.9} />
    </mesh>
    <group position={[0, -0.28, 0]} rotation={[kneeRotX, 0, 0]}>
      <mesh position={[0, -0.12, 0]}>
        <capsuleGeometry args={[0.06, 0.15, 6, 12]} />
        <meshStandardMaterial color={pants} roughness={0.9} />
      </mesh>
      <mesh position={[0, -0.245, 0.03]}>
        <boxGeometry args={[0.09, 0.06, 0.18]} />
        <meshStandardMaterial color="#262220" roughness={0.75} />
      </mesh>
    </group>
  </group>
);

const WargaArm: React.FC<{
  side: 1 | -1;
  shirt: string;
  skin: string;
  rotation: LimbRot;
}> = ({ side, shirt, skin, rotation }) => (
  <group position={[side * 0.255, 1.13, 0]} rotation={rotation}>
    <mesh position={[0, -0.18, 0]}>
      <capsuleGeometry args={[0.056, 0.26, 6, 12]} />
      <meshStandardMaterial color={shirt} roughness={0.85} />
    </mesh>
    <mesh position={[0, -0.39, 0]}>
      <sphereGeometry args={[0.058, 12, 10]} />
      <meshStandardMaterial color={skin} roughness={0.5} />
    </mesh>
  </group>
);

/**
 * Figur warga prosedural yang ringan namun konsisten:
 * kepala sphere, badan capsule, lengan capsule sebagai grup terpisah, kaki berlutut,
 * serta varian seragam sekolah, celemek, kerudung, dan helm keselamatan.
 */
export const Warga: React.FC<WargaProps> = ({
  position = [0, 0, 0],
  rotationY = 0,
  tinggi = 1.7,
  skinColor = PALETTE.kulitWarga[0],
  shirtColor = PALETTE.bajuWarga[0],
  pantsColor = PALETTE.celanaWarga[0],
  pose = "stand",
  grip = false,
  helm,
  apron,
  kerudung,
  seragam = false,
  sabuk = false,
  blinkOffset = 0,
  phaseOffset = 0,
  freezePhase = 0.85,
}) => {
  const frame = useCurrentFrame();
  const isFrozen = pose === "freeze";
  const isSeated = pose === "sit" || pose === "type";

  const shirt = seragam ? "#F3F5F8" : shirtColor;
  const pants = seragam ? "#B6322E" : pantsColor;
  const scale = tinggi / 1.7;

  const blinkCycle = (frame + blinkOffset) % 115;
  const blinking = !isFrozen && blinkCycle < 5;

  const walkPhase = frame * 0.42 + phaseOffset;
  const walkBob = pose === "walk" ? Math.abs(Math.sin(walkPhase)) * 0.035 : 0;
  const idleBob = isFrozen
    ? 0
    : Math.sin(frame * 0.06 + phaseOffset) * 0.008;
  const seatDrop = isSeated ? -0.24 : 0;

  const legConfig = (side: 1 | -1): { hip: LimbRot; knee: number } => {
    if (isSeated) {
      return { hip: [-Math.PI / 2 + 0.05, 0, side * 0.06], knee: Math.PI / 2 - 0.05 };
    }
    if (pose === "walk") {
      const s = Math.sin(walkPhase + (side > 0 ? 0 : Math.PI));
      return { hip: [s * 0.48, 0, 0], knee: Math.max(0, -s * 0.35) };
    }
    if (pose === "freeze") {
      const s = Math.sin(freezePhase + (side > 0 ? 0 : Math.PI));
      return { hip: [s * 0.42, 0, 0], knee: Math.max(0, -s * 0.3) };
    }
    return { hip: [0, 0, 0], knee: 0 };
  };

  const armConfig = (side: 1 | -1): LimbRot => {
    if (pose === "hug") {
      return [-1.22, side * 0.42, side * -0.28];
    }
    if (pose === "grip" || (isSeated && grip)) {
      return [-1.32, side * 0.14, side * -0.08];
    }
    if (pose === "type") {
      const tap = Math.sin(frame * 0.85 + side * 2.1 + phaseOffset) * 0.05;
      return [-0.96 + tap, side * 0.12, side * -0.16];
    }
    if (pose === "sit") {
      return [-0.65, side * 0.1, side * -0.16];
    }
    if (pose === "walk") {
      const s = Math.sin(walkPhase + (side > 0 ? Math.PI : 0));
      return [s * 0.45, 0, side * 0.1];
    }
    if (pose === "freeze") {
      const s = Math.sin(freezePhase + (side > 0 ? Math.PI : 0));
      return [s * 0.38, 0, side * 0.12];
    }
    return [0, 0, side * 0.1];
  };

  const leftLeg = legConfig(-1);
  const rightLeg = legConfig(1);
  const apronColor = typeof apron === "string" ? apron : "#EDE7D8";

  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={[scale, scale, scale]}>
      {/* bayangan kontak lantai */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 0.72, 1]}>
        <circleGeometry args={[0.3, 18]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.22} depthWrite={false} />
      </mesh>

      <group position={[0, seatDrop + walkBob + idleBob, 0]}>
        <WargaLeg side={-1} pants={pants} hipRot={leftLeg.hip} kneeRotX={leftLeg.knee} />
        <WargaLeg side={1} pants={pants} hipRot={rightLeg.hip} kneeRotX={rightLeg.knee} />

        {/* badan kapsul */}
        <mesh position={[0, 0.9, 0]} scale={[1, 1, 0.74]}>
          <capsuleGeometry args={[0.21, 0.34, 8, 18]} />
          <meshStandardMaterial color={shirt} roughness={0.85} />
        </mesh>

        {/* celemek pedagang */}
        {apron && (
          <group>
            <mesh position={[0, 0.82, 0.155]}>
              <boxGeometry args={[0.3, 0.56, 0.03]} />
              <meshStandardMaterial color={apronColor} roughness={0.9} />
            </mesh>
            <mesh position={[0, 1.15, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.13, 0.016, 8, 18]} />
              <meshStandardMaterial color={apronColor} roughness={0.9} />
            </mesh>
          </group>
        )}

        {/* sabuk pengaman oranye-hitam menyilang di dada */}
        {sabuk && (
          <group>
            {([-0.58, 0.58] as const).map((ang) => (
              <group key={ang} position={[0, 0.92, 0.165]} rotation={[0, 0, ang]}>
                <mesh position={[0, 0, -0.002]}>
                  <boxGeometry args={[0.072, 0.45, 0.014]} />
                  <meshStandardMaterial color={PALETTE.rambuHitam} roughness={0.6} />
                </mesh>
                <mesh position={[0, 0, 0.004]}>
                  <boxGeometry args={[0.05, 0.45, 0.014]} />
                  <meshStandardMaterial color={PALETTE.sabukOranye} roughness={0.55} />
                </mesh>
              </group>
            ))}
            <mesh position={[0, 0.72, 0.163]}>
              <boxGeometry args={[0.38, 0.056, 0.016]} />
              <meshStandardMaterial color={PALETTE.rambuHitam} roughness={0.6} />
            </mesh>
            <mesh position={[0, 0.72, 0.169]}>
              <boxGeometry args={[0.36, 0.038, 0.014]} />
              <meshStandardMaterial color={PALETTE.sabukOranye} roughness={0.55} />
            </mesh>
            <mesh position={[0, 0.91, 0.18]}>
              <boxGeometry args={[0.09, 0.075, 0.022]} />
              <meshStandardMaterial color={PALETTE.rambuHitam} roughness={0.4} metalness={0.45} />
            </mesh>
          </group>
        )}

        {/* lengan */}
        <WargaArm side={-1} shirt={shirt} skin={skinColor} rotation={armConfig(-1)} />
        <WargaArm side={1} shirt={shirt} skin={skinColor} rotation={armConfig(1)} />

        {/* kepala */}
        <group position={[0, 1.46, 0]}>
          <mesh>
            <sphereGeometry args={[0.24, 24, 18]} />
            <meshStandardMaterial color={skinColor} roughness={0.45} />
          </mesh>

          {/* rambut dasar bila tidak berkerudung */}
          {!kerudung && (
            <mesh position={[0, 0.04, -0.03]} rotation={[-0.25, 0, 0]}>
              <sphereGeometry
                args={[0.246, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.55]}
              />
              <meshStandardMaterial color="#231D1A" roughness={0.9} />
            </mesh>
          )}

          {/* kerudung ibu-ibu */}
          {kerudung && (
            <group>
              <mesh position={[0, 0.01, -0.025]}>
                <sphereGeometry args={[0.256, 22, 16]} />
                <meshStandardMaterial color={kerudung} roughness={0.88} />
              </mesh>
              <mesh position={[0, -0.22, 0.01]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.19, 0.075, 10, 22]} />
                <meshStandardMaterial color={kerudung} roughness={0.88} />
              </mesh>
            </group>
          )}

          {/* helm keselamatan */}
          {helm && (
            <group position={[0, 0.05, 0]}>
              <mesh>
                <sphereGeometry
                  args={[0.268, 22, 12, 0, Math.PI * 2, 0, Math.PI * 0.54]}
                />
                <meshStandardMaterial color={helm} roughness={0.28} metalness={0.08} />
              </mesh>
              <mesh position={[0, 0.01, 0.16]} rotation={[0.15, 0, 0]}>
                <cylinderGeometry args={[0.24, 0.26, 0.026, 18, 1, false, -1.1, 2.2]} />
                <meshStandardMaterial color={helm} roughness={0.28} metalness={0.08} />
              </mesh>
            </group>
          )}

          {/* mata + mulut datar */}
          {([-1, 1] as const).map((side) => (
            <group
              key={side}
              position={[side * 0.085, 0.02, 0.215]}
              scale={[1, blinking ? 0.1 : 1, 1]}
            >
              <mesh scale={[0.042, 0.054, 0.02]}>
                <sphereGeometry args={[1, 12, 10]} />
                <meshStandardMaterial color="#ffffff" roughness={0.4} />
              </mesh>
              <mesh position={[0, 0, 0.016]}>
                <sphereGeometry args={[0.022, 10, 8]} />
                <meshStandardMaterial color="#181512" roughness={0.3} />
              </mesh>
            </group>
          ))}
          <mesh position={[0, -0.078, 0.226]}>
            <boxGeometry args={[0.07, 0.014, 0.014]} />
            <meshStandardMaterial color="#4A2D1E" roughness={0.6} />
          </mesh>
        </group>
      </group>
    </group>
  );
};

export type KucingMode = "duduk" | "melayang" | "mendarat" | "jalan";

export type KucingProps = {
  position?: [number, number, number];
  rotationY?: number;
  mode?: KucingMode;
  color?: string;
  phaseOffset?: number;
};

/**
 * Kucing warung prosedural oranye-putih:
 * badan capsule horizontal, kepala sphere + telinga kerucut, ekor melengkung, 4 kaki.
 */
export const Kucing: React.FC<KucingProps> = ({
  position = [0, 0, 0],
  rotationY = 0,
  mode = "duduk",
  color = "#E8923A",
  phaseOffset = 0,
}) => {
  const frame = useCurrentFrame();
  const phase = frame * 0.35 + phaseOffset;

  const isFloating = mode === "melayang";
  const isWalking = mode === "jalan";
  const isSitting = mode === "duduk";
  const isLanding = mode === "mendarat";

  const floatBob = isFloating ? Math.sin(frame * 0.14 + phaseOffset) * 0.04 : 0;
  const walkSway = isWalking ? Math.sin(phase) * 0.045 : 0;
  const bodyY = isSitting ? 0.24 : isLanding ? 0.19 : 0.27 + floatBob;
  const bodyPitch = isSitting ? -0.45 : isFloating ? Math.sin(frame * 0.11) * 0.08 : 0;

  const legRotX = (front: boolean, side: 1 | -1): number => {
    if (isFloating) {
      const p = frame * 0.42 + (front ? 0 : Math.PI) + (side > 0 ? 0 : Math.PI * 0.5);
      return Math.sin(p) * 0.65;
    }
    if (isWalking) {
      const diag = (front && side > 0) || (!front && side < 0) ? 0 : Math.PI;
      return Math.sin(phase + diag) * 0.5;
    }
    if (isSitting) {
      return front ? 0.35 : -0.95;
    }
    // mendarat: keempat kaki menjejak siap memegas
    return front ? -0.18 : 0.2;
  };

  const tailWag = isWalking
    ? Math.sin(frame * 0.28 + phaseOffset) * 0.36
    : isFloating
      ? Math.sin(frame * 0.18 + phaseOffset) * 0.25
      : 0.12;
  const tailPitch = isLanding || isWalking ? 0.75 : isSitting ? -0.35 : 0.2;

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <group
        position={[0, bodyY, 0]}
        rotation={[bodyPitch, 0, walkSway]}
      >
        {/* badan horizontal + dada putih */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <capsuleGeometry args={[0.105, 0.25, 8, 16]} />
          <meshStandardMaterial color={color} roughness={0.85} />
        </mesh>
        <mesh position={[0, -0.02, 0.04]} rotation={[Math.PI / 2, 0, 0]} scale={[0.72, 0.85, 0.85]}>
          <capsuleGeometry args={[0.095, 0.2, 6, 12]} />
          <meshStandardMaterial color="#F6F1E9" roughness={0.9} />
        </mesh>

        {/* kepala */}
        <group position={[0, 0.12, 0.2]} rotation={[-bodyPitch * 0.7, 0, 0]}>
          <mesh>
            <sphereGeometry args={[0.12, 18, 14]} />
            <meshStandardMaterial color={color} roughness={0.8} />
          </mesh>
          {/* moncong putih */}
          <mesh position={[0, -0.032, 0.095]} scale={[1.15, 0.85, 0.8]}>
            <sphereGeometry args={[0.048, 12, 10]} />
            <meshStandardMaterial color="#F6F1E9" roughness={0.85} />
          </mesh>
          <mesh position={[0, -0.014, 0.128]}>
            <sphereGeometry args={[0.014, 8, 8]} />
            <meshStandardMaterial color="#E68A8E" roughness={0.5} />
          </mesh>

          {/* telinga kerucut */}
          {([-1, 1] as const).map((side) => (
            <mesh
              key={side}
              position={[side * 0.072, 0.105, 0.01]}
              rotation={[0.1, 0, side * -0.32]}
            >
              <coneGeometry args={[0.042, 0.09, 8]} />
              <meshStandardMaterial color={color} roughness={0.8} />
            </mesh>
          ))}

          {/* mata (membulat besar saat melayang) */}
          {([-1, 1] as const).map((side) => (
            <group key={side} position={[side * 0.048, 0.022, 0.102]}>
              <mesh scale={[1, isFloating ? 1.25 : 0.95, 0.55]}>
                <sphereGeometry args={[0.025, 10, 8]} />
                <meshStandardMaterial color="#FFFDF5" roughness={0.3} />
              </mesh>
              <mesh position={[0, 0, 0.012]}>
                <sphereGeometry args={[isFloating ? 0.011 : 0.014, 8, 8]} />
                <meshStandardMaterial color="#1A1714" roughness={0.2} />
              </mesh>
            </group>
          ))}
        </group>

        {/* 4 kaki */}
        {([true, false] as const).map((front) =>
          ([-1, 1] as const).map((side) => (
            <group
              key={`${front ? "f" : "b"}${side}`}
              position={[side * 0.068, -0.06, front ? 0.12 : -0.12]}
              rotation={[legRotX(front, side), 0, isLanding ? side * 0.14 : 0]}
            >
              <mesh position={[0, -0.09, 0]}>
                <capsuleGeometry args={[0.028, 0.12, 6, 10]} />
                <meshStandardMaterial color={color} roughness={0.85} />
              </mesh>
              <mesh position={[0, -0.17, 0.015]}>
                <sphereGeometry args={[0.03, 8, 8]} />
                <meshStandardMaterial color="#F6F1E9" roughness={0.9} />
              </mesh>
            </group>
          )),
        )}

        {/* ekor melengkung bersegmen */}
        <group position={[0, 0.04, -0.18]} rotation={[tailPitch, tailWag, 0]}>
          <mesh position={[0, 0.06, -0.05]} rotation={[-0.65, 0, 0]}>
            <capsuleGeometry args={[0.022, 0.13, 6, 8]} />
            <meshStandardMaterial color={color} roughness={0.85} />
          </mesh>
          <mesh position={[0, 0.16, -0.09]} rotation={[0.25, 0, 0]}>
            <capsuleGeometry args={[0.02, 0.12, 6, 8]} />
            <meshStandardMaterial color={color} roughness={0.85} />
          </mesh>
        </group>
      </group>
    </group>
  );
};

export type VehicleProps = {
  position?: [number, number, number];
  rotationY?: number;
  color?: string;
  wheelSpin?: number;
  brakeLight?: boolean;
};

const Wheel: React.FC<{
  position: [number, number, number];
  radius: number;
  width: number;
  spin?: number;
}> = ({ position, radius, width, spin = 0 }) => (
  <group position={position} rotation={[spin, 0, 0]}>
    <mesh rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[radius, radius, width, 18]} />
      <meshStandardMaterial color="#23262B" roughness={0.9} />
    </mesh>
    <mesh rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[radius * 0.55, radius * 0.55, width + 0.015, 12]} />
      <meshStandardMaterial color="#AEB6BF" roughness={0.4} metalness={0.6} />
    </mesh>
  </group>
);

/**
 * Sepeda motor sederhana + 2 roda + pengendara Warga duduk berhelm.
 */
export const Motor: React.FC<
  VehicleProps & { rider?: boolean; riderHelm?: string }
> = ({
  position = [0, 0, 0],
  rotationY = 0,
  color = "#C84B31",
  rider = true,
  riderHelm = "#2C3540",
  wheelSpin = 0,
  brakeLight = false,
}) => (
  <group position={position} rotation={[0, rotationY, 0]}>
    <Wheel position={[0, 0.28, 0.6]} radius={0.28} width={0.1} spin={wheelSpin} />
    <Wheel position={[0, 0.28, -0.58]} radius={0.28} width={0.11} spin={wheelSpin} />

    {/* rangka & bodi motor */}
    <mesh position={[0, 0.52, 0]} rotation={[0.1, 0, 0]}>
      <boxGeometry args={[0.26, 0.28, 1.1]} />
      <meshStandardMaterial color={color} roughness={0.45} metalness={0.2} />
    </mesh>
    {/* jok */}
    <mesh position={[0, 0.68, -0.15]}>
      <boxGeometry args={[0.24, 0.08, 0.62]} />
      <meshStandardMaterial color="#222428" roughness={0.85} />
    </mesh>
    {/* garpu depan & setang */}
    <mesh position={[0, 0.72, 0.44]} rotation={[-0.36, 0, 0]}>
      <cylinderGeometry args={[0.04, 0.04, 0.68, 10]} />
      <meshStandardMaterial color="#58616B" roughness={0.4} metalness={0.7} />
    </mesh>
    <mesh position={[0, 0.98, 0.34]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.022, 0.022, 0.58, 8]} />
      <meshStandardMaterial color="#343940" roughness={0.5} metalness={0.6} />
    </mesh>
    {/* lampu depan & belakang */}
    <mesh position={[0, 0.88, 0.46]}>
      <sphereGeometry args={[0.075, 10, 8]} />
      <meshStandardMaterial
        color="#FFF5D6"
        emissive="#FFE7A0"
        emissiveIntensity={0.45}
      />
    </mesh>
    <mesh position={[0, 0.64, -0.58]}>
      <boxGeometry args={[0.12, 0.06, 0.04]} />
      <meshStandardMaterial
        color="#D93228"
        emissive="#FF3A28"
        emissiveIntensity={brakeLight ? 1.4 : 0.25}
      />
    </mesh>

    {rider && (
      <Warga
        position={[0, 0.44, -0.12]}
        pose="sit"
        grip
        helm={riderHelm}
        shirtColor="#3D566E"
        pantsColor="#2E3238"
      />
    )}
  </group>
);

/**
 * Mobil penumpang sederhana (bodi + kabin + kaca gelap + 4 roda).
 */
export const Mobil: React.FC<VehicleProps> = ({
  position = [0, 0, 0],
  rotationY = 0,
  color = "#D8D2C5",
  wheelSpin = 0,
  brakeLight = false,
}) => (
  <group position={position} rotation={[0, rotationY, 0]}>
    <Wheel position={[-0.78, 0.31, 1.15]} radius={0.31} width={0.2} spin={wheelSpin} />
    <Wheel position={[0.78, 0.31, 1.15]} radius={0.31} width={0.2} spin={wheelSpin} />
    <Wheel position={[-0.78, 0.31, -1.15]} radius={0.31} width={0.2} spin={wheelSpin} />
    <Wheel position={[0.78, 0.31, -1.15]} radius={0.31} width={0.2} spin={wheelSpin} />

    {/* bodi bawah */}
    <mesh position={[0, 0.62, 0]}>
      <boxGeometry args={[1.64, 0.54, 3.7]} />
      <meshStandardMaterial color={color} roughness={0.45} metalness={0.2} />
    </mesh>
    {/* kabin */}
    <mesh position={[0, 1.12, -0.15]}>
      <boxGeometry args={[1.42, 0.48, 1.95]} />
      <meshStandardMaterial color={color} roughness={0.45} metalness={0.2} />
    </mesh>
    {/* kaca depan-belakang & samping gelap */}
    <mesh position={[0, 1.13, -0.15]}>
      <boxGeometry args={[1.45, 0.36, 1.72]} />
      <meshStandardMaterial color="#273645" roughness={0.22} metalness={0.35} />
    </mesh>
    <mesh position={[0, 1.13, -0.15]}>
      <boxGeometry args={[1.24, 0.36, 1.98]} />
      <meshStandardMaterial color="#273645" roughness={0.22} metalness={0.35} />
    </mesh>
    {/* bemper & lampu */}
    <mesh position={[0, 0.44, 1.87]}>
      <boxGeometry args={[1.6, 0.16, 0.08]} />
      <meshStandardMaterial color="#34383E" roughness={0.8} />
    </mesh>
    <mesh position={[0, 0.44, -1.87]}>
      <boxGeometry args={[1.6, 0.16, 0.08]} />
      <meshStandardMaterial color="#34383E" roughness={0.8} />
    </mesh>
    {([-0.58, 0.58] as const).map((x) => (
      <React.Fragment key={x}>
        <mesh position={[x, 0.66, 1.86]}>
          <boxGeometry args={[0.26, 0.12, 0.04]} />
          <meshStandardMaterial
            color="#FFF5D6"
            emissive="#FFE8A8"
            emissiveIntensity={0.3}
          />
        </mesh>
        <mesh position={[x, 0.66, -1.86]}>
          <boxGeometry args={[0.26, 0.12, 0.04]} />
          <meshStandardMaterial
            color="#D93228"
            emissive="#FF3A28"
            emissiveIntensity={brakeLight ? 1.5 : 0.25}
          />
        </mesh>
      </React.Fragment>
    ))}
  </group>
);

/**
 * Angkot kotak (minibus biru kota dengan pita atap, jendela gelap, dan 4 roda).
 */
export const Angkot: React.FC<VehicleProps> = ({
  position = [0, 0, 0],
  rotationY = 0,
  color = "#2B78B8",
  wheelSpin = 0,
  brakeLight = false,
}) => (
  <group position={position} rotation={[0, rotationY, 0]}>
    <Wheel position={[-0.76, 0.3, 1.15]} radius={0.3} width={0.2} spin={wheelSpin} />
    <Wheel position={[0.76, 0.3, 1.15]} radius={0.3} width={0.2} spin={wheelSpin} />
    <Wheel position={[-0.76, 0.3, -1.15]} radius={0.3} width={0.2} spin={wheelSpin} />
    <Wheel position={[0.76, 0.3, -1.15]} radius={0.3} width={0.2} spin={wheelSpin} />

    {/* bodi van penuh */}
    <mesh position={[0, 1.05, 0]}>
      <boxGeometry args={[1.6, 1.38, 3.75]} />
      <meshStandardMaterial color={color} roughness={0.5} metalness={0.15} />
    </mesh>
    {/* pita putih khas di sabuk tengah & atap */}
    <mesh position={[0, 1.76, 0]}>
      <boxGeometry args={[1.56, 0.06, 3.66]} />
      <meshStandardMaterial color="#F2EFE6" roughness={0.6} />
    </mesh>
    <mesh position={[0, 0.88, 0]}>
      <boxGeometry args={[1.62, 0.1, 3.77]} />
      <meshStandardMaterial color="#F2EFE6" roughness={0.6} />
    </mesh>
    {/* jendela gelap keliling */}
    <mesh position={[0, 1.32, -0.05]}>
      <boxGeometry args={[1.62, 0.48, 3.3]} />
      <meshStandardMaterial color="#273645" roughness={0.22} metalness={0.35} />
    </mesh>
    <mesh position={[0, 1.32, 0]}>
      <boxGeometry args={[1.38, 0.48, 3.77]} />
      <meshStandardMaterial color="#273645" roughness={0.22} metalness={0.35} />
    </mesh>
    {/* papan trayek di atap depan */}
    <mesh position={[0, 1.85, 1.32]}>
      <boxGeometry args={[0.72, 0.14, 0.16]} />
      <meshStandardMaterial color="#F4B829" roughness={0.6} />
    </mesh>
    {([-0.55, 0.55] as const).map((x) => (
      <React.Fragment key={x}>
        <mesh position={[x, 0.62, 1.89]}>
          <boxGeometry args={[0.24, 0.12, 0.04]} />
          <meshStandardMaterial color="#FFF5D6" emissive="#FFE8A8" emissiveIntensity={0.3} />
        </mesh>
        <mesh position={[x, 0.62, -1.89]}>
          <boxGeometry args={[0.24, 0.12, 0.04]} />
          <meshStandardMaterial
            color="#D93228"
            emissive="#FF3A28"
            emissiveIntensity={brakeLight ? 1.5 : 0.25}
          />
        </mesh>
      </React.Fragment>
    ))}
  </group>
);
