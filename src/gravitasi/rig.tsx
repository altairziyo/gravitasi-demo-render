import React from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export type Vec3 = readonly [number, number, number];

export type CamPose = {
  pos: Vec3;
  look: Vec3;
  fov?: number;
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export type RigProps = {
  from: CamPose;
  to: CamPose;
  /** Up-vector kamera; pakai [0, 0, -1] untuk sudut curam agar bebas gimbal lock. */
  up?: Vec3;
  /** Fungsi easing Remotion; default Easing.inOut(Easing.cubic). */
  easing?: (t: number) => number;
  startFrame?: number;
  endFrame?: number;
  durationInFrames?: number;
};

/**
 * Menggerakkan kamera Three.js secara kontinu per frame Remotion:
 * interpolasi posisi, lookAt, up-vector, dan FOV opsional.
 */
export const Rig: React.FC<RigProps> = ({
  from,
  to,
  up = [0, 1, 0],
  easing = Easing.inOut(Easing.cubic),
  startFrame = 0,
  endFrame,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const cfg = useVideoConfig();
  const camera = useThree((s) => s.camera);

  const total = durationInFrames ?? cfg.durationInFrames;
  const end = endFrame ?? Math.max(startFrame, total - 1);
  const t =
    end > startFrame
      ? interpolate(frame, [startFrame, end], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing,
        })
      : 1;

  camera.up.set(up[0], up[1], up[2]);
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

  if (
    camera instanceof THREE.PerspectiveCamera &&
    (from.fov !== undefined || to.fov !== undefined)
  ) {
    const f0 = from.fov ?? camera.fov;
    const f1 = to.fov ?? f0;
    const nextFov = lerp(f0, f1, t);
    if (camera.fov !== nextFov) {
      camera.fov = nextFov;
      camera.updateProjectionMatrix();
    }
  }

  return null;
};

export type DirLightSpec = {
  pos: Vec3;
  color: string;
  intensity: number;
};

export type LightPresetConfig = {
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
  ambientIntensity: number;
  key: DirLightSpec;
  fill: DirLightSpec;
  rim?: DirLightSpec;
};

export const LIGHT_PRESETS = {
  TerikKunci: {
    hemiSky: "#DCEBF7",
    hemiGround: "#2E3238",
    hemiIntensity: 0.65,
    ambientIntensity: 0.15,
    key: { pos: [14, 38, 10], color: "#FFF8EC", intensity: 1.45 },
    fill: { pos: [-12, 18, -8], color: "#A8C6E0", intensity: 0.25 },
    rim: { pos: [8, 16, -24], color: "#FFFFFF", intensity: 0.3 },
  },
  Standar: {
    hemiSky: "#FFF3DA",
    hemiGround: "#5A6673",
    hemiIntensity: 0.85,
    ambientIntensity: 0.25,
    key: { pos: [5, 7, 6], color: "#FFFFFF", intensity: 1.15 },
    fill: { pos: [-6, 4, 2], color: "#E6EEF8", intensity: 0.3 },
  },
  Melayang: {
    hemiSky: "#FFF6DF",
    hemiGround: "#6E7C8A",
    hemiIntensity: 0.95,
    ambientIntensity: 0.3,
    key: { pos: [8, 14, 10], color: "#FFF1D0", intensity: 1.28 },
    fill: { pos: [-8, 6, 4], color: "#D8EBFF", intensity: 0.38 },
    rim: { pos: [-4, 8, -10], color: "#FFE2A0", intensity: 0.45 },
  },
} as const satisfies Record<string, LightPresetConfig>;

export type LightPresetName = keyof typeof LIGHT_PRESETS;

const LightRig: React.FC<{ cfg: LightPresetConfig }> = ({ cfg }) => (
  <>
    <hemisphereLight args={[cfg.hemiSky, cfg.hemiGround, cfg.hemiIntensity]} />
    <ambientLight intensity={cfg.ambientIntensity} />
    <directionalLight
      position={[cfg.key.pos[0], cfg.key.pos[1], cfg.key.pos[2]]}
      color={cfg.key.color}
      intensity={cfg.key.intensity}
    />
    <directionalLight
      position={[cfg.fill.pos[0], cfg.fill.pos[1], cfg.fill.pos[2]]}
      color={cfg.fill.color}
      intensity={cfg.fill.intensity}
    />
    {cfg.rim && (
      <directionalLight
        position={[cfg.rim.pos[0], cfg.rim.pos[1], cfg.rim.pos[2]]}
        color={cfg.rim.color}
        intensity={cfg.rim.intensity}
      />
    )}
  </>
);

export const LightsTerikKunci: React.FC = () => (
  <LightRig cfg={LIGHT_PRESETS.TerikKunci} />
);

export const LightsStandar: React.FC<{
  keyPos?: Vec3;
  keyColor?: string;
  keyIntensity?: number;
  rim?: DirLightSpec;
}> = ({ keyPos, keyColor, keyIntensity, rim }) => (
  <LightRig
    cfg={{
      ...LIGHT_PRESETS.Standar,
      key: {
        pos: keyPos ?? LIGHT_PRESETS.Standar.key.pos,
        color: keyColor ?? LIGHT_PRESETS.Standar.key.color,
        intensity: keyIntensity ?? LIGHT_PRESETS.Standar.key.intensity,
      },
      rim,
    }}
  />
);

export const LightsMelayang: React.FC<{ rimIntensity?: number }> = ({
  rimIntensity,
}) => (
  <LightRig
    cfg={{
      ...LIGHT_PRESETS.Melayang,
      rim: {
        ...LIGHT_PRESETS.Melayang.rim,
        intensity: rimIntensity ?? LIGHT_PRESETS.Melayang.rim.intensity,
      },
    }}
  />
);

const lerpHex = (a: string, b: string, t: number): string => {
  const c = new THREE.Color(a).lerp(new THREE.Color(b), t);
  return `#${c.getHexString()}`;
};

const lerpVec3 = (a: Vec3, b: Vec3, t: number): Vec3 => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
];

/**
 * Menginterpolasi dua preset pencahayaan secara kontinu (mis. S02-A TerikKunci -> Standar
 * atau S02-F Standar -> TerikKunci di akhir benturan).
 */
export const LightsBlend: React.FC<{
  from: LightPresetConfig;
  to: LightPresetConfig;
  t: number;
}> = ({ from, to, t }) => {
  const clamped = Math.max(0, Math.min(1, t));
  const rimFrom = from.rim ?? { pos: from.key.pos, color: "#FFFFFF", intensity: 0 };
  const rimTo = to.rim ?? { pos: to.key.pos, color: "#FFFFFF", intensity: 0 };
  const rimIntensity = lerp(rimFrom.intensity, rimTo.intensity, clamped);

  return (
    <LightRig
      cfg={{
        hemiSky: lerpHex(from.hemiSky, to.hemiSky, clamped),
        hemiGround: lerpHex(from.hemiGround, to.hemiGround, clamped),
        hemiIntensity: lerp(from.hemiIntensity, to.hemiIntensity, clamped),
        ambientIntensity: lerp(from.ambientIntensity, to.ambientIntensity, clamped),
        key: {
          pos: lerpVec3(from.key.pos, to.key.pos, clamped),
          color: lerpHex(from.key.color, to.key.color, clamped),
          intensity: lerp(from.key.intensity, to.key.intensity, clamped),
        },
        fill: {
          pos: lerpVec3(from.fill.pos, to.fill.pos, clamped),
          color: lerpHex(from.fill.color, to.fill.color, clamped),
          intensity: lerp(from.fill.intensity, to.fill.intensity, clamped),
        },
        rim:
          rimIntensity > 0.001
            ? {
                pos: lerpVec3(rimFrom.pos, rimTo.pos, clamped),
                color: lerpHex(rimFrom.color, rimTo.color, clamped),
                intensity: rimIntensity,
              }
            : undefined,
      }}
    />
  );
};

export type ShakeWrapProps = {
  startFrame: number;
  frames?: number;
  amplitude?: number;
  children: React.ReactNode;
};

/**
 * Wrapper DOM impact shake mengikuti pola Shot2 Proto3D.tsx:
 * osilasi sin/cos berfrekuensi cepat dengan peluruhan linear selama N frame.
 */
export const ShakeWrap: React.FC<ShakeWrapProps> = ({
  startFrame,
  frames = 8,
  amplitude = 1,
  children,
}) => {
  const frame = useCurrentFrame();
  const end = startFrame + frames;
  const decay = frame >= startFrame && frame < end ? end - frame : 0;
  const sx = decay ? Math.sin(frame * 2.3) * decay * 0.8 * amplitude : 0;
  const sy = decay ? Math.cos(frame * 2.9) * decay * 0.6 * amplitude : 0;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        transform: decay ? `translate(${sx}px, ${sy}px)` : undefined,
      }}
    >
      {children}
    </div>
  );
};

const texCache = new Map<string, THREE.CanvasTexture>();

/**
 * Helper cache tekstur Canvas 2D prosedural agar tidak digambar ulang tiap frame.
 */
export const makeCanvasTexture = (
  key: string,
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  anisotropy = 4,
): THREE.CanvasTexture => {
  const hit = texCache.get(key);
  if (hit) return hit;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  texCache.set(key, tex);
  return tex;
};
