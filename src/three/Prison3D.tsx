import React from "react";
import { cellPlateTexture, clockTexture, posterTexture } from "./textures";

/**
 * Satu set penjara 3D (three.js) — padanan 3D dari Prison.tsx versi 2D.
 * Koridor sepanjang sumbu X: dinding belakang (z=-2,3) berisi tiga pintu sel
 * berjeruji (C-12, C-07, C-13), jendela berjeruji, poster aturan, jam dinding;
 * ranjang susun menempel di dinding kanan (x=8). Palet muted sama seperti 2D:
 * krem #ddd5c3, biru abu #93a7bc, lantai #66727f.
 * Semua sudut shot diambil dari set yang sama lewat posisi kamera.
 */

const WALL_UP = "#ddd5c3";
const WALL_LOW = "#93a7bc";
const TRIM = "#77879b";
const FLOOR = "#66727f";
const STEEL = "#4a5563";

/** Pintu sel: rangka + bidang gelap + jeruji silinder vertikal/horizontal + pelat nomor. */
const CellDoor3D: React.FC<{ x: number; label: string }> = ({ x, label }) => (
  <group position={[x, 0, -2.14]}>
    <mesh position={[0, 1.3, 0]}>
      <boxGeometry args={[1.5, 2.6, 0.1]} />
      <meshStandardMaterial color="#7e8fa3" roughness={0.65} metalness={0.25} />
    </mesh>
    <mesh position={[0, 1.3, 0.045]}>
      <boxGeometry args={[1.3, 2.4, 0.04]} />
      <meshStandardMaterial color="#39434e" roughness={0.95} />
    </mesh>
    {/* jeruji vertikal */}
    {Array.from({ length: 7 }).map((_, i) => (
      <mesh key={i} position={[-0.54 + i * 0.18, 1.3, 0.085]}>
        <cylinderGeometry args={[0.028, 0.028, 2.3, 10]} />
        <meshStandardMaterial color={STEEL} roughness={0.4} metalness={0.6} />
      </mesh>
    ))}
    {/* jeruji horizontal */}
    {[0.75, 1.85].map((y) => (
      <mesh key={y} position={[0, y, 0.085]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.028, 0.028, 1.3, 10]} />
        <meshStandardMaterial color={STEEL} roughness={0.4} metalness={0.6} />
      </mesh>
    ))}
    {/* pelat nomor sel */}
    <mesh position={[0, 2.86, 0.03]}>
      <planeGeometry args={[0.52, 0.2]} />
      <meshStandardMaterial map={cellPlateTexture(label)} roughness={0.6} />
    </mesh>
  </group>
);

/** Ranjang susun: 4 tiang + 2 kasur + selimut + bantal. Menempel dinding kanan. */
const BunkBed: React.FC = () => (
  <group position={[7.3, 0, -0.9]} rotation={[0, -Math.PI / 2, 0]}>
    {([
      [-0.95, -0.4],
      [0.95, -0.4],
      [-0.95, 0.4],
      [0.95, 0.4],
    ] as Array<[number, number]>).map(([px, pz], i) => (
      <mesh key={i} position={[px, 0.75, pz]}>
        <cylinderGeometry args={[0.035, 0.035, 1.5, 10]} />
        <meshStandardMaterial color={STEEL} roughness={0.4} metalness={0.6} />
      </mesh>
    ))}
    {[0.45, 1.25].map((y) => (
      <group key={y}>
        <mesh position={[0, y, 0]}>
          <boxGeometry args={[2.0, 0.12, 0.85]} />
          <meshStandardMaterial color="#e8e2d2" roughness={0.95} />
        </mesh>
        <mesh position={[-0.32, y + 0.075, 0]}>
          <boxGeometry args={[1.25, 0.05, 0.87]} />
          <meshStandardMaterial color="#5b7ea6" roughness={0.95} />
        </mesh>
        <mesh position={[0.72, y + 0.09, 0]}>
          <boxGeometry args={[0.42, 0.1, 0.58]} />
          <meshStandardMaterial color="#f4f1e6" roughness={0.95} />
        </mesh>
      </group>
    ))}
  </group>
);

export const Prison3D: React.FC<{ night?: boolean }> = ({ night = false }) => {
  const lampIntensity = night ? 0.35 : 1.5;
  return (
    <group>
      {/* lantai + garis ubin + garis kuning */}
      <mesh position={[0, -0.05, 1.8]}>
        <boxGeometry args={[16.4, 0.1, 8.4]} />
        <meshStandardMaterial color={FLOOR} roughness={0.95} />
      </mesh>
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} position={[-7 + i * 2, 0.004, 1.8]}>
          <boxGeometry args={[0.03, 0.006, 8.2]} />
          <meshStandardMaterial color="#59636f" roughness={1} />
        </mesh>
      ))}
      <mesh position={[0, 0.004, 1.9]}>
        <boxGeometry args={[16.4, 0.006, 0.09]} />
        <meshStandardMaterial color="#d8b93c" roughness={0.9} />
      </mesh>

      {/* dinding belakang dua nada + lis tengah (dinding dibuat tinggi
          agar selalu memenuhi bingkai atas — tanpa langit-langit, seperti set 2D) */}
      <mesh position={[0, 0.825, -2.3]}>
        <boxGeometry args={[16.4, 1.65, 0.2]} />
        <meshStandardMaterial color={WALL_LOW} roughness={0.95} />
      </mesh>
      <mesh position={[0, 3.125, -2.3]}>
        <boxGeometry args={[16.4, 2.95, 0.2]} />
        <meshStandardMaterial color={WALL_UP} roughness={0.95} />
      </mesh>
      <mesh position={[0, 1.65, -2.28]}>
        <boxGeometry args={[16.4, 0.07, 0.24]} />
        <meshStandardMaterial color={TRIM} roughness={0.9} />
      </mesh>

      {/* dinding samping kanan & kiri (dua nada) */}
      {[8.05, -8.05].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.825, 0.3]}>
            <boxGeometry args={[0.2, 1.65, 6]} />
            <meshStandardMaterial color={WALL_LOW} roughness={0.95} />
          </mesh>
          <mesh position={[x, 3.125, 0.3]}>
            <boxGeometry args={[0.2, 2.95, 6]} />
            <meshStandardMaterial color={WALL_UP} roughness={0.95} />
          </mesh>
        </group>
      ))}

      {/* lampu neon menempel tinggi di dinding belakang */}
      {[-4, 0.5, 5].map((x) => (
        <mesh key={x} position={[x, 3.62, -2.14]}>
          <boxGeometry args={[1.15, 0.09, 0.26]} />
          <meshStandardMaterial
            color="#f4f1e6"
            emissive="#fff6d8"
            emissiveIntensity={lampIntensity}
            roughness={0.6}
          />
        </mesh>
      ))}

      {/* pintu-pintu sel */}
      <CellDoor3D x={-4.2} label="C-12" />
      <CellDoor3D x={0} label="C-07" />
      <CellDoor3D x={4.2} label="C-13" />

      {/* jendela berjeruji kiri atas */}
      <group position={[-6.3, 2.35, -2.16]}>
        <mesh>
          <boxGeometry args={[1.1, 0.85, 0.08]} />
          <meshStandardMaterial color={TRIM} roughness={0.8} />
        </mesh>
        <mesh position={[0, 0, 0.05]}>
          <planeGeometry args={[0.95, 0.7]} />
          <meshStandardMaterial
            color="#bcd3e2"
            emissive="#bcd3e2"
            emissiveIntensity={night ? 0.08 : 0.55}
            roughness={0.4}
          />
        </mesh>
        {[-0.32, -0.11, 0.11, 0.32].map((bx) => (
          <mesh key={bx} position={[bx, 0, 0.07]}>
            <boxGeometry args={[0.045, 0.78, 0.03]} />
            <meshStandardMaterial color="#5d6b7a" roughness={0.5} metalness={0.5} />
          </mesh>
        ))}
      </group>

      {/* poster aturan */}
      <mesh position={[5.7, 2.42, -2.18]}>
        <planeGeometry args={[0.85, 1.06]} />
        <meshStandardMaterial map={posterTexture()} roughness={0.9} />
      </mesh>

      {/* jam dinding */}
      <group position={[6.85, 2.6, -2.17]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.05, 28]} />
          <meshStandardMaterial color="#39434f" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0, 0.028]}>
          <circleGeometry args={[0.265, 28]} />
          <meshStandardMaterial map={clockTexture()} transparent roughness={0.6} />
        </mesh>
      </group>

      {/* ranjang susun di sisi kanan */}
      <BunkBed />
    </group>
  );
};
