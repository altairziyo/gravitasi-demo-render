import React from "react";
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
import { Dimas3D, DimasArmPose, DimasExpression } from "./three/Dimas3D";
import { LocationBanner, TimePill } from "./Graphics";
import {
  HEIGHT,
  PALETTE,
  RHYME_FALL_CAM,
  SHOT_FRAMES,
  SHOTS,
  ShotId,
  TOTAL_FRAMES,
  WIDTH,
} from "./gravitasi/timeline";
import {
  CamPose,
  LIGHT_PRESETS,
  LightsBlend,
  LightsMelayang,
  LightsStandar,
  LightsTerikKunci,
  Rig,
  ShakeWrap,
  Vec3,
} from "./gravitasi/rig";
import { Angkot, Kucing, Mobil, Motor, Warga } from "./gravitasi/extras";
import {
  Gerobak,
  JalanRayaKunci,
  JaringSamar,
  KANTOR_SEATS,
  KELAS_SEATS,
  MenaraJam,
  PASAR_VENDOR_POS,
  PROYEK_WORKERS,
  PagarSekolah,
  RS_NURSE_POS,
  Rambu1,
  SetKantor,
  SetKelas,
  SetPasar,
  SetProyek,
  SetRS,
  SetTrotoarHelm,
  TiangLampu,
  TiangRambuPolos,
  WarungSoto,
} from "./gravitasi/sets";
import {
  BolaEsTeh,
  CipratanKuah,
  DebuBenturan,
  GelasEsTeh,
  GelembungKuah,
  KerikilDaun,
  Koran,
  MangkukSoto,
  PiringPlastik,
  Sendok,
  SyalRibbon,
  Topi,
} from "./gravitasi/fx";

// Verifikasi tabel timeline tepat 36 sequence dan 6041 frame
const verifiedSum = SHOTS.reduce((acc, s) => acc + s.frames, 0);
if (SHOTS.length !== 36 || verifiedSum !== TOTAL_FRAMES) {
  throw new Error(
    `Timeline GravitasiDemo harus 36 sequence / ${TOTAL_FRAMES} frame, terhitung ${SHOTS.length} / ${verifiedSum}`,
  );
}

const CLAMP = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const lerpVec3 = (a: Vec3, b: Vec3, t: number): [number, number, number] => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
];

const lerpHex = (a: string, b: string, t: number): string => {
  const c = new THREE.Color(a).lerp(new THREE.Color(b), Math.max(0, Math.min(1, t)));
  return `#${c.getHexString()}`;
};

/** Kurva pantulan kontinu mulus untuk piring/sendok setelah menyentuh permukaan. */
const bounceArc = (
  frame: number,
  impactFrame: number,
  bounces: Array<{ dur: number; height: number }>,
): number => {
  let cursor = impactFrame;
  for (const b of bounces) {
    if (frame >= cursor && frame < cursor + b.dur) {
      const s = (frame - cursor) / b.dur;
      return 4 * b.height * s * (1 - s);
    }
    cursor += b.dur;
  }
  return 0;
};

type CamSegment = {
  startFrame: number;
  endFrame: number;
  from: CamPose;
  to: CamPose;
  easing: (t: number) => number;
};

/** Kamera multi-segmen kontinu per frame dengan easing khusus tiap segmen. */
const MultiPhaseRig: React.FC<{ segments: CamSegment[] }> = ({ segments }) => {
  const frame = useCurrentFrame();
  const camera = useThree((s) => s.camera);

  const active =
    segments.find((seg) => frame <= seg.endFrame) ?? segments[segments.length - 1];
  const t =
    active.endFrame > active.startFrame
      ? interpolate(frame, [active.startFrame, active.endFrame], [0, 1], {
          ...CLAMP,
          easing: active.easing,
        })
      : 1;

  camera.up.set(0, 1, 0);
  camera.position.set(...lerpVec3(active.from.pos, active.to.pos, t));
  camera.lookAt(...lerpVec3(active.from.look, active.to.look, t));
  return null;
};

type ShotCanvasProps = {
  frames: number;
  from: CamPose;
  to: CamPose;
  up?: Vec3;
  easing?: (t: number) => number;
  startFrame?: number;
  endFrame?: number;
  sky?: string;
  lights?: React.ReactNode;
  multiSegments?: CamSegment[];
  children: React.ReactNode;
};

const ShotCanvas: React.FC<ShotCanvasProps> = ({
  frames,
  from,
  to,
  up = [0, 1, 0],
  easing = Easing.inOut(Easing.cubic),
  startFrame = 0,
  endFrame,
  sky = PALETTE.langitStandar,
  lights = <LightsStandar />,
  multiSegments,
  children,
}) => (
  <ThreeCanvas
    width={WIDTH}
    height={HEIGHT}
    camera={{
      fov: from.fov ?? 38,
      near: 0.1,
      far: 450,
      position: [from.pos[0], from.pos[1], from.pos[2]],
    }}
  >
    <color attach="background" args={[sky]} />
    {lights}
    {multiSegments ? (
      <MultiPhaseRig segments={multiSegments} />
    ) : (
      <Rig
        from={from}
        to={to}
        up={up}
        easing={easing}
        startFrame={startFrame}
        endFrame={endFrame ?? frames - 1}
        durationInFrames={frames}
      />
    )}
    {children}
  </ThreeCanvas>
);

/** Pelat trotoar penghubung di depan WarungSoto agar pijakan S05-C/D menyatu dengan trotoar utama. */
const SidewalkApron: React.FC = () => (
  <mesh position={[-1.0, 0.075, 44.0]}>
    <boxGeometry args={[2.1, 0.15, 16.0]} />
    <meshStandardMaterial color={PALETTE.trotoar} roughness={0.92} />
  </mesh>
);

/**
 * Wrapper Dimas terduduk berselonjor di trotoar tanpa memodifikasi Dimas3D.tsx:
 * menurunkan kaki bawah ke bawah pelat trotoar Y=0.15 dan menambahkan dua tungkai
 * berselonjor ke depan berwarna celana/sepatu yang identik.
 */
const DimasSeated: React.FC<{
  position: [number, number, number];
  rotationY?: number;
  tiltX?: number;
  expression?: DimasExpression;
  armPose?: DimasArmPose;
  adjustAmount?: number;
  goggleLift?: number;
}> = ({
  position,
  rotationY = 0,
  tiltX = -0.08,
  expression = "normal",
  armPose = "down",
  adjustAmount = 0,
  goggleLift = 0,
}) => (
  <group position={position} rotation={[0, rotationY, 0]}>
    {/* tungkai berselonjor di atas trotoar */}
    {([-1, 1] as const).map((side) => (
      <group key={side} position={[side * 0.14, 0.085, 0.24]}>
        <mesh rotation={[Math.PI / 2 - 0.04, side * 0.08, 0]}>
          <capsuleGeometry args={[0.082, 0.48, 6, 14]} />
          <meshStandardMaterial color="#4A4038" roughness={0.9} />
        </mesh>
        <mesh position={[side * 0.03, 0.02, 0.34]} rotation={[-0.18, side * 0.08, 0]}>
          <boxGeometry args={[0.105, 0.19, 0.08]} />
          <meshStandardMaterial color="#2A2320" roughness={0.7} />
        </mesh>
      </group>
    ))}
    {/* badan tegak terduduk sedikit miring ke belakang */}
    <group position={[0, -0.44, 0]} rotation={[tiltX, 0, 0]}>
      <Dimas3D
        expression={expression}
        armPose={armPose}
        adjustAmount={adjustAmount}
        goggleLift={goggleLift}
      />
    </group>
  </group>
);

// ============================================================================
// S01 — Cold open: jatuh Hari ke-30 di atas aspal
// ============================================================================

const ShotS01A: React.FC = () => {
  const frame = useCurrentFrame();
  const frames = SHOT_FRAMES["S01-A"];
  // Pita syal kunyit melintas cepat diagonal kanan-atas -> kiri-bawah di paruh kedua (~10-12 frame)
  const sweepT = interpolate(frame, [46, 68], [0, 1], {
    ...CLAMP,
    easing: Easing.inOut(Easing.sin),
  });
  const sx = lerp(11.8, 7.2, sweepT);
  const sy = lerp(29.3, 27.1, sweepT);

  return (
    <AbsoluteFill>
      <ShotCanvas
        frames={frames}
        from={{ pos: [9.5, 28.0, -14.0], look: [9.5, 31.5, -24.0], fov: 52 }}
        to={{ pos: [9.5, 27.2, -14.8], look: [9.5, 29.8, -24.0], fov: 52 }}
        easing={Easing.inOut(Easing.sin)}
        sky={PALETTE.langitTerik}
        lights={<LightsTerikKunci />}
      >
        {/* gumpalan awan jauh sangat tipis untuk rasa ruang langit 95% */}
        {[
          [-14, 46, -90, 26, 7],
          [24, 52, -110, 32, 8],
          [4, 48, -125, 38, 9],
        ].map(([cx, cy, cz, cw, ch], i) => (
          <mesh key={i} position={[cx, cy, cz]}>
            <planeGeometry args={[cw, ch]} />
            <meshBasicMaterial color="#E6F2FA" transparent opacity={0.32} depthWrite={false} />
          </mesh>
        ))}

        {frame >= 46 && frame <= 68 && (
          <SyalRibbon
            position={[sx, sy, -16.2]}
            rotation={[0.25, 0.12, 0.58]}
            length={2.2}
            width={0.34}
            wavePhase={frame * 0.25}
          />
        )}
      </ShotCanvas>
    </AbsoluteFill>
  );
};

const ShotS01B: React.FC = () => {
  const frames = SHOT_FRAMES["S01-B"];
  return (
    <AbsoluteFill>
      <ShotCanvas
        frames={frames}
        from={{ pos: [9.5, 34.0, -17.0], look: [9.5, 0.0, -18.5], fov: 50 }}
        to={{ pos: [9.5, 22.0, -17.5], look: [9.5, 0.0, -18.2], fov: 50 }}
        up={[0, 0, -1]}
        easing={Easing.in(Easing.quad)}
        sky={PALETTE.langitTerik}
        lights={<LightsTerikKunci />}
      >
        <JalanRayaKunci showParkedVehicles showBackgroundTown />
      </ShotCanvas>
    </AbsoluteFill>
  );
};

/** Bidang apron aspal lebar di bawah koridor jatuh agar aspal #2E3238 mendominasi frame S01-C & S01-D. */
const FallAsphaltApron: React.FC = () => (
  <mesh position={[10.0, -0.002, -18.0]} rotation={[-Math.PI / 2, 0, 0]}>
    <planeGeometry args={[44, 48]} />
    <meshStandardMaterial color={PALETTE.aspal} roughness={0.92} />
  </mesh>
);

const ShotS01C: React.FC = () => {
  const frame = useCurrentFrame();
  const frames = SHOT_FRAMES["S01-C"];
  const t = interpolate(frame, [0, frames - 1], [0, 1], {
    ...CLAMP,
    easing: Easing.inOut(Easing.quad),
  });
  const footY = lerp(20.0, 14.2, t);
  const footX = lerp(6.3, 7.0, t);
  const footZ = lerp(-16.4, -17.0, t);

  return (
    <AbsoluteFill>
      <ShotCanvas
        frames={frames}
        from={{ pos: [8.2, 23.5, -14.5], look: [9.5, 3.0, -18.0], fov: 42 }}
        to={{ pos: [8.6, 17.0, -15.5], look: [9.5, 3.0, -18.0], fov: 42 }}
        up={[0, 0, -1]}
        easing={Easing.inOut(Easing.quad)}
        sky={PALETTE.langitTerik}
        lights={<LightsTerikKunci />}
      >
        <JalanRayaKunci showParkedVehicles={false} showBackgroundTown={false} />
        <FallAsphaltApron />
        {/* hanya lembaran jaring atas di Y=3.0 kuadran kanan-bawah; TANPA roda/rangka/petugas */}
        <JaringSamar position={[11.4, 3.0, -15.6]} size={3.4} />
        {/* hanya ujung kaki + syal di tepi kiri-atas */}
        <group position={[footX, footY, footZ]} rotation={RHYME_FALL_CAM.bodyRotation}>
          <Dimas3D expression="kaget" armPose="up" />
        </group>
      </ShotCanvas>
    </AbsoluteFill>
  );
};

const ShotS01D: React.FC = () => {
  const frame = useCurrentFrame();
  const frames = SHOT_FRAMES["S01-D"];
  const t = interpolate(frame, [0, frames - 1], [0, 1], {
    ...CLAMP,
    easing: Easing.in(Easing.quad),
  });
  const y = lerp(RHYME_FALL_CAM.yFrom, RHYME_FALL_CAM.yTo, t);

  return (
    <AbsoluteFill>
      <ShotCanvas
        frames={frames}
        from={RHYME_FALL_CAM.from}
        to={RHYME_FALL_CAM.to}
        up={RHYME_FALL_CAM.up}
        easing={Easing.in(Easing.quad)}
        sky={RHYME_FALL_CAM.skyColor}
        lights={<LightsTerikKunci />}
      >
        <JalanRayaKunci showParkedVehicles={false} showBackgroundTown={false} />
        <FallAsphaltApron />
        {/* jaring hanya bidang anyaman kecil samar (~85 px) di kanan-bawah frame, tanpa roda/rangka/petugas */}
        <JaringSamar position={[15.8, 3.0, -16.2]} size={1.65} opacity={0.36} />
        <group
          position={[RHYME_FALL_CAM.axisX, y, RHYME_FALL_CAM.axisZ]}
          rotation={RHYME_FALL_CAM.bodyRotation}
        >
          <Dimas3D position={[0, -0.9, 0]} expression="kaget" armPose="up" />
        </group>
      </ShotCanvas>
    </AbsoluteFill>
  );
};

const ShotS01E: React.FC = () => {
  const frame = useCurrentFrame();
  const frames = SHOT_FRAMES["S01-E"];
  const t = interpolate(frame, [0, frames - 1], [0, 1], {
    ...CLAMP,
    easing: Easing.in(Easing.cubic),
  });
  const y = lerp(17.0, 5.5, t);
  const signSweepY = interpolate(frame, [72, frames - 1], [4.0, 6.9], {
    ...CLAMP,
    easing: Easing.in(Easing.quad),
  });

  const citizenDots: Array<[number, number, number]> = [
    [-6.5, 0, -16],
    [-9.2, 0, -12],
    [-12.0, 0, -18],
    [-15.5, 0, -14],
    [-8.0, 0, -24],
    [-11.0, 0, -8],
    [-16.2, 0, -22],
    [-4.8, 0, -20],
  ];

  return (
    <AbsoluteFill>
      <ShotCanvas
        frames={frames}
        from={{ pos: [13.8, 17.5, -12.0], look: [8.0, 12.0, -18.5], fov: 48 }}
        to={{ pos: [12.5, 9.2, -13.5], look: [9.5, 5.2, -18.0], fov: 48 }}
        easing={Easing.in(Easing.cubic)}
        sky={PALETTE.langitTerik}
        lights={<LightsTerikKunci />}
      >
        <JalanRayaKunci showParkedVehicles showBackgroundTown />
        <MenaraJam position={[-14, 0, -58]} menit={12 * 60 + 4 / 60} />
        {citizenDots.map(([wx, wy, wz], idx) => (
          <Warga
            key={idx}
            position={[wx, wy, wz]}
            pose="stand"
            shirtColor={PALETTE.bajuWarga[idx % PALETTE.bajuWarga.length]}
          />
        ))}
        <group position={[9.5, y, -18.0]} rotation={RHYME_FALL_CAM.bodyRotation}>
          <Dimas3D position={[0, -0.9, 0]} expression="kaget" armPose="up" />
        </group>
        {/* satu tiang rambu melintas cepat di foreground kanan di akhir shot */}
        <TiangRambuPolos
          position={[12.4, signSweepY, -15.3]}
          rotationY={-0.35}
          scale={1.35}
        />
      </ShotCanvas>
    </AbsoluteFill>
  );
};

const ShotHitam: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000000" }} />
);

// ============================================================================
// S02 — Mundur ke awal: premis dunia
// ============================================================================

const ShotS02A: React.FC = () => {
  const frame = useCurrentFrame();
  const frames = SHOT_FRAMES["S02-A"];
  const t = interpolate(frame, [0, frames - 1], [0, 1], {
    ...CLAMP,
    easing: Easing.inOut(Easing.cubic),
  });

  // Up-vector terinterpolasi kontinu dari [0,0,-1] (S01-D) ke [0,1,0] (tegak) + roll maks <=15 deg
  const ang = t * (Math.PI / 2);
  const roll = Math.sin(t * Math.PI) * 0.22;
  const upVec: Vec3 = [roll, Math.sin(ang), -Math.cos(ang)];

  const y = lerp(RHYME_FALL_CAM.yTo, 22.0, t);
  const rotX = lerp(-Math.PI / 2, 0, t);
  const rotY = lerp(0.18, 0, t);
  const rotZ = lerp(0.22, 0.14 * Math.sin(t * Math.PI), t);

  const sky = lerpHex(PALETTE.langitTerik, PALETTE.langitStandar, t);
  const overlayFade = interpolate(frame, [0, 16, frames - 18, frames - 1], [0.9, 1, 1, 0], CLAMP);

  return (
    <AbsoluteFill>
      <ShotCanvas
        frames={frames}
        from={RHYME_FALL_CAM.to}
        to={{ pos: [7.5, 24.5, -14.0], look: [9.5, 22.0, -24.0], fov: 40 }}
        up={upVec}
        easing={Easing.inOut(Easing.cubic)}
        sky={sky}
        lights={
          <LightsBlend
            from={LIGHT_PRESETS.TerikKunci}
            to={LIGHT_PRESETS.Standar}
            t={t}
          />
        }
      >
        <JalanRayaKunci showParkedVehicles showBackgroundTown />
        <MenaraJam position={[-14, 0, -58]} menit={12 * 60} />
        <group position={[9.5, y, -18.0]} rotation={[rotX, rotY, rotZ]}>
          <Dimas3D
            position={[0, -0.9, 0]}
            expression={t < 0.45 ? "kaget" : "normal"}
            armPose={t < 0.65 ? "up" : "down"}
          />
        </group>
      </ShotCanvas>

      {/* scanlines tipis & badge << REWIND jenaka yang memudar */}
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          opacity: overlayFade * 0.24,
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.45) 0px, rgba(255,255,255,0.45) 2px, transparent 2px, transparent 8px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 42,
          top: 34,
          opacity: overlayFade,
          backgroundColor: "rgba(29, 47, 78, 0.85)",
          borderRadius: 999,
          border: "3px solid #ffffff",
          padding: "8px 22px",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontWeight: 900,
          fontSize: 26,
          letterSpacing: 2,
          color: "#ffffff",
        }}
      >
        {"<< REWIND"}
      </div>
    </AbsoluteFill>
  );
};

const ShotS02B: React.FC = () => {
  const frame = useCurrentFrame();
  const frames = SHOT_FRAMES["S02-B"];
  const titleIn = interpolate(frame, [18, 48], [0, 1], {
    ...CLAMP,
    easing: Easing.out(Easing.cubic),
  });
  const clockMin = interpolate(frame, [0, frames - 1], [11 * 60 + 59.8, 12 * 60], CLAMP);

  return (
    <AbsoluteFill>
      <ShotCanvas
        frames={frames}
        from={{ pos: [-18.0, 14.0, -32.0], look: [-16.5, 21.5, -58.0], fov: 38 }}
        to={{ pos: [-17.2, 14.6, -34.5], look: [-16.2, 21.8, -58.0], fov: 38 }}
        easing={Easing.inOut(Easing.cubic)}
        sky={PALETTE.langitStandar}
        lights={<LightsStandar />}
      >
        <JalanRayaKunci showParkedVehicles={false} />
        <MenaraJam position={[-14, 0, -58]} menit={clockMin} />
      </ShotCanvas>

      {/* tipografi judul pertanyaan 2D di dua-pertiga kiri langit bersih */}
      <div
        style={{
          position: "absolute",
          left: 54,
          top: 165,
          width: 680,
          opacity: titleIn,
          transform: `translateY(${lerp(18, 0, titleIn)}px)`,
          backgroundColor: "rgba(24, 34, 52, 0.78)",
          borderLeft: "8px solid #F4B829",
          borderRadius: 14,
          padding: "24px 30px",
          boxShadow: "0 14px 32px rgba(0,0,0,0.28)",
        }}
      >
        <div
          style={{
            fontFamily: "Arial, Helvetica, sans-serif",
            fontWeight: 900,
            fontSize: 42,
            lineHeight: 1.22,
            color: "#ffffff",
            letterSpacing: 0.5,
          }}
        >
          GIMANA KALAU GRAVITASI HILANG 5 DETIK SETIAP HARI?
        </div>
      </div>
    </AbsoluteFill>
  );
};

const ShotS02C: React.FC = () => {
  const frame = useCurrentFrame();
  const frames = SHOT_FRAMES["S02-C"];
  const t = interpolate(frame, [0, frames - 1], [0, 1], {
    ...CLAMP,
    easing: Easing.linear,
  });

  const dimasZ = lerp(47.4, 41.8, t);
  const motor1Z = lerp(50.8, 39.0, t);
  const motor2Z = lerp(54.5, 42.2, t);
  const kidBaseZ = lerp(47.8, 42.6, t);

  return (
    <AbsoluteFill>
      <ShotCanvas
        frames={frames}
        from={{ pos: [4.5, 1.85, 50.0], look: [-2.5, 1.4, 46.5], fov: 45 }}
        to={{ pos: [4.5, 1.85, 44.5], look: [-2.5, 1.4, 41.0], fov: 45 }}
        easing={Easing.inOut(Easing.cubic)}
        sky={PALETTE.langitStandar}
        lights={<LightsStandar />}
      >
        <JalanRayaKunci showParkedVehicles={false} />
        <WarungSoto />
        <SidewalkApron />
        <MenaraJam position={[-14, 0, -58]} menit={10 * 60 + 30} />

        {/* motor melintas di jalan kanan */}
        <Motor
          position={[3.4, 0, motor1Z]}
          rotationY={Math.PI}
          color="#C84B31"
          wheelSpin={frame * 0.45}
        />
        <Motor
          position={[4.2, 0, motor2Z]}
          rotationY={Math.PI}
          color="#2D6A9F"
          riderHelm="#F4B829"
          wheelSpin={frame * 0.45}
        />

        {/* gerombolan anak sekolah berjalan pulang di trotoar */}
        <Warga
          position={[0.45, 0.15, kidBaseZ]}
          rotationY={Math.PI}
          tinggi={1.22}
          seragam
          pose="walk"
          phaseOffset={0.4}
        />
        <Warga
          position={[1.05, 0.15, kidBaseZ - 0.6]}
          rotationY={Math.PI}
          tinggi={1.18}
          seragam
          pose="walk"
          phaseOffset={1.9}
        />
        <Warga
          position={[0.25, 0.15, kidBaseZ - 1.25]}
          rotationY={Math.PI}
          tinggi={1.25}
          seragam
          pose="walk"
          phaseOffset={3.1}
        />

        {/* Dimas berjalan santai membaur di trotoar */}
        <Dimas3D
          position={[-0.75, 0.15, dimasZ]}
          rotationY={Math.PI}
          walking
          expression="normal"
          armPose="down"
        />
      </ShotCanvas>
    </AbsoluteFill>
  );
};

const ShotS02D: React.FC = () => {
  const frame = useCurrentFrame();
  const frames = SHOT_FRAMES["S02-D"];
  // 11:59:55 -> 12:00:05 kontinu sepanjang shot
  const clockMin = interpolate(
    frame,
    [0, frames - 1],
    [11 * 60 + 59 + 55 / 60, 12 * 60 + 5 / 60],
    CLAMP,
  );
  const pillOpacity = interpolate(frame, [182, 192, 268, 296], [0, 1, 1, 0], CLAMP);

  return (
    <AbsoluteFill>
      <ShotCanvas
        frames={frames}
        from={{ pos: [-14.0, 4.0, -34.0], look: [-14.0, 19.5, -58.0], fov: 32 }}
        to={{ pos: [-14.0, 5.5, -39.0], look: [-14.0, 22.0, -58.0], fov: 32 }}
        easing={Easing.inOut(Easing.cubic)}
        sky={PALETTE.langitStandar}
        lights={
          <LightsStandar keyPos={[12, 24, 14]} keyColor="#FFF9EC" keyIntensity={1.25} />
        }
      >
        <JalanRayaKunci showParkedVehicles={false} />
        <MenaraJam position={[-14, 0, -58]} menit={clockMin} />
      </ShotCanvas>
      <div style={{ opacity: pillOpacity }}>
        <TimePill text="12.00" delay={184} style={{ right: 42, top: 34 }} />
      </div>
    </AbsoluteFill>
  );
};

const ShotS02E: React.FC = () => {
  const frame = useCurrentFrame();
  const frames = SHOT_FRAMES["S02-E"];
  const adj = interpolate(frame, [45, 195], [0, 0.85], {
    ...CLAMP,
    easing: Easing.inOut(Easing.cubic),
  });
  const goggleLift = interpolate(frame, [45, 195], [0, 0.45], {
    ...CLAMP,
    easing: Easing.inOut(Easing.cubic),
  });

  // Lalu lintas latar berjalan biasa
  const bgCarZ = interpolate(frame, [0, frames - 1], [24, -10], CLAMP);
  const bgWalkerZ = interpolate(frame, [0, frames - 1], [35, 22], CLAMP);

  return (
    <AbsoluteFill>
      <ShotCanvas
        frames={frames}
        from={{ pos: [-0.2, 1.48, 45.2], look: [-0.8, 1.4, 42.0], fov: 36 }}
        to={{ pos: [-0.1, 1.46, 44.55], look: [-0.8, 1.42, 42.0], fov: 36 }}
        easing={Easing.inOut(Easing.cubic)}
        sky={PALETTE.langitStandar}
        lights={
          <LightsStandar
            rim={{ pos: [-4, 4, 38], color: "#FFF4DC", intensity: 0.3 }}
          />
        }
      >
        <JalanRayaKunci showParkedVehicles={false} />
        <WarungSoto />
        <MenaraJam position={[-14, 0, -58]} menit={12 * 60} />

        <Dimas3D
          position={[-0.8, 0.0, 42.0]}
          rotationY={0.22}
          expression="mikir"
          armPose="adjust"
          adjustAmount={adj}
          goggleLift={goggleLift}
          headPitch={-0.06 * adj}
        />

        <Warga
          position={[-2.2, 0.0, bgWalkerZ]}
          rotationY={Math.PI}
          pose="walk"
          shirtColor={PALETTE.bajuWarga[2]}
        />
        <Mobil
          position={[5.8, 0, bgCarZ]}
          rotationY={Math.PI}
          color="#C95A49"
          wheelSpin={frame * 0.4}
        />
      </ShotCanvas>
      <TimePill text="30 HARI" delay={14} style={{ right: 40, top: 34 }} />
    </AbsoluteFill>
  );
};

const ShotS02F: React.FC = () => {
  const frame = useCurrentFrame();
  const frames = SHOT_FRAMES["S02-F"];
  const fLiftEnd = Math.round(frames * 0.65); // ~96
  const fDropEnd = Math.round(frames * 0.78); // ~115

  const liftT = interpolate(frame, [10, fLiftEnd], [0, 1], {
    ...CLAMP,
    easing: Easing.inOut(Easing.sin),
  });
  const dropT = interpolate(frame, [fLiftEnd, fDropEnd], [0, 1], {
    ...CLAMP,
    easing: Easing.in(Easing.cubic),
  });

  const pebbleY = frame < fLiftEnd ? 0.35 * liftT : 0.35 * (1 - dropT);
  const leafY =
    frame < fLiftEnd
      ? 0.38 * liftT
      : 0.38 * (1 - interpolate(frame, [fLiftEnd, fDropEnd + 5], [0, 1], {
          ...CLAMP,
          easing: Easing.in(Easing.quad),
        }));

  const dustT = interpolate(frame, [fDropEnd, fDropEnd + 22], [0, 1], CLAMP);
  const coolT = interpolate(frame, [fLiftEnd, frames - 1], [0, 1], CLAMP);
  const sky = lerpHex(PALETTE.langitStandar, "#A5B8CA", coolT);

  const camSegments: CamSegment[] = [
    {
      startFrame: 0,
      endFrame: fLiftEnd,
      from: { pos: [0.8, 0.22, 43.2], look: [0.0, 0.12, 42.0] },
      to: { pos: [0.75, 0.28, 43.05], look: [0.0, 0.35, 42.0] },
      easing: Easing.inOut(Easing.sin),
    },
    {
      startFrame: fLiftEnd,
      endFrame: fDropEnd,
      from: { pos: [0.75, 0.28, 43.05], look: [0.0, 0.35, 42.0] },
      to: { pos: [0.75, 0.24, 43.05], look: [0.0, 0.05, 42.0] },
      easing: Easing.in(Easing.cubic),
    },
  ];

  const coldLight = {
    hemiSky: "#D5E4F0",
    hemiGround: "#3A4048",
    hemiIntensity: 0.72,
    ambientIntensity: 0.2,
    key: { pos: [6, 10, 4] as Vec3, color: "#FFF9F0", intensity: 1.3 },
    fill: { pos: [-6, 4, 2] as Vec3, color: "#C8D8E8", intensity: 0.26 },
  };

  return (
    <AbsoluteFill>
      <ShakeWrap startFrame={fDropEnd} frames={8}>
        <ShotCanvas
          frames={frames}
          from={{ pos: [0.8, 0.22, 43.2], look: [0.0, 0.12, 42.0], fov: 30 }}
          to={{ pos: [0.75, 0.24, 43.05], look: [0.0, 0.05, 42.0], fov: 30 }}
          multiSegments={camSegments}
          sky={sky}
          lights={
            <LightsBlend from={LIGHT_PRESETS.Standar} to={coldLight} t={coolT} />
          }
        >
          <JalanRayaKunci showParkedVehicles={false} />
          {/* bidang trotoar di titik [0, 0, 42] agar kerikil/daun mendarat rata */}
          <SidewalkApron />
          <KerikilDaun
            position={[0.04, 0.15, 42.0]}
            pebbleOffsetY={pebbleY}
            leafOffsetY={leafY}
            pebbleRotation={[0.3 + liftT * 0.5, 0.6 + liftT * 0.8, 0.2]}
            leafRotation={[-Math.PI / 2 + 0.12 + liftT * 0.35, 0.4 + liftT * 0.5, 0.2]}
          />
          <DebuBenturan position={[0.0, 0.16, 42.0]} t={dustT} scale={0.55} />
        </ShotCanvas>
      </ShakeWrap>
    </AbsoluteFill>
  );
};

// ============================================================================
// S03 — Hari ke-1, 11.58–11.59: kota menahan napas
// ============================================================================

const ShotS03A: React.FC = () => {
  const frame = useCurrentFrame();
  const frames = SHOT_FRAMES["S03-A"];
  // Semua kendaraan memakai kurva deselerasi identik Easing.out(cubic) & berhenti serempak
  const stopFrame = 255;
  const moveT = interpolate(frame, [0, stopFrame], [0, 1], {
    ...CLAMP,
    easing: Easing.out(Easing.cubic),
  });
  const braking = frame > 25 && frame < stopFrame;

  const fleet: Array<{
    kind: "mobil" | "motor" | "angkot";
    x0: number;
    z0: number;
    z1: number;
    color?: string;
  }> = [
    { kind: "mobil", x0: 7.2, z0: 54.0, z1: 42.0, color: "#D8D2C5" },
    { kind: "motor", x0: 6.4, z0: 49.5, z1: 37.5, color: "#C84B31" },
    { kind: "angkot", x0: 8.6, z0: 45.0, z1: 33.0 },
    { kind: "mobil", x0: 7.4, z0: 39.5, z1: 27.5, color: "#C95A49" },
    { kind: "motor", x0: 9.8, z0: 35.5, z1: 23.5, color: "#2D6A9F" },
    { kind: "angkot", x0: 8.2, z0: 30.0, z1: 18.0 },
    { kind: "mobil", x0: 6.8, z0: 25.0, z1: 13.0, color: "#5C7A8C" },
  ];

  // Belok rapi ke bahu timur X = +13
  const steerAngle = Math.sin(moveT * Math.PI) * -0.26;

  return (
    <AbsoluteFill>
      <ShotCanvas
        frames={frames}
        from={{ pos: [8.5, 5.8, 56.0], look: [8.5, 1.0, 36.0], fov: 48 }}
        to={{ pos: [8.5, 5.4, 48.0], look: [8.5, 1.0, 32.0], fov: 48 }}
        easing={Easing.out(Easing.cubic)}
        sky={PALETTE.langitStandar}
        lights={
          <LightsStandar keyPos={[8, 14, 8]} keyColor="#FFFDF5" keyIntensity={1.25} />
        }
      >
        <JalanRayaKunci showParkedVehicles={false} />
        <MenaraJam position={[-14, 0, -58]} menit={11 * 60 + 58} />
        {fleet.map((v, idx) => {
          const x = lerp(v.x0, 13.0, moveT);
          const z = lerp(v.z0, v.z1, moveT);
          const rotY = Math.PI + steerAngle;
          const spin = moveT * 26;
          if (v.kind === "motor") {
            return (
              <Motor
                key={idx}
                position={[x, 0, z]}
                rotationY={rotY}
                color={v.color}
                wheelSpin={spin}
                brakeLight={braking}
              />
            );
          }
          if (v.kind === "angkot") {
            return (
              <Angkot
                key={idx}
                position={[x, 0, z]}
                rotationY={rotY}
                wheelSpin={spin}
                brakeLight={braking}
              />
            );
          }
          return (
            <Mobil
              key={idx}
              position={[x, 0, z]}
              rotationY={rotY}
              color={v.color}
              wheelSpin={spin}
              brakeLight={braking}
            />
          );
        })}
      </ShotCanvas>
      <LocationBanner text="HARI KE-1" delay={10} style={{ left: 36, top: 30 }} />
      <TimePill text="11.58" delay={12} style={{ right: 40, top: 34 }} />
    </AbsoluteFill>
  );
};

const ShotS03B: React.FC = () => {
  const frame = useCurrentFrame();
  const frames = SHOT_FRAMES["S03-B"];
  // Lampu suar berkedip merah-oranye sinusoidal per 12 frame
  const sirene = 0.5 + 0.5 * Math.sin((frame / 12) * Math.PI * 2);
  const ringCycle = (frame % 24) / 24;

  const frozenCrowd: Array<{
    pos: [number, number, number];
    rotY: number;
    phase: number;
    tinggi?: number;
  }> = [
    { pos: [-16.2, 0, -40.5], rotY: 0.4, phase: 0.6 },
    { pos: [-14.4, 0, -41.8], rotY: -0.25, phase: 1.2 },
    { pos: [-12.6, 0, -40.2], rotY: 0.85, phase: 2.1 },
    { pos: [-11.0, 0, -43.0], rotY: -0.9, phase: 0.3 },
    { pos: [-15.2, 0, -44.2], rotY: 2.4, phase: 1.7 },
    { pos: [-13.1, 0, -45.0], rotY: 0.1, phase: 2.7 },
    { pos: [-17.4, 0, -42.6], rotY: -1.3, phase: 0.9, tinggi: 1.24 },
  ];

  return (
    <AbsoluteFill>
      <ShotCanvas
        frames={frames}
        from={{ pos: [-14.0, 2.2, -30.0], look: [-14.0, 22.0, -58.0], fov: 36 }}
        to={{ pos: [-14.0, 2.2, -31.5], look: [-14.0, 2.5, -42.0], fov: 36 }}
        easing={Easing.inOut(Easing.cubic)}
        sky={PALETTE.langitStandar}
        lights={<LightsStandar />}
      >
        <JalanRayaKunci showParkedVehicles showBackgroundTown />
        <MenaraJam position={[-14, 0, -58]} menit={11 * 60 + 59} sirene={sirene} />
        {/* cincin gelombang bunyi sirene */}
        <mesh position={[-14, 27.9, -56.8]} scale={[1 + ringCycle * 3.8, 1 + ringCycle * 3.8, 1]}>
          <ringGeometry args={[1.1, 1.26, 28]} />
          <meshBasicMaterial
            color={PALETTE.sireneMerah}
            transparent
            opacity={(1 - ringCycle) * 0.55}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* seluruh warga membeku total (pose="freeze") */}
        {frozenCrowd.map((w, i) => (
          <Warga
            key={i}
            position={w.pos}
            rotationY={w.rotY}
            pose="freeze"
            freezePhase={w.phase}
            tinggi={w.tinggi ?? 1.7}
            skinColor={PALETTE.kulitWarga[i % PALETTE.kulitWarga.length]}
            shirtColor={PALETTE.bajuWarga[i % PALETTE.bajuWarga.length]}
            pantsColor={PALETTE.celanaWarga[i % PALETTE.celanaWarga.length]}
          />
        ))}
      </ShotCanvas>
      <TimePill text="11.59" delay={8} style={{ right: 40, top: 34 }} />
    </AbsoluteFill>
  );
};

const ShotS03C1: React.FC = () => {
  const frames = SHOT_FRAMES["S03-C1"];
  return (
    <AbsoluteFill>
      <ShotCanvas
        frames={frames}
        from={{ pos: [-1.2, 1.4, 46.2], look: [-4.2, 1.15, 45.8], fov: 32 }}
        to={{ pos: [-1.2, 1.4, 45.7], look: [-4.2, 1.15, 45.8], fov: 32 }}
        easing={Easing.out(Easing.cubic)}
        sky={PALETTE.langitStandar}
        lights={
          <LightsStandar keyPos={[8, 10, 6]} keyColor="#FFF8E6" keyIntensity={1.2} />
        }
      >
        <JalanRayaKunci showParkedVehicles={false} />
        <WarungSoto />
        {/* pedagang bercelemek memeluk erat tiang warung [-4.2, 0, 45.8] */}
        <Warga
          position={[-3.95, 0.03, 45.72]}
          rotationY={-1.32}
          pose="hug"
          apron
          shirtColor={PALETTE.bajuWarga[4]}
          skinColor={PALETTE.kulitWarga[1]}
        />
      </ShotCanvas>
    </AbsoluteFill>
  );
};

const ShotS03C2: React.FC = () => {
  const frames = SHOT_FRAMES["S03-C2"];
  const kids: Array<{ x: number; z: number; tinggi: number; skin: number }> = [
    { x: -7.1, z: 19.34, tinggi: 1.18, skin: 0 },
    { x: -5.9, z: 19.3, tinggi: 1.26, skin: 1 },
    { x: -4.75, z: 19.35, tinggi: 1.14, skin: 2 },
    { x: -3.55, z: 19.31, tinggi: 1.28, skin: 0 },
  ];

  return (
    <AbsoluteFill>
      <ShotCanvas
        frames={frames}
        from={{ pos: [-6.0, 1.15, 22.8], look: [-5.5, 1.05, 19.0], fov: 32 }}
        to={{ pos: [-5.2, 1.15, 22.8], look: [-4.7, 1.05, 19.0], fov: 32 }}
        easing={Easing.out(Easing.cubic)}
        sky={PALETTE.langitStandar}
        lights={<LightsStandar />}
      >
        <JalanRayaKunci showParkedVehicles={false} />
        <PagarSekolah />
        {kids.map((k, idx) => (
          <Warga
            key={idx}
            position={[k.x, 0, k.z]}
            rotationY={Math.PI}
            tinggi={k.tinggi}
            seragam
            pose="grip"
            skinColor={PALETTE.kulitWarga[k.skin]}
            blinkOffset={idx * 23}
          />
        ))}
      </ShotCanvas>
    </AbsoluteFill>
  );
};

const ShotS03C3: React.FC = () => {
  const frames = SHOT_FRAMES["S03-C3"];
  return (
    <AbsoluteFill>
      <ShotCanvas
        frames={frames}
        from={{ pos: [1.6, 1.45, 36.2], look: [-2.2, 1.25, 34.0], fov: 34 }}
        to={{ pos: [1.2, 1.45, 35.4], look: [-2.2, 1.25, 34.0], fov: 34 }}
        easing={Easing.out(Easing.cubic)}
        sky={PALETTE.langitStandar}
        lights={<LightsStandar />}
      >
        <JalanRayaKunci showParkedVehicles={false} />
        {/* 1. Ibu-ibu kiri-depan memeluk tiang lampu */}
        <TiangLampu position={[-0.8, 0, 35.6]} />
        <Warga
          position={[-0.75, 0, 35.28]}
          rotationY={-0.12}
          pose="hug"
          kerudung="#D86C70"
          shirtColor="#E8C882"
          skinColor={PALETTE.kulitWarga[2]}
        />
        {/* 2. Ibu-ibu tengah memeluk batang pohon JalanRayaKunci [-3.5, 0, 34] */}
        <Warga
          position={[-3.22, 0, 34.18]}
          rotationY={-1.15}
          pose="hug"
          kerudung="#4B7B9C"
          shirtColor="#D68E68"
          skinColor={PALETTE.kulitWarga[0]}
          blinkOffset={18}
        />
        {/* 3. Ibu-ibu kanan-latar berpegangan erat pada gerobak */}
        <Gerobak position={[-3.8, 0, 30.2]} rotationY={0.4} />
        <Warga
          position={[-3.1, 0, 30.8]}
          rotationY={2.55}
          pose="grip"
          kerudung="#6E9A62"
          shirtColor="#C97A82"
          skinColor={PALETTE.kulitWarga[1]}
          blinkOffset={37}
        />
      </ShotCanvas>
    </AbsoluteFill>
  );
};

const ShotS03D: React.FC = () => {
  const frame = useCurrentFrame();
  const frames = SHOT_FRAMES["S03-D"];
  // Dimas menengok kiri (-0.35) -> kanan (+0.35) -> tengah secara kontinu
  const lookYaw = interpolate(
    frame,
    [0, 26, 54, frames - 1],
    [0.55, 0.2, 0.9, 0.55],
    { ...CLAMP, easing: Easing.inOut(Easing.sin) },
  );
  const adj = interpolate(frame, [52, frames - 1], [0, 0.8], {
    ...CLAMP,
    easing: Easing.inOut(Easing.cubic),
  });

  return (
    <AbsoluteFill>
      <ShotCanvas
        frames={frames}
        from={{ pos: [1.8, 1.45, 47.4], look: [-1.5, 1.15, 44.0], fov: 38 }}
        to={{ pos: [1.2, 1.45, 46.6], look: [-1.5, 1.25, 44.0], fov: 38 }}
        easing={Easing.inOut(Easing.cubic)}
        sky={PALETTE.langitStandar}
        lights={<LightsStandar />}
      >
        <JalanRayaKunci showParkedVehicles={false} />
        <WarungSoto />

        {/* kiri-latar: pedagang memeluk tiang warung */}
        <Warga
          position={[-2.48, 0.03, 45.66]}
          rotationY={0.8}
          pose="hug"
          apron
          shirtColor={PALETTE.bajuWarga[4]}
        />
        {/* kanan-latar: tiang lampu & warga berpegangan sambil menoleh ke Dimas */}
        <TiangLampu position={[-1.6, 0, 40.0]} />
        <Warga
          position={[-1.55, 0, 40.32]}
          rotationY={0.18}
          pose="hug"
          shirtColor={PALETTE.bajuWarga[0]}
          skinColor={PALETTE.kulitWarga[1]}
        />

        {/* Dimas berdiri bebas bingung di depan warung */}
        <Dimas3D
          position={[-1.5, 0, 44.0]}
          rotationY={lookYaw}
          expression="mikir"
          armPose={frame >= 50 ? "adjust" : "down"}
          adjustAmount={adj}
        />
      </ShotCanvas>
    </AbsoluteFill>
  );
};

const ShotS03E: React.FC = () => {
  const frames = SHOT_FRAMES["S03-E"];
  return (
    <AbsoluteFill>
      <ShotCanvas
        frames={frames}
        from={{ pos: [-0.8, 2.35, 43.8], look: [-0.8, 2.35, 40.5], fov: 28 }}
        to={{ pos: [-0.8, 2.35, 43.45], look: [-0.8, 2.35, 40.5], fov: 28 }}
        easing={Easing.inOut(Easing.cubic)}
        sky={PALETTE.langitStandar}
        lights={<LightsStandar />}
      >
        <JalanRayaKunci showParkedVehicles={false} />
        <Rambu1 position={[-0.8, 0, 40.5]} />
        {/* sudut atap kecil di kejauhan tepi kiri belakang sebagai konteks warung */}
        <mesh position={[-2.9, 2.6, 36.2]} rotation={[0, 0, -0.14]}>
          <boxGeometry args={[2.6, 0.16, 2.2]} />
          <meshStandardMaterial color={PALETTE.gentengMerah} roughness={0.85} />
        </mesh>
      </ShotCanvas>
    </AbsoluteFill>
  );
};

// ============================================================================
// S04 — Hari ke-1, 12.00: gravitasi pergi di warung
// ============================================================================

const ShotS04A: React.FC = () => {
  const frame = useCurrentFrame();
  const frames = SHOT_FRAMES["S04-A"];
  // 1.5 detik pertama (0..45 frame) hening, lalu sendok terangkat pelan +0.28 m
  const liftT = interpolate(frame, [45, frames - 1], [0, 1], {
    ...CLAMP,
    easing: Easing.inOut(Easing.sin),
  });
  const spoonY = 0.856 + liftT * 0.28;
  const spoonRot: [number, number, number] = [
    liftT * 0.28,
    0.35 + liftT * 0.65,
    liftT * -0.22,
  ];
  const pillOut = interpolate(frame, [0, 68, 95], [1, 1, 0], CLAMP);

  return (
    <AbsoluteFill>
      <ShotCanvas
        frames={frames}
        from={{ pos: [-2.35, 0.9, 44.85], look: [-3.1, 0.85, 44.3], fov: 28 }}
        to={{ pos: [-2.35, 1.14, 44.7], look: [-3.1, 1.12, 44.3], fov: 28 }}
        easing={Easing.inOut(Easing.sin)}
        sky={PALETTE.langitMelayang}
        lights={<LightsMelayang />}
      >
        <JalanRayaKunci showParkedVehicles={false} />
        <WarungSoto />
        <MangkukSoto position={[-3.26, 0.85, 44.14]} withBroth steam />
        <Sendok position={[-3.06, spoonY, 44.32]} rotation={spoonRot} scale={1.15} />
      </ShotCanvas>
      <div style={{ opacity: pillOut }}>
        <TimePill text="12.00" delay={4} style={{ right: 40, top: 34 }} />
      </div>
    </AbsoluteFill>
  );
};

const ShotS04B1: React.FC = () => {
  const frame = useCurrentFrame();
  const frames = SHOT_FRAMES["S04-B1"];
  const t = interpolate(frame, [0, frames - 1], [0, 1], {
    ...CLAMP,
    easing: Easing.inOut(Easing.sin),
  });
  const bubbleY = lerp(1.0, 1.38, t);
  const bubbleScale = lerp(0.58, 1.12, t);

  return (
    <AbsoluteFill>
      <ShotCanvas
        frames={frames}
        from={{ pos: [-2.1, 1.15, 45.2], look: [-3.1, 1.18, 44.3], fov: 34 }}
        to={{ pos: [-1.85, 1.38, 44.8], look: [-3.1, 1.35, 44.3], fov: 34 }}
        easing={Easing.inOut(Easing.sin)}
        sky={PALETTE.langitMelayang}
        lights={<LightsMelayang rimIntensity={0.55} />}
      >
        <JalanRayaKunci showParkedVehicles={false} />
        <WarungSoto />
        <MangkukSoto position={[-3.1, 0.85, 44.3]} withBroth={false} steam={false} />
        <GelembungKuah
          position={[-3.1, bubbleY, 44.3]}
          radius={0.18}
          scale={bubbleScale}
        />
      </ShotCanvas>
    </AbsoluteFill>
  );
};

const ShotS04B2: React.FC = () => {
  const frame = useCurrentFrame();
  const frames = SHOT_FRAMES["S04-B2"];
  const t = interpolate(frame, [0, frames - 1], [0, 1], {
    ...CLAMP,
    easing: Easing.inOut(Easing.sin),
  });

  const teaDrops: Array<{
    pos: [number, number, number];
    rise: number;
    r: number;
    phase: number;
  }> = [
    { pos: [-3.1, 1.04, 44.2], rise: 0.34, r: 0.068, phase: 0.2 },
    { pos: [-3.22, 1.12, 44.32], rise: 0.42, r: 0.056, phase: 1.4 },
    { pos: [-2.96, 1.08, 44.15], rise: 0.46, r: 0.062, phase: 2.3 },
    { pos: [-3.16, 1.2, 44.08], rise: 0.38, r: 0.05, phase: 3.1 },
    { pos: [-3.0, 1.24, 44.35], rise: 0.44, r: 0.058, phase: 4.0 },
    { pos: [-3.12, 1.16, 44.24], rise: 0.52, r: 0.064, phase: 5.1 },
  ];

  const catY = lerp(1.18, 1.48, t) + Math.sin(frame * 0.09) * 0.04;

  return (
    <AbsoluteFill>
      <ShotCanvas
        frames={frames}
        from={{ pos: [-2.0, 1.35, 45.8], look: [-3.1, 1.3, 44.2], fov: 38 }}
        to={{ pos: [-0.9, 1.55, 45.5], look: [-1.8, 1.5, 43.8], fov: 38 }}
        easing={Easing.inOut(Easing.sin)}
        sky={PALETTE.langitMelayang}
        lights={<LightsMelayang />}
      >
        <JalanRayaKunci showParkedVehicles={false} />
        <WarungSoto />
        <GelasEsTeh position={[-3.1, 0.85, 44.2]} withTea={false} />
        {teaDrops.map((d, i) => (
          <BolaEsTeh
            key={i}
            position={[
              d.pos[0] + Math.sin(frame * 0.06 + d.phase) * 0.03,
              d.pos[1] + t * d.rise + Math.cos(frame * 0.08 + d.phase) * 0.025,
              d.pos[2],
            ]}
            radius={d.r}
          />
        ))}
        <Kucing
          position={[-1.8, catY, 43.8]}
          rotationY={0.48}
          mode="melayang"
        />
      </ShotCanvas>
    </AbsoluteFill>
  );
};

const ShotS04C1: React.FC = () => {
  const frame = useCurrentFrame();
  const frames = SHOT_FRAMES["S04-C1"];
  const t = interpolate(frame, [0, frames - 1], [0, 1], {
    ...CLAMP,
    easing: Easing.inOut(Easing.sin),
  });

  // Bergerak -X -> +X (arah layar EGO), melintas jelas di depan atap warung (Z=44.6 -> 44.2)
  const dx = lerp(-1.85, 1.25, t);
  const dy = lerp(3.05, 3.78, t) + Math.sin(frame * 0.1) * 0.06;
  const dz = lerp(44.6, 44.2, t);
  const swimActive = frame >= Math.floor(frames * 0.5);
  const rollWobble = swimActive ? Math.sin(frame * 0.12) * 0.09 : 0;

  return (
    <AbsoluteFill>
      <ShotCanvas
        frames={frames}
        from={{ pos: [-2.8, 2.2, 48.2], look: [-2.0, 2.8, 44.0], fov: 44 }}
        to={{ pos: [0.6, 3.1, 48.0], look: [1.2, 3.6, 44.0], fov: 44 }}
        easing={Easing.inOut(Easing.sin)}
        sky={PALETTE.langitMelayang}
        lights={<LightsMelayang />}
      >
        <JalanRayaKunci showParkedVehicles={false} />
        <WarungSoto />
        <group position={[dx, dy, dz]} rotation={[0, 0, -1.35 + rollWobble]}>
          <Dimas3D
            position={[0, -0.9, 0]}
            rotationY={0.55}
            expression="licik"
            armPose="up"
            walking={swimActive}
          />
        </group>
      </ShotCanvas>
    </AbsoluteFill>
  );
};

const ShotS04C2: React.FC = () => {
  const frame = useCurrentFrame();
  const frames = SHOT_FRAMES["S04-C2"];
  const t = interpolate(frame, [0, frames - 1], [0, 1], {
    ...CLAMP,
    easing: Easing.inOut(Easing.cubic),
  });

  const dx = lerp(1.0, 2.65, t);
  const dy = lerp(3.45, 4.35, t);
  const dz = lerp(44.1, 43.9, t);

  const hatX = lerp(2.2, 4.2, t);
  const hatY = lerp(4.15, 5.25, t) + Math.sin(frame * 0.11) * 0.05;

  return (
    <AbsoluteFill>
      <ShotCanvas
        frames={frames}
        from={{ pos: [0.8, 2.8, 47.6], look: [1.8, 3.7, 44.0], fov: 48 }}
        to={{ pos: [3.6, 2.2, 51.8], look: [2.8, 4.4, 44.0], fov: 48 }}
        easing={Easing.inOut(Easing.cubic)}
        sky={PALETTE.langitMelayang}
        lights={<LightsMelayang />}
      >
        <JalanRayaKunci showParkedVehicles={false} />
        <WarungSoto />
        <group position={[dx, dy, dz]} rotation={[0, 1.15, 0]}>
          <group rotation={[0.72, 0, 0]}>
            <Dimas3D
              position={[0, -0.9, 0]}
              expression="licik"
              armPose="point"
              walking
            />
          </group>
        </group>
        <Topi
          position={[hatX, hatY, 43.8]}
          rotation={[0.25 + frame * 0.025, frame * 0.03, -0.2]}
          scale={1.25}
        />
      </ShotCanvas>
    </AbsoluteFill>
  );
};

const ShotS04D: React.FC = () => {
  const frame = useCurrentFrame();
  const frames = SHOT_FRAMES["S04-D"];
  const sipT = interpolate(frame, [10, frames - 15], [0, 1], {
    ...CLAMP,
    easing: Easing.inOut(Easing.sin),
  });

  return (
    <AbsoluteFill>
      <ShotCanvas
        frames={frames}
        // Kamera STATIS total untuk kontras komedi deadpan
        from={{ pos: [-0.6, 1.45, 47.8], look: [-3.4, 1.35, 44.5], fov: 38 }}
        to={{ pos: [-0.6, 1.45, 47.8], look: [-3.4, 1.35, 44.5], fov: 38 }}
        sky={PALETTE.langitMelayang}
        lights={<LightsStandar />}
      >
        <JalanRayaKunci showParkedVehicles={false} />
        <WarungSoto />
        {/* pedagang dan 2 warga memeluk tiang warung dengan wajah datar */}
        <Warga
          position={[-4.02, 0.03, 45.6]}
          rotationY={-0.75}
          pose="hug"
          apron
          shirtColor={PALETTE.bajuWarga[4]}
        />
        <Warga
          position={[-2.5, 0.03, 45.7]}
          rotationY={0.75}
          pose="hug"
          shirtColor={PALETTE.bajuWarga[0]}
          skinColor={PALETTE.kulitWarga[1]}
          blinkOffset={19}
        />
        <Warga
          position={[-2.5, 0.03, 42.4]}
          rotationY={0.35}
          pose="hug"
          shirtColor={PALETTE.bajuWarga[3]}
          skinColor={PALETTE.kulitWarga[2]}
          blinkOffset={42}
        />
        {/* gelembung kuah kecil melintas pelan di depan wajah warga tengah */}
        <GelembungKuah
          position={[lerp(-3.1, -2.52, sipT), lerp(1.38, 1.44, sipT), 45.55]}
          radius={0.11}
        />
      </ShotCanvas>
    </AbsoluteFill>
  );
};

// ============================================================================
// S05 — Hari ke-1: gravitasi kembali, aturan pertama
// ============================================================================

const ShotS05A: React.FC = () => {
  const frame = useCurrentFrame();
  const frames = SHOT_FRAMES["S05-A"];
  const impactF = 24;
  const fallT = interpolate(frame, [0, impactF], [0, 1], {
    ...CLAMP,
    easing: Easing.in(Easing.cubic),
  });
  const splashT = interpolate(frame, [impactF, impactF + 56], [0, 1], CLAMP);

  const spoonDropY = lerp(1.25, 0.858, fallT);
  const spoonBounce = bounceArc(frame, impactF, [
    { dur: 14, height: 0.14 },
    { dur: 10, height: 0.05 },
  ]);
  const bubbleY = lerp(1.38, 0.94, fallT);
  const bubbleScale = frame < impactF ? 1 : Math.max(0, 1 - splashT * 3);

  return (
    <AbsoluteFill>
      <ShakeWrap startFrame={impactF} frames={9}>
        <ShotCanvas
          frames={frames}
          from={{ pos: [-1.5, 1.55, 46.2], look: [-3.1, 1.45, 44.3], fov: 38 }}
          to={{ pos: [-1.5, 1.32, 46.2], look: [-3.1, 0.85, 44.3], fov: 38 }}
          easing={Easing.in(Easing.cubic)}
          endFrame={impactF}
          sky={PALETTE.langitStandar}
          lights={
            <LightsStandar keyPos={[8, 14, 10]} keyIntensity={1.25} />
          }
        >
          <JalanRayaKunci showParkedVehicles={false} />
          <WarungSoto />
          <MangkukSoto
            position={[-3.18, 0.85, 44.3]}
            withBroth={frame >= impactF}
            steam={false}
          />
          {bubbleScale > 0.01 && (
            <GelembungKuah
              position={[-3.18, bubbleY, 44.3]}
              radius={0.18}
              scale={bubbleScale}
            />
          )}
          <CipratanKuah position={[-3.18, 0.96, 44.3]} t={splashT} scale={1.15} />

          <GelasEsTeh position={[-2.86, 0.85, 44.2]} withTea={frame >= impactF} />
          {frame < impactF + 6 &&
            [-0.04, 0.02, 0.05].map((ox, i) => (
              <BolaEsTeh
                key={i}
                position={[-2.86 + ox, lerp(1.32 + i * 0.08, 0.92, fallT), 44.2]}
                radius={0.052}
                scale={frame < impactF ? 1 : Math.max(0, 1 - (frame - impactF) / 6)}
              />
            ))}

          <Sendok
            position={[-3.02, spoonDropY + spoonBounce, 44.45]}
            rotation={[0, 0.4 + fallT * 0.4, spoonBounce * 2.2]}
            scale={1.15}
          />
        </ShotCanvas>
      </ShakeWrap>
    </AbsoluteFill>
  );
};

const ShotS05B1: React.FC = () => {
  const frame = useCurrentFrame();
  const frames = SHOT_FRAMES["S05-B1"];
  const dropT = interpolate(frame, [0, 11], [0, 1], {
    ...CLAMP,
    easing: Easing.in(Easing.quad),
  });
  const plateBounce1 = bounceArc(frame, 11, [
    { dur: 11, height: 0.12 },
    { dur: 8, height: 0.045 },
  ]);
  const plateBounce2 = bounceArc(frame, 13, [
    { dur: 10, height: 0.1 },
    { dur: 7, height: 0.035 },
  ]);

  const catFallY = lerp(0.55, 0.03, interpolate(frame, [0, 10], [0, 1], {
    ...CLAMP,
    easing: Easing.in(Easing.quad),
  }));
  const catWalkX = interpolate(frame, [17, frames - 1], [-2.15, -0.7], {
    ...CLAMP,
    easing: Easing.inOut(Easing.sin),
  });
  const catMode = frame < 10 ? "melayang" : frame < 17 ? "mendarat" : "jalan";

  return (
    <AbsoluteFill>
      <ShakeWrap startFrame={11} frames={5} amplitude={0.45}>
        <ShotCanvas
          frames={frames}
          from={{ pos: [-1.0, 0.34, 46.2], look: [-2.5, 0.3, 44.1], fov: 34 }}
          to={{ pos: [-1.0, 0.34, 46.2], look: [-2.5, 0.3, 44.1], fov: 34 }}
          sky={PALETTE.langitStandar}
          lights={<LightsStandar />}
        >
          <JalanRayaKunci showParkedVehicles={false} />
          <WarungSoto />
          <PiringPlastik
            position={[-2.92, lerp(0.58, 0.03, dropT) + plateBounce1, 44.38]}
            rotation={[plateBounce1 * 1.4, 0.2, plateBounce1 * 0.8]}
            color="#A8D4EB"
          />
          <PiringPlastik
            position={[-2.62, lerp(0.68, 0.03, dropT) + plateBounce2, 44.56]}
            rotation={[-plateBounce2 * 1.2, 0.8, plateBounce2]}
            color="#F2F6FA"
          />
          <Kucing
            position={[catWalkX, catFallY, 44.0]}
            rotationY={Math.PI / 2}
            mode={catMode}
          />
        </ShotCanvas>
      </ShakeWrap>
    </AbsoluteFill>
  );
};

const ShotS05B2: React.FC = () => {
  const frame = useCurrentFrame();
  const frames = SHOT_FRAMES["S05-B2"];
  const hitFrame = 24;
  const flyT = interpolate(frame, [0, hitFrame], [0, 1], {
    ...CLAMP,
    easing: Easing.in(Easing.quad),
  });
  const recoilT = interpolate(frame, [hitFrame, hitFrame + 14], [0, 1], {
    ...CLAMP,
    easing: Easing.out(Easing.quad),
  });

  // Posisi wajah warga sekitar [-1.8, 1.46, 45.2] mundur sedikit saat koran menempel
  const wargaZ = lerp(45.2, 45.06, recoilT);
  const paperPos: [number, number, number] = [
    lerp(-2.15, -1.69, flyT),
    lerp(2.2, 1.47, flyT),
    lerp(45.9, wargaZ + 0.24, flyT),
  ];
  const paperRot: [number, number, number] = [
    lerp(0.65, 0.05, flyT),
    lerp(0.1, 0.44, flyT),
    lerp(-0.45, 0.04, flyT),
  ];

  return (
    <AbsoluteFill>
      <ShotCanvas
        frames={frames}
        from={{ pos: [0.8, 1.48, 46.4], look: [-1.8, 1.45, 45.2], fov: 32 }}
        to={{ pos: [0.65, 1.48, 46.15], look: [-1.8, 1.45, 45.2], fov: 32 }}
        easing={Easing.out(Easing.quad)}
        startFrame={20}
        endFrame={45}
        sky={PALETTE.langitStandar}
        lights={<LightsStandar />}
      >
        <JalanRayaKunci showParkedVehicles={false} />
        <WarungSoto />
        <Warga
          position={[-1.8, 0.03, wargaZ]}
          rotationY={0.44}
          pose="stand"
          shirtColor={PALETTE.bajuWarga[2]}
          skinColor={PALETTE.kulitWarga[0]}
        />
        {/* koran menutup seluruh wajah warga */}
        <Koran position={paperPos} rotation={paperRot} scale={1.18} />
      </ShotCanvas>
    </AbsoluteFill>
  );
};

const ShotS05C: React.FC = () => {
  const frame = useCurrentFrame();
  const frames = SHOT_FRAMES["S05-C"];
  const impactF = 30; // ~25% durasi
  const fallT = interpolate(frame, [0, impactF], [0, 1], {
    ...CLAMP,
    easing: Easing.in(Easing.cubic),
  });
  const dimasFallY = lerp(3.4, 0.15, fallT);
  const dustT = interpolate(frame, [impactF, impactF + 34], [0, 1], CLAMP);

  // Syal menimpa kepala lalu melorot turun 0.3 m ke bahu
  const scarfT = interpolate(frame, [impactF, impactF + 22, impactF + 56], [0, 0.5, 1], {
    ...CLAMP,
    easing: Easing.inOut(Easing.sin),
  });
  const scarfY = interpolate(scarfT, [0, 0.5, 1], [2.4, 1.48, 1.18], CLAMP);
  const scarfOpVisible = frame >= impactF - 4 && frame <= impactF + 62;

  // Topi jatuh 0.6 detik (~18 frame) setelah benturan dan menimpa puncak kepala Dimas terduduk
  const hatT = interpolate(frame, [impactF + 18, impactF + 40], [0, 1], {
    ...CLAMP,
    easing: Easing.in(Easing.quad),
  });
  const hatY = lerp(2.8, 1.54, hatT);

  const seatTilt =
    frame >= impactF
      ? -0.08 - Math.sin(interpolate(frame, [impactF, impactF + 18], [0, Math.PI], CLAMP)) * 0.16
      : -0.08;

  const camSegments: CamSegment[] = [
    {
      startFrame: 0,
      endFrame: impactF,
      from: { pos: [1.8, 0.55, 46.6], look: [-0.8, 1.6, 44.0] },
      to: { pos: [1.8, 0.48, 46.5], look: [-0.8, 0.65, 44.0] },
      easing: Easing.in(Easing.cubic),
    },
    {
      startFrame: impactF,
      endFrame: frames - 1,
      from: { pos: [1.8, 0.48, 46.5], look: [-0.8, 0.65, 44.0] },
      to: { pos: [1.8, 0.48, 46.5], look: [-0.8, 0.65, 44.0] },
      easing: Easing.linear,
    },
  ];

  const expr: DimasExpression = frame < impactF + 18 ? "kaget" : "normal";

  return (
    <AbsoluteFill>
      <ShakeWrap startFrame={impactF} frames={10}>
        <ShotCanvas
          frames={frames}
          from={{ pos: [1.8, 0.55, 46.6], look: [-0.8, 1.6, 44.0], fov: 36 }}
          to={{ pos: [1.8, 0.48, 46.5], look: [-0.8, 0.65, 44.0], fov: 36 }}
          multiSegments={camSegments}
          sky={PALETTE.langitStandar}
          lights={<LightsStandar keyPos={[8, 14, 10]} keyIntensity={1.25} />}
        >
          <JalanRayaKunci showParkedVehicles={false} />
          <WarungSoto />
          <SidewalkApron />

          {frame < impactF ? (
            <group position={[-0.8, dimasFallY, 44.0]} rotation={[0.18, 0.55, 0]}>
              <Dimas3D expression="kaget" armPose="up" />
            </group>
          ) : (
            <DimasSeated
              position={[-0.8, 0.15, 44.0]}
              rotationY={0.55}
              tiltX={seatTilt}
              expression={expr}
              armPose="down"
            />
          )}

          <DebuBenturan position={[-0.8, 0.18, 44.0]} t={dustT} scale={1.15} />

          {scarfOpVisible && (
            <SyalRibbon
              position={[-0.8, scarfY, 44.05]}
              rotation={[0.45, 0.55, 0.18]}
              length={1.1}
              width={0.26}
              wavePhase={frame * 0.15}
            />
          )}

          {frame >= impactF + 14 && (
            <Topi
              position={[-0.8, hatY, 43.96]}
              rotation={[0.08 * (1 - hatT), 0.55, -0.06]}
              scale={1.4}
            />
          )}
        </ShotCanvas>
      </ShakeWrap>
    </AbsoluteFill>
  );
};

const ShotS05D: React.FC = () => {
  const frame = useCurrentFrame();
  const frames = SHOT_FRAMES["S05-D"];
  const adj = interpolate(frame, [24, 150], [0, 0.75], {
    ...CLAMP,
    easing: Easing.inOut(Easing.cubic),
  });
  const goggleLift = interpolate(frame, [24, 150], [0, 0.22], {
    ...CLAMP,
    easing: Easing.inOut(Easing.cubic),
  });

  // Kota kembali bergerak: warga berjalan + kendaraan berakselerasi normal di jalan kanan
  const driveT = interpolate(frame, [20, frames - 1], [0, 1], {
    ...CLAMP,
    easing: Easing.in(Easing.quad),
  });
  const walkerZ = interpolate(frame, [0, frames - 1], [47.5, 36.5], CLAMP);
  const walker2X = interpolate(frame, [0, frames - 1], [-1.6, 2.2], CLAMP);

  return (
    <AbsoluteFill>
      <ShotCanvas
        frames={frames}
        from={{ pos: [1.6, 1.25, 46.8], look: [-0.8, 0.75, 44.0], fov: 44 }}
        to={{ pos: [4.2, 1.65, 49.6], look: [0.6, 1.05, 43.0], fov: 44 }}
        easing={Easing.inOut(Easing.cubic)}
        sky={PALETTE.langitStandar}
        lights={<LightsStandar />}
      >
        <JalanRayaKunci showParkedVehicles={false} />
        <WarungSoto />
        <SidewalkApron />

        <DimasSeated
          position={[-0.8, 0.15, 44.0]}
          rotationY={0.55}
          tiltX={-0.06}
          expression="normal"
          armPose="adjust"
          adjustAmount={adj}
          goggleLift={goggleLift}
        />
        <Topi position={[-0.8, 1.54, 43.96]} rotation={[0, 0.55, -0.05]} scale={1.4} />

        {/* warga kembali berjalan santai */}
        <Warga
          position={[0.8, 0.15, walkerZ]}
          rotationY={Math.PI}
          pose="walk"
          shirtColor={PALETTE.bajuWarga[1]}
          skinColor={PALETTE.kulitWarga[0]}
        />
        <Warga
          position={[walker2X, 0.15, 39.2]}
          rotationY={Math.PI / 2}
          pose="walk"
          shirtColor={PALETTE.bajuWarga[3]}
          skinColor={PALETTE.kulitWarga[2]}
          blinkOffset={30}
        />

        {/* kendaraan mulai melaju normal lagi */}
        <Motor
          position={[5.6, 0, lerp(48.0, 12.0, driveT)]}
          rotationY={Math.PI}
          color="#C84B31"
          wheelSpin={driveT * 42}
        />
        <Mobil
          position={[9.6, 0, lerp(52.0, 18.0, driveT)]}
          rotationY={Math.PI}
          color="#D8D2C5"
          wheelSpin={driveT * 42}
        />
      </ShotCanvas>
    </AbsoluteFill>
  );
};

// ============================================================================
// S06 — Hari ke-7: kota beradaptasi serius
// ============================================================================

const ShotS06A: React.FC = () => {
  const frames = SHOT_FRAMES["S06-A"];
  return (
    <AbsoluteFill>
      <ShotCanvas
        frames={frames}
        from={{ pos: [0.0, 1.35, 6.2], look: [0.0, 1.15, -2.0], fov: 35 }}
        to={{ pos: [0.0, 1.35, 4.4], look: [0.0, 1.15, -2.0], fov: 35 }}
        easing={Easing.inOut(Easing.cubic)}
        sky={PALETTE.dindingKantor}
        lights={
          <>
            <LightsStandar keyPos={[6, 5, 4]} keyColor="#FFF8EA" keyIntensity={1.05} />
            <directionalLight position={[0, 8, 0]} color="#EAF4FF" intensity={0.45} />
          </>
        }
      >
        <SetKantor />
        {KANTOR_SEATS.map((seat, idx) => (
          <Warga
            key={idx}
            position={[seat.pos[0], 0.26, seat.pos[2]]}
            rotationY={seat.rotY}
            pose="type"
            sabuk
            shirtColor={PALETTE.bajuWarga[idx % PALETTE.bajuWarga.length]}
            skinColor={PALETTE.kulitWarga[idx % PALETTE.kulitWarga.length]}
            phaseOffset={idx * 1.1}
            blinkOffset={idx * 19}
          />
        ))}
      </ShotCanvas>
      <LocationBanner text="HARI KE-7" delay={10} style={{ left: 36, top: 30 }} />
    </AbsoluteFill>
  );
};

const ShotS06B: React.FC = () => {
  const frames = SHOT_FRAMES["S06-B"];
  return (
    <AbsoluteFill>
      <ShotCanvas
        frames={frames}
        from={{ pos: [0.0, 1.32, 5.8], look: [0.0, 1.45, -3.5], fov: 35 }}
        to={{ pos: [0.0, 1.32, 4.7], look: [0.0, 1.48, -3.5], fov: 35 }}
        easing={Easing.inOut(Easing.cubic)}
        sky="#F2EDE0"
        lights={
          <LightsStandar keyPos={[5, 6, 3]} keyColor="#FFF9EC" keyIntensity={1.1} />
        }
      >
        <SetKelas />
        {KELAS_SEATS.map(([sx, , sz], idx) => (
          <Warga
            key={idx}
            position={[sx, 0.14, sz]}
            rotationY={Math.PI}
            tinggi={1.22}
            seragam
            pose="sit"
            grip
            skinColor={PALETTE.kulitWarga[idx % PALETTE.kulitWarga.length]}
            phaseOffset={idx * 0.9}
            blinkOffset={idx * 17}
          />
        ))}
      </ShotCanvas>
    </AbsoluteFill>
  );
};

const ShotS06C: React.FC = () => {
  const frame = useCurrentFrame();
  const frames = SHOT_FRAMES["S06-C"];
  // Gerakan halus tangan pedagang mengencangkan simpul
  const pullZ = interpolate(frame, [0, frames - 1], [0, -0.08], {
    ...CLAMP,
    easing: Easing.inOut(Easing.cubic),
  });

  return (
    <AbsoluteFill>
      <ShotCanvas
        frames={frames}
        from={{ pos: [-0.8, 1.45, 2.9], look: [-0.4, 0.95, 0.0], fov: 30 }}
        to={{ pos: [0.4, 1.45, 2.9], look: [0.4, 0.95, 0.0], fov: 30 }}
        easing={Easing.inOut(Easing.cubic)}
        sky="#DDD6C8"
        lights={
          <LightsStandar keyPos={[6, 8, 5]} keyColor="#FFF6E0" keyIntensity={1.15} />
        }
      >
        <SetPasar />
        <Warga
          position={[PASAR_VENDOR_POS[0], PASAR_VENDOR_POS[1], PASAR_VENDOR_POS[2] + pullZ]}
          rotationY={0}
          pose="grip"
          apron
          shirtColor={PALETTE.bajuWarga[2]}
          skinColor={PALETTE.kulitWarga[1]}
        />
      </ShotCanvas>
    </AbsoluteFill>
  );
};

const ShotS06D: React.FC = () => {
  const frame = useCurrentFrame();
  const frames = SHOT_FRAMES["S06-D"];
  const t = interpolate(frame, [0, frames - 1], [0, 1], {
    ...CLAMP,
    easing: Easing.linear,
  });

  const dimasX = lerp(-5.0, 3.2, t);
  const walkers: Array<{
    x0: number;
    x1: number;
    z: number;
    rotY: number;
    helmIdx: number;
    shirtIdx: number;
  }> = [
    { x0: -1.5, x1: -6.0, z: -0.35, rotY: -Math.PI / 2, helmIdx: 0, shirtIdx: 0 },
    { x0: 1.5, x1: -2.8, z: 1.45, rotY: -Math.PI / 2, helmIdx: 1, shirtIdx: 2 },
    { x0: -4.2, x1: 0.4, z: -0.7, rotY: Math.PI / 2, helmIdx: 2, shirtIdx: 4 },
    { x0: 4.5, x1: -0.2, z: -0.25, rotY: -Math.PI / 2, helmIdx: 3, shirtIdx: 1 },
    { x0: -6.2, x1: -1.8, z: 1.5, rotY: Math.PI / 2, helmIdx: 4, shirtIdx: 3 },
  ];

  return (
    <AbsoluteFill>
      <ShotCanvas
        frames={frames}
        from={{ pos: [-4.5, 1.55, 6.2], look: [-4.5, 1.3, 0.0], fov: 38 }}
        to={{ pos: [2.5, 1.55, 6.2], look: [2.5, 1.3, 0.0], fov: 38 }}
        easing={Easing.inOut(Easing.sin)}
        sky={PALETTE.langitStandar}
        lights={<LightsStandar />}
      >
        <SetTrotoarHelm />

        {/* warga duduk berhelm di bangku taman */}
        <Warga
          position={[-3.4, 0.28, -1.32]}
          pose="sit"
          helm={PALETTE.helmWarga[0]}
          shirtColor={PALETTE.bajuWarga[5]}
        />
        <Warga
          position={[2.2, 0.28, -1.32]}
          pose="sit"
          helm={PALETTE.helmWarga[2]}
          shirtColor={PALETTE.bajuWarga[3]}
        />
        {/* warga berdiri mengobrol berhelm */}
        <Warga
          position={[-0.9, 0.12, -1.05]}
          rotationY={0.8}
          pose="stand"
          helm={PALETTE.helmWarga[1]}
          shirtColor={PALETTE.bajuWarga[0]}
        />
        <Warga
          position={[-0.25, 0.12, -0.9]}
          rotationY={-1.9}
          pose="stand"
          helm={PALETTE.helmWarga[4]}
          shirtColor={PALETTE.bajuWarga[2]}
        />

        {/* pejalan kaki semuanya berhelm */}
        {walkers.map((w, idx) => (
          <Warga
            key={idx}
            position={[lerp(w.x0, w.x1, t), 0.12, w.z]}
            rotationY={w.rotY}
            pose="walk"
            helm={PALETTE.helmWarga[w.helmIdx]}
            shirtColor={PALETTE.bajuWarga[w.shirtIdx]}
            skinColor={PALETTE.kulitWarga[idx % PALETTE.kulitWarga.length]}
            phaseOffset={idx * 1.4}
          />
        ))}

        {/* Dimas diselipkan di jalur bersih tanpa helm */}
        <Dimas3D
          position={[dimasX, 0.12, 0.55]}
          rotationY={Math.PI / 2}
          walking
          expression="normal"
          armPose="down"
        />
      </ShotCanvas>
    </AbsoluteFill>
  );
};

const ShotS06E: React.FC = () => {
  const frame = useCurrentFrame();
  const frames = SHOT_FRAMES["S06-E"];
  // Perawat membungkuk memeriksa pengait lalu mengangguk puas di paruh kedua
  const checkLean = interpolate(frame, [0, 75, frames - 1], [0.28, 0.24, 0.08], {
    ...CLAMP,
    easing: Easing.inOut(Easing.cubic),
  });
  const nodBob =
    frame >= 72
      ? Math.sin(interpolate(frame, [72, 112], [0, Math.PI * 2], CLAMP)) * 0.08
      : 0;

  return (
    <AbsoluteFill>
      <ShotCanvas
        frames={frames}
        from={{ pos: [2.4, 0.72, 3.6], look: [0.0, 0.35, 0.0], fov: 34 }}
        to={{ pos: [2.0, 1.05, 3.1], look: [0.0, 1.15, 0.0], fov: 34 }}
        easing={Easing.inOut(Easing.cubic)}
        sky={PALETTE.lantaiRS}
        lights={<LightsStandar keyPos={[5, 7, 5]} keyIntensity={1.1} />}
      >
        <SetRS />
        {/* pasien berbaring telentang di atas ranjang, kepala di bantal X=-0.72 */}
        <group position={[0.74, 0.74, 0]} rotation={[0, Math.PI / 2, 0]}>
          <group rotation={[-Math.PI / 2, 0, 0]}>
            <Warga
              pose="stand"
              shirtColor="#D6ECF8"
              pantsColor="#8AB8D4"
              skinColor={PALETTE.kulitWarga[1]}
            />
          </group>
        </group>
        {/* perawat memeriksa pengait sabuk tambat */}
        <group position={RS_NURSE_POS} rotation={[0, 0.42, 0]}>
          <group rotation={[checkLean + nodBob, 0, 0]}>
            <Warga
              pose="grip"
              shirtColor="#F2F7FA"
              pantsColor="#DCE8F0"
              kerudung="#FFFFFF"
              skinColor={PALETTE.kulitWarga[0]}
            />
          </group>
        </group>
      </ShotCanvas>
    </AbsoluteFill>
  );
};

const ShotS06F: React.FC = () => {
  const frames = SHOT_FRAMES["S06-F"];
  return (
    <AbsoluteFill>
      <ShotCanvas
        frames={frames}
        from={{ pos: [0.0, 1.8, 15.0], look: [0.0, 3.5, 0.0], fov: 45 }}
        to={{ pos: [0.0, 4.2, 16.5], look: [0.0, 11.5, 0.0], fov: 45 }}
        easing={Easing.inOut(Easing.cubic)}
        sky={PALETTE.langitStandar}
        lights={<LightsStandar keyPos={[8, 16, 10]} keyIntensity={1.2} />}
      >
        <SetProyek />
        {PROYEK_WORKERS.map((pos, idx) => (
          <Warga
            key={idx}
            position={pos}
            rotationY={idx % 2 === 0 ? 0.22 : -0.22}
            pose="sit"
            grip
            helm={PALETTE.helmWarga[idx % PALETTE.helmWarga.length]}
            shirtColor={PALETTE.bajuWarga[(idx + 1) % PALETTE.bajuWarga.length]}
            skinColor={PALETTE.kulitWarga[idx % PALETTE.kulitWarga.length]}
            blinkOffset={idx * 21}
          />
        ))}
      </ShotCanvas>
    </AbsoluteFill>
  );
};

// ============================================================================
// Peta 36 sequence sesuai urutan SHOTS di timeline.ts
// ============================================================================

const SHOT_COMPONENTS: Record<ShotId, React.FC> = {
  "S01-A": ShotS01A,
  "S01-B": ShotS01B,
  "S01-C": ShotS01C,
  "S01-D": ShotS01D,
  "S01-E": ShotS01E,
  HITAM: ShotHitam,
  "S02-A": ShotS02A,
  "S02-B": ShotS02B,
  "S02-C": ShotS02C,
  "S02-D": ShotS02D,
  "S02-E": ShotS02E,
  "S02-F": ShotS02F,
  "S03-A": ShotS03A,
  "S03-B": ShotS03B,
  "S03-C1": ShotS03C1,
  "S03-C2": ShotS03C2,
  "S03-C3": ShotS03C3,
  "S03-D": ShotS03D,
  "S03-E": ShotS03E,
  "S04-A": ShotS04A,
  "S04-B1": ShotS04B1,
  "S04-B2": ShotS04B2,
  "S04-C1": ShotS04C1,
  "S04-C2": ShotS04C2,
  "S04-D": ShotS04D,
  "S05-A": ShotS05A,
  "S05-B1": ShotS05B1,
  "S05-B2": ShotS05B2,
  "S05-C": ShotS05C,
  "S05-D": ShotS05D,
  "S06-A": ShotS06A,
  "S06-B": ShotS06B,
  "S06-C": ShotS06C,
  "S06-D": ShotS06D,
  "S06-E": ShotS06E,
  "S06-F": ShotS06F,
};

export const GravitasiDemo: React.FC = () => (
  <Series>
    {SHOTS.map((shot) => {
      const Comp = SHOT_COMPONENTS[shot.id];
      return (
        <Series.Sequence key={shot.id} durationInFrames={shot.frames} name={shot.id}>
          <Comp />
        </Series.Sequence>
      );
    })}
  </Series>
);
