import React, { useMemo } from "react";
import * as THREE from "three";
import { useCurrentFrame } from "remotion";
import { makeCanvasTexture } from "./rig";
import { PALETTE } from "./timeline";

const koranTexture = (): THREE.CanvasTexture =>
  makeCanvasTexture(
    "gravitasi-koran",
    512,
    384,
    (ctx, w, h) => {
      ctx.fillStyle = PALETTE.koranKertas;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "#33373E";
      ctx.lineWidth = 4;
      ctx.strokeRect(10, 10, w - 20, h - 20);

      // Kop koran
      ctx.fillStyle = "#23272E";
      ctx.fillRect(24, 24, w - 48, 42);
      ctx.fillStyle = "#D4CEC0";
      ctx.fillRect(24, 76, 210, 110);

      // Kolom baris berita abu
      ctx.fillStyle = "#5B6068";
      for (let r = 0; r < 6; r++) {
        ctx.fillRect(250, 80 + r * 18, w - 278 - (r % 2) * 28, 9);
      }
      for (let col = 0; col < 3; col++) {
        const cx = 24 + col * 160;
        for (let r = 0; r < 8; r++) {
          ctx.fillRect(cx, 206 + r * 19, 138 - ((r + col) % 3) * 16, 9);
        }
      }
    },
    4,
  );

/**
 * Sendok logam warung (gagang capsule pipih + cekungan sphere pipih, metalness 0.85, roughness 0.22).
 */
export const Sendok: React.FC<{
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}> = ({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }) => (
  <group position={position} rotation={rotation} scale={[scale, scale, scale]}>
    {/* gagang pipih */}
    <mesh position={[-0.045, 0.008, 0]} rotation={[0, 0, Math.PI / 2]} scale={[0.45, 1, 1.3]}>
      <capsuleGeometry args={[0.008, 0.11, 6, 12]} />
      <meshStandardMaterial color="#DCE2E8" metalness={0.85} roughness={0.22} />
    </mesh>
    {/* kepala sendok cekung pipih */}
    <mesh position={[0.045, 0.005, 0]} scale={[1.45, 0.35, 1.0]}>
      <sphereGeometry args={[0.022, 16, 12]} />
      <meshStandardMaterial color="#DCE2E8" metalness={0.85} roughness={0.22} />
    </mesh>
  </group>
);

/**
 * Mangkuk soto porselen + kuah oranye opsional + 3 bidang uap transparan animasi halus.
 */
export const MangkukSoto: React.FC<{
  position?: [number, number, number];
  withBroth?: boolean;
  steam?: boolean;
}> = ({ position = [0, 0, 0], withBroth = true, steam = true }) => {
  const frame = useCurrentFrame();
  return (
    <group position={position}>
      {/* kaki & badan mangkuk */}
      <mesh position={[0, 0.015, 0]}>
        <cylinderGeometry args={[0.055, 0.05, 0.03, 20]} />
        <meshStandardMaterial color="#EAE6DC" roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.072, 0]}>
        <cylinderGeometry args={[0.125, 0.065, 0.095, 24]} />
        <meshStandardMaterial color="#F6F3EB" roughness={0.28} />
      </mesh>
      {/* bibir mangkuk */}
      <mesh position={[0, 0.12, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.124, 0.008, 8, 24]} />
        <meshStandardMaterial color="#4D8066" roughness={0.35} />
      </mesh>

      {withBroth && (
        <mesh position={[0, 0.104, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.112, 24]} />
          <meshStandardMaterial color={PALETTE.kuahSoto} roughness={0.18} />
        </mesh>
      )}

      {/* uap animasi halus */}
      {steam &&
        [0, 1, 2].map((i) => {
          const cycle = ((frame * 0.016 + i * 0.33) % 1 + 1) % 1;
          const sy = 0.14 + cycle * 0.16;
          const sx = Math.sin(frame * 0.07 + i * 2.1) * 0.025 + (i - 1) * 0.03;
          const op = Math.sin(cycle * Math.PI) * 0.28;
          return (
            <mesh key={i} position={[sx, sy, (i - 1) * 0.02]} rotation={[0, i * 0.5, 0]}>
              <planeGeometry args={[0.075, 0.11]} />
              <meshBasicMaterial
                color="#FFFFFF"
                transparent
                opacity={op}
                depthWrite={false}
                side={THREE.DoubleSide}
              />
            </mesh>
          );
        })}
    </group>
  );
};

/**
 * Gelembung kuah soto raksasa berkilau (#E89A2C, opacity 0.8) berdenyut kontinu
 * dengan potongan daun bawang & tauge kecil melayang di dalamnya.
 */
export const GelembungKuah: React.FC<{
  position?: [number, number, number];
  radius?: number;
  scale?: number;
}> = ({ position = [0, 0, 0], radius = 0.18, scale = 1 }) => {
  const frame = useCurrentFrame();
  const wx = 1 + Math.sin(frame * 0.14) * 0.045;
  const wy = 1 + Math.cos(frame * 0.16 + 0.8) * 0.05;
  const wz = 1 + Math.sin(frame * 0.12 + 1.9) * 0.045;

  const bits: Array<{ pos: [number, number, number]; color: string; rot: number }> = [
    { pos: [0.28, 0.15, 0.12], color: "#4D9A3A", rot: 0.4 },
    { pos: [-0.25, -0.18, 0.2], color: "#58AD42", rot: 1.2 },
    { pos: [0.1, -0.26, -0.22], color: "#F2E4B5", rot: 0.8 },
    { pos: [-0.18, 0.24, -0.14], color: "#4D9A3A", rot: 2.1 },
    { pos: [0.22, -0.04, -0.28], color: "#F2E4B5", rot: 1.6 },
  ];

  return (
    <group
      position={position}
      scale={[scale * wx, scale * wy, scale * wz]}
      rotation={[frame * 0.015, frame * 0.022, 0]}
    >
      <mesh>
        <sphereGeometry args={[radius, 28, 22]} />
        <meshStandardMaterial
          color={PALETTE.kuahSoto}
          transparent
          opacity={0.8}
          roughness={0.12}
          metalness={0.05}
        />
      </mesh>
      {/* highlight kilau dalam hangat */}
      <mesh position={[-radius * 0.28, radius * 0.3, radius * 0.35]}>
        <sphereGeometry args={[radius * 0.18, 12, 10]} />
        <meshBasicMaterial color="#FFF3C8" transparent opacity={0.48} depthWrite={false} />
      </mesh>
      {/* potongan daun bawang & tauge di dalam kuah */}
      {bits.map((b, i) => (
        <mesh
          key={i}
          position={[b.pos[0] * radius, b.pos[1] * radius, b.pos[2] * radius]}
          rotation={[b.rot, b.rot * 0.7, 0]}
        >
          <boxGeometry args={[radius * 0.14, radius * 0.06, radius * 0.14]} />
          <meshStandardMaterial color={b.color} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
};

/**
 * Gelas es teh bening di meja warung.
 */
export const GelasEsTeh: React.FC<{
  position?: [number, number, number];
  withTea?: boolean;
}> = ({ position = [0, 0, 0], withTea = false }) => (
  <group position={position}>
    <mesh position={[0, 0.01, 0]}>
      <cylinderGeometry args={[0.042, 0.04, 0.02, 16]} />
      <meshStandardMaterial color="#DCEAF2" transparent opacity={0.6} roughness={0.15} />
    </mesh>
    <mesh position={[0, 0.09, 0]}>
      <cylinderGeometry args={[0.054, 0.042, 0.15, 18, 1, true]} />
      <meshStandardMaterial
        color="#E6F4FA"
        transparent
        opacity={0.38}
        roughness={0.12}
        side={THREE.DoubleSide}
      />
    </mesh>
    {withTea && (
      <mesh position={[0, 0.075, 0]}>
        <cylinderGeometry args={[0.048, 0.039, 0.11, 16]} />
        <meshStandardMaterial color={PALETTE.esTeh} transparent opacity={0.78} roughness={0.15} />
      </mesh>
    )}
  </group>
);

/**
 * Bola es teh manis cokelat transparan (#7C3F14, opacity 0.75) berisi kubus es putih kecil.
 */
export const BolaEsTeh: React.FC<{
  position?: [number, number, number];
  radius?: number;
  scale?: number;
}> = ({ position = [0, 0, 0], radius = 0.065, scale = 1 }) => {
  const frame = useCurrentFrame();
  return (
    <group
      position={position}
      scale={[scale, scale, scale]}
      rotation={[frame * 0.02, frame * 0.03, 0]}
    >
      <mesh>
        <sphereGeometry args={[radius, 22, 16]} />
        <meshStandardMaterial color={PALETTE.esTeh} transparent opacity={0.75} roughness={0.14} />
      </mesh>
      <mesh position={[radius * 0.18, radius * 0.15, 0.01]} rotation={[0.4, 0.6, 0.2]}>
        <boxGeometry args={[radius * 0.42, radius * 0.42, radius * 0.42]} />
        <meshStandardMaterial color="#EFF8FF" transparent opacity={0.85} roughness={0.18} />
      </mesh>
      <mesh position={[-radius * 0.22, -radius * 0.12, -0.01]} rotation={[0.9, 0.2, 0.7]}>
        <boxGeometry args={[radius * 0.34, radius * 0.34, radius * 0.34]} />
        <meshStandardMaterial color="#EFF8FF" transparent opacity={0.85} roughness={0.18} />
      </mesh>
    </group>
  );
};

/**
 * Topi pet merah-oranye polos (prop lepas khusus Hari ke-1 S04-C2 & S05-C).
 */
export const Topi: React.FC<{
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}> = ({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }) => (
  <group position={position} rotation={rotation} scale={[scale, scale, scale]}>
    {/* kubah setengah bola */}
    <mesh>
      <sphereGeometry args={[0.21, 22, 12, 0, Math.PI * 2, 0, Math.PI * 0.54]} />
      <meshStandardMaterial color={PALETTE.topiMerah} roughness={0.82} side={THREE.DoubleSide} />
    </mesh>
    {/* kancing puncak */}
    <mesh position={[0, 0.215, 0]}>
      <sphereGeometry args={[0.025, 10, 8]} />
      <meshStandardMaterial color="#B5381D" roughness={0.8} />
    </mesh>
    {/* visor / brim depan */}
    <mesh position={[0, 0.01, 0.16]} rotation={[0.14, 0, 0]} scale={[1.05, 0.22, 0.9]}>
      <cylinderGeometry args={[0.18, 0.2, 0.08, 18, 1, false, -1.15, 2.3]} />
      <meshStandardMaterial color="#B5381D" roughness={0.82} />
    </mesh>
  </group>
);

/**
 * Koran 0.5 x 0.38 m bersegmen 4x4 dengan lengkung statis lembut (untuk S05-B2).
 */
export const Koran: React.FC<{
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}> = ({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }) => {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.5, 0.38, 4, 4);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      // Lengkung lembut di bagian tengah & tepi agar memeluk wajah
      const bend = -0.055 * (1 - (x / 0.25) ** 2) + 0.015 * Math.cos((y / 0.19) * Math.PI);
      pos.setZ(i, bend);
    }
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <mesh
      geometry={geo}
      position={position}
      rotation={rotation}
      scale={[scale, scale, scale]}
    >
      <meshStandardMaterial
        map={koranTexture()}
        roughness={0.92}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

/**
 * Piring plastik tipis putih/biru muda (untuk S05-B1).
 */
export const PiringPlastik: React.FC<{
  position?: [number, number, number];
  rotation?: [number, number, number];
  color?: string;
  scale?: number;
}> = ({ position = [0, 0, 0], rotation = [0, 0, 0], color = "#A8D4EB", scale = 1 }) => (
  <group position={position} rotation={rotation} scale={[scale, scale, scale]}>
    <mesh position={[0, 0.008, 0]}>
      <cylinderGeometry args={[0.14, 0.095, 0.016, 22]} />
      <meshStandardMaterial color={color} roughness={0.35} />
    </mesh>
    <mesh position={[0, 0.017, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.136, 0.006, 8, 22]} />
      <meshStandardMaterial color="#E6F2F8" roughness={0.35} />
    </mesh>
  </group>
);

/**
 * Kerikil dodecahedron (~8 cm) + daun kering cokelat di trotoar (untuk S02-F).
 */
export const KerikilDaun: React.FC<{
  position?: [number, number, number];
  pebbleOffsetY?: number;
  leafOffsetY?: number;
  pebbleRotation?: [number, number, number];
  leafRotation?: [number, number, number];
}> = ({
  position = [0, 0, 0],
  pebbleOffsetY = 0,
  leafOffsetY = 0,
  pebbleRotation = [0.3, 0.6, 0.2],
  leafRotation = [-Math.PI / 2 + 0.12, 0.4, 0.2],
}) => (
  <group position={position}>
    {/* bayangan kontak tajam di atas trotoar */}
    <mesh position={[-0.05, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[Math.max(0.025, 0.055 - pebbleOffsetY * 0.06), 16]} />
      <meshBasicMaterial
        color="#000000"
        transparent
        opacity={Math.max(0.12, 0.42 - pebbleOffsetY * 0.6)}
        depthWrite={false}
      />
    </mesh>
    <mesh position={[0.07, 0.005, 0.02]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.4, 0.7, 1]}>
      <circleGeometry args={[Math.max(0.025, 0.055 - leafOffsetY * 0.05), 14]} />
      <meshBasicMaterial
        color="#000000"
        transparent
        opacity={Math.max(0.1, 0.34 - leafOffsetY * 0.5)}
        depthWrite={false}
      />
    </mesh>

    {/* kerikil abu gelap ~8 cm */}
    <mesh position={[-0.05, 0.036 + pebbleOffsetY, 0]} rotation={pebbleRotation}>
      <dodecahedronGeometry args={[0.042, 0]} />
      <meshStandardMaterial color="#4C525C" roughness={0.88} />
    </mesh>

    {/* daun kering cokelat */}
    <group position={[0.07, 0.015 + leafOffsetY, 0.02]} rotation={leafRotation}>
      <mesh scale={[1.5, 0.85, 1]}>
        <circleGeometry args={[0.052, 8]} />
        <meshStandardMaterial color="#8F5B32" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0, 0.002]}>
        <boxGeometry args={[0.14, 0.006, 0.004]} />
        <meshStandardMaterial color="#5E3A1E" roughness={0.95} />
      </mesh>
    </group>
  </group>
);

const DEBU_SPECS = Array.from({ length: 8 }, (_, i) => {
  const angle = (i / 8) * Math.PI * 2 + (i % 2) * 0.25;
  const speed = 0.24 + (i % 3) * 0.08;
  const size = 0.09 + (i % 3) * 0.035;
  return { angle, speed, size };
});

/**
 * Kepulan debu benturan (8 bidang kecil cokelat-abu), posisi & opacity dianimasikan oleh t (0..1).
 */
export const DebuBenturan: React.FC<{
  position?: [number, number, number];
  t: number;
  scale?: number;
}> = ({ position = [0, 0, 0], t, scale = 1 }) => {
  if (t <= 0 || t >= 1) return null;
  const clamped = Math.max(0, Math.min(1, t));
  const opacity = Math.sin(clamped * Math.PI) * 0.68;

  return (
    <group position={position} scale={[scale, scale, scale]}>
      {DEBU_SPECS.map((d, i) => {
        const dist = clamped * d.speed * 1.4;
        const px = Math.cos(d.angle) * dist;
        const pz = Math.sin(d.angle) * dist;
        const py = Math.sin(clamped * Math.PI) * 0.14 + 0.04;
        const s = d.size * (0.6 + clamped * 0.9);
        return (
          <mesh
            key={i}
            position={[px, py, pz]}
            rotation={[-Math.PI / 4, d.angle, clamped * 1.4]}
          >
            <circleGeometry args={[s, 10]} />
            <meshBasicMaterial
              color={PALETTE.debu}
              transparent
              opacity={opacity}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}
    </group>
  );
};

const CIPRATAN_SPECS = Array.from({ length: 10 }, (_, i) => {
  const angle = (i / 10) * Math.PI * 2 + 0.2;
  const rSpeed = 0.22 + (i % 4) * 0.07;
  const vY = 0.42 + (i % 3) * 0.16;
  const radius = 0.02 + (i % 3) * 0.008;
  return { angle, rSpeed, vY, radius };
});

/**
 * Cipratan kuah oranye beterbangan secara parabolik saat t bergerak 0..1 (untuk S05-A).
 */
export const CipratanKuah: React.FC<{
  position?: [number, number, number];
  t: number;
  scale?: number;
}> = ({ position = [0, 0, 0], t, scale = 1 }) => {
  if (t <= 0 || t >= 1) return null;
  const clamped = Math.max(0, Math.min(1, t));
  const opacity = (1 - clamped * 0.65) * 0.9;

  return (
    <group position={position} scale={[scale, scale, scale]}>
      {CIPRATAN_SPECS.map((c, i) => {
        const px = Math.cos(c.angle) * clamped * c.rSpeed;
        const pz = Math.sin(c.angle) * clamped * c.rSpeed;
        const py = Math.max(0, c.vY * clamped - 0.55 * clamped * clamped);
        const dropScale = 1 - clamped * 0.35;
        return (
          <mesh
            key={i}
            position={[px, py, pz]}
            scale={[dropScale * 1.1, dropScale * 0.55, dropScale]}
          >
            <sphereGeometry args={[c.radius, 10, 8]} />
            <meshStandardMaterial
              color={PALETTE.kuahSoto}
              transparent
              opacity={opacity}
              roughness={0.2}
            />
          </mesh>
        );
      })}
    </group>
  );
};

/**
 * Potongan ribbon syal kunyit terpisah (#E8862E), melengkung dinamis:
 * dipakai sebagai sekelebat syal foreground S01-A (bukan tokoh) atau jatuhan syal S05-C.
 */
export const SyalRibbon: React.FC<{
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  length?: number;
  width?: number;
  wavePhase?: number;
}> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  length = 1.6,
  width = 0.24,
  wavePhase = 0,
}) => {
  const geo = useMemo(() => {
    const N = 16;
    const positions: number[] = [];
    const indices: number[] = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const cx = (t - 0.5) * length;
      const cy = Math.sin(t * Math.PI * 1.4 + wavePhase) * 0.14;
      const cz = Math.cos(t * Math.PI * 1.1 + wavePhase * 0.7) * 0.08;
      const hw = (width * (1 - t * 0.2)) / 2;
      const twist = 0.35 + t * 0.6;
      const wy = Math.cos(twist) * hw;
      const wz = Math.sin(twist) * hw;
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
  }, [length, width, wavePhase]);

  return (
    <mesh
      geometry={geo}
      position={position}
      rotation={rotation}
      scale={[scale, scale, scale]}
    >
      <meshBasicMaterial color={PALETTE.syalKunyit} side={THREE.DoubleSide} />
    </mesh>
  );
};
