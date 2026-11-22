import React from "react";
import * as THREE from "three";
import { Angkot, Mobil, Motor } from "./extras";
import { makeCanvasTexture } from "./rig";
import { PALETTE } from "./timeline";

// --- Tekstur prosedural untuk set ---

const aspalTexture = (): THREE.CanvasTexture => {
  const tex = makeCanvasTexture(
    "gravitasi-aspal",
    512,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = PALETTE.aspal;
      ctx.fillRect(0, 0, w, h);
      // Butiran aspal & variasi tambalan deterministik agar tidak tampak tiling polos
      for (let i = 0; i < 4800; i++) {
        const rx = ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1;
        const ry = ((Math.sin(i * 78.233) * 19341.123) % 1 + 1) % 1;
        const shade = i % 3 === 0 ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.08)";
        ctx.fillStyle = shade;
        ctx.fillRect(rx * w, ry * h, 3, 3);
      }
      // Jejak lajur lembut
      ctx.fillStyle = "rgba(18, 20, 24, 0.16)";
      ctx.fillRect(92, 0, 44, h);
      ctx.fillRect(376, 0, 44, h);
    },
    8,
  );
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 24);
  return tex;
};

const clockFaceTexture = (): THREE.CanvasTexture =>
  makeCanvasTexture(
    "gravitasi-menara-jam",
    512,
    512,
    (ctx, w, h) => {
      const cx = w / 2;
      const cy = h / 2;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#F7F4EA";
      ctx.beginPath();
      ctx.arc(cx, cy, 244, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#2A3038";
      ctx.lineWidth = 14;
      ctx.stroke();

      ctx.strokeStyle = "#8C939E";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, 206, 0, Math.PI * 2);
      ctx.stroke();

      for (let i = 0; i < 60; i++) {
        const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
        const major = i % 5 === 0;
        const r1 = major ? 184 : 198;
        const r2 = 222;
        ctx.strokeStyle = "#1D2024";
        ctx.lineWidth = major ? (i % 15 === 0 ? 11 : 7) : 3;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
        ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
        ctx.stroke();
      }

      ctx.fillStyle = "#1D2024";
      ctx.font = "900 44px Arial, Helvetica, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("12", cx, cy - 148);
      ctx.fillText("3", cx + 148, cy + 2);
      ctx.fillText("6", cx, cy + 150);
      ctx.fillText("9", cx - 148, cy + 2);
    },
    8,
  );

const rambu1Texture = (): THREE.CanvasTexture =>
  makeCanvasTexture(
    "gravitasi-rambu1",
    1024,
    768,
    (ctx, w, h) => {
      ctx.fillStyle = PALETTE.rambuKuning;
      ctx.fillRect(0, 0, w, h);

      // Bingkai hitam tebal
      ctx.strokeStyle = PALETTE.rambuHitam;
      ctx.lineWidth = 32;
      ctx.strokeRect(24, 24, w - 48, h - 48);

      // Piktogram figur melayang di bagian atas
      const px = w / 2;
      const py = 205;
      ctx.strokeStyle = PALETTE.rambuHitam;
      ctx.fillStyle = PALETTE.rambuHitam;
      ctx.lineCap = "round";

      // Kepala lingkaran
      ctx.beginPath();
      ctx.arc(px, py - 78, 34, 0, Math.PI * 2);
      ctx.fill();

      // Tubuh miring melayang + lengan terangkat
      ctx.lineWidth = 22;
      ctx.beginPath();
      ctx.moveTo(px - 6, py - 38);
      ctx.lineTo(px + 10, py + 44);
      ctx.stroke();

      ctx.lineWidth = 15;
      ctx.beginPath();
      ctx.moveTo(px - 74, py - 58);
      ctx.lineTo(px - 4, py - 24);
      ctx.lineTo(px + 72, py - 60);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(px + 10, py + 44);
      ctx.lineTo(px - 34, py + 112);
      ctx.moveTo(px + 10, py + 44);
      ctx.lineTo(px + 54, py + 106);
      ctx.stroke();

      // Gelombang naik di bawah figur
      ctx.lineWidth = 10;
      for (let g = 0; g < 2; g++) {
        const gy = py + 132 + g * 24;
        ctx.beginPath();
        ctx.moveTo(px - 95, gy);
        ctx.quadraticCurveTo(px - 45, gy - 16, px, gy);
        ctx.quadraticCurveTo(px + 45, gy + 16, px + 95, gy);
        ctx.stroke();
      }

      // Garis pemisah tipis + teks tebal
      ctx.fillStyle = PALETTE.rambuHitam;
      ctx.fillRect(88, 392, w - 176, 8);

      ctx.font = "900 72px Arial, Helvetica, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("JAM MELAYANG 12.00", w / 2, 476);

      ctx.font = "900 74px Arial, Helvetica, sans-serif";
      ctx.fillText("BERPEGANGANLAH.", w / 2, 588);
    },
    8,
  );

const rambuPolosTexture = (): THREE.CanvasTexture =>
  makeCanvasTexture(
    "gravitasi-rambu-polos",
    256,
    192,
    (ctx, w, h) => {
      ctx.fillStyle = PALETTE.rambuKuning;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = PALETTE.rambuHitam;
      ctx.lineWidth = 12;
      ctx.strokeRect(8, 8, w - 16, h - 16);
      // Siluet piktogram abstrak tanpa huruf untuk S01-E
      ctx.fillStyle = PALETTE.rambuHitam;
      ctx.beginPath();
      ctx.arc(w / 2, 64, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(w / 2 - 42, 108, 84, 14);
      ctx.fillRect(w / 2 - 58, 134, 116, 12);
    },
    4,
  );

const warungSignTexture = (): THREE.CanvasTexture =>
  makeCanvasTexture(
    "gravitasi-warung-sign",
    512,
    192,
    (ctx, w, h) => {
      ctx.fillStyle = "#F4EFE2";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "#8C3B28";
      ctx.lineWidth = 12;
      ctx.strokeRect(8, 8, w - 16, h - 16);
      ctx.fillStyle = "#8C3B28";
      ctx.font = "900 62px Arial, Helvetica, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("WARUNG SOTO", w / 2, 74);
      ctx.fillStyle = "#3B5E3A";
      ctx.font = "700 32px Arial, Helvetica, sans-serif";
      ctx.fillText("BUKA 07.00 - 21.00", w / 2, 134);
    },
    4,
  );

const papanKelasTexture = (): THREE.CanvasTexture =>
  makeCanvasTexture(
    "gravitasi-papan-kelas",
    1024,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = PALETTE.papanTulis;
      ctx.fillRect(0, 0, w, h);

      // Tekstur sapuan kapur samar
      ctx.fillStyle = "rgba(255,255,255,0.03)";
      for (let i = 0; i < 24; i++) {
        ctx.fillRect((i * 47) % w, (i * 29) % h, 140, 22);
      }

      ctx.fillStyle = "#F5F7F2";
      ctx.font = "800 84px Arial, Helvetica, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Latihan Melayang", w / 2, 118);

      ctx.strokeStyle = "rgba(245,247,242,0.85)";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(220, 172);
      ctx.lineTo(w - 220, 172);
      ctx.stroke();

      // Skema garis cara berpegangan (3 langkah visual)
      const xs = [230, 512, 794];
      xs.forEach((cx, idx) => {
        // Meja/palang
        ctx.strokeStyle = "#E8D58C";
        ctx.lineWidth = 7;
        ctx.strokeRect(cx - 56, 330, 112, 76);

        // Figur kapur
        ctx.strokeStyle = "#F5F7F2";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(cx, 252, 24, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx, 276);
        ctx.lineTo(cx, 354);
        ctx.moveTo(cx, 302);
        ctx.lineTo(cx - 48, 332);
        ctx.moveTo(cx, 302);
        ctx.lineTo(cx + 48, 332);
        ctx.stroke();

        ctx.fillStyle = "#E8D58C";
        ctx.font = "800 32px Arial, Helvetica, sans-serif";
        ctx.fillText(`${idx + 1}. PEGANG ERAT`, cx, 450);
      });
    },
    8,
  );

const proyekJamTexture = (): THREE.CanvasTexture =>
  makeCanvasTexture(
    "gravitasi-proyek-jam",
    512,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = "#1E242C";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = PALETTE.rambuKuning;
      ctx.lineWidth = 18;
      ctx.strokeRect(10, 10, w - 20, h - 20);
      ctx.fillStyle = "#FFCF48";
      ctx.font = "900 136px Arial, Helvetica, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("11.55", w / 2, h / 2 + 4);
    },
    8,
  );

// --- Prop kecil bersama ---

export const Pohon: React.FC<{
  position?: [number, number, number];
  scale?: number;
}> = ({ position = [0, 0, 0], scale = 1 }) => (
  <group position={position} scale={[scale, scale, scale]}>
    <mesh position={[0, 1.3, 0]}>
      <cylinderGeometry args={[0.16, 0.24, 2.6, 10]} />
      <meshStandardMaterial color="#6D4B30" roughness={0.95} />
    </mesh>
    <mesh position={[0, 3.0, 0]}>
      <sphereGeometry args={[1.2, 14, 12]} />
      <meshStandardMaterial color="#4D8A45" roughness={0.9} />
    </mesh>
    <mesh position={[-0.65, 2.6, 0.35]}>
      <sphereGeometry args={[0.85, 12, 10]} />
      <meshStandardMaterial color="#599B4E" roughness={0.9} />
    </mesh>
    <mesh position={[0.65, 2.65, -0.25]}>
      <sphereGeometry args={[0.88, 12, 10]} />
      <meshStandardMaterial color="#457D3E" roughness={0.9} />
    </mesh>
  </group>
);

export const TiangLampu: React.FC<{
  position?: [number, number, number];
  rotationY?: number;
  lit?: boolean;
}> = ({ position = [0, 0, 0], rotationY = 0, lit = false }) => (
  <group position={position} rotation={[0, rotationY, 0]}>
    <mesh position={[0, 0.25, 0]}>
      <cylinderGeometry args={[0.13, 0.17, 0.5, 12]} />
      <meshStandardMaterial color="#434A54" roughness={0.6} metalness={0.5} />
    </mesh>
    <mesh position={[0, 2.5, 0]}>
      <cylinderGeometry args={[0.065, 0.09, 4.5, 12]} />
      <meshStandardMaterial color="#5A636E" roughness={0.5} metalness={0.6} />
    </mesh>
    <mesh position={[0.35, 4.72, 0]} rotation={[0, 0, -Math.PI / 2.2]}>
      <cylinderGeometry args={[0.04, 0.05, 0.8, 10]} />
      <meshStandardMaterial color="#5A636E" roughness={0.5} metalness={0.6} />
    </mesh>
    <mesh position={[0.72, 4.78, 0]}>
      <boxGeometry args={[0.36, 0.1, 0.2]} />
      <meshStandardMaterial
        color="#E6EBF0"
        emissive="#FFF2CC"
        emissiveIntensity={lit ? 1.2 : 0.1}
        roughness={0.4}
      />
    </mesh>
  </group>
);

export const TiangRambuPolos: React.FC<{
  position?: [number, number, number];
  rotationY?: number;
  scale?: number;
}> = ({ position = [0, 0, 0], rotationY = 0, scale = 1 }) => (
  <group position={position} rotation={[0, rotationY, 0]} scale={[scale, scale, scale]}>
    <mesh position={[0, 1.35, 0]}>
      <cylinderGeometry args={[0.05, 0.06, 2.7, 10]} />
      <meshStandardMaterial color="#5C646E" roughness={0.5} metalness={0.6} />
    </mesh>
    <mesh position={[0, 2.4, 0.02]}>
      <boxGeometry args={[1.45, 1.08, 0.04]} />
      <meshStandardMaterial color={PALETTE.rambuHitam} roughness={0.75} />
    </mesh>
    <mesh position={[0, 2.4, 0.044]}>
      <planeGeometry args={[1.38, 1.02]} />
      <meshStandardMaterial map={rambuPolosTexture()} roughness={0.72} />
    </mesh>
  </group>
);

/**
 * Lembaran jaring horizontal samar di Y=3.0 (TANPA roda/rangka/petugas),
 * khusus S01-C & S01-D agar larangan foreshadow tetap terjaga.
 */
export const JaringSamar: React.FC<{
  position?: [number, number, number];
  size?: number;
  opacity?: number;
}> = ({ position = [9.5, 3.0, -18.0], size = 4.5, opacity = 0.72 }) => {
  const count = 9;
  const step = size / (count - 1);
  const lines = Array.from({ length: count }, (_, i) => -size / 2 + i * step);
  return (
    <group position={position}>
      {lines.map((offset, idx) => (
        <React.Fragment key={idx}>
          <mesh position={[0, 0, offset]}>
            <boxGeometry args={[size, 0.035, 0.045]} />
            <meshStandardMaterial
              color={PALETTE.jaringSamar}
              roughness={0.85}
              transparent
              opacity={opacity}
              depthWrite={false}
            />
          </mesh>
          <mesh position={[offset, 0, 0]}>
            <boxGeometry args={[0.045, 0.035, size]} />
            <meshStandardMaterial
              color={PALETTE.jaringSamar}
              roughness={0.85}
              transparent
              opacity={opacity}
              depthWrite={false}
            />
          </mesh>
        </React.Fragment>
      ))}
    </group>
  );
};

/** Gerobak kayu sederhana bertambat untuk S03-C3. */
export const Gerobak: React.FC<{
  position?: [number, number, number];
  rotationY?: number;
}> = ({ position = [0, 0, 0], rotationY = 0 }) => (
  <group position={position} rotation={[0, rotationY, 0]}>
    <mesh position={[0, 0.92, 0]}>
      <boxGeometry args={[1.45, 0.85, 0.78]} />
      <meshStandardMaterial color={PALETTE.kayuWarung} roughness={0.88} />
    </mesh>
    <mesh position={[0, 1.65, 0]}>
      <boxGeometry args={[1.4, 0.6, 0.72]} />
      <meshStandardMaterial color="#D9E6EC" transparent opacity={0.45} roughness={0.2} />
    </mesh>
    <mesh position={[0, 2.04, 0]}>
      <boxGeometry args={[1.65, 0.14, 0.95]} />
      <meshStandardMaterial color="#3474A8" roughness={0.7} />
    </mesh>
    {([-0.55, 0.55] as const).map((x) => (
      <mesh key={x} position={[x, 0.28, 0.42]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.28, 0.28, 0.07, 16]} />
        <meshStandardMaterial color="#2A2D32" roughness={0.85} />
      </mesh>
    ))}
    {/* pegangan dorong */}
    <mesh position={[-0.88, 1.0, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.03, 0.03, 0.76, 8]} />
      <meshStandardMaterial color="#4D545E" roughness={0.5} metalness={0.6} />
    </mesh>
  </group>
);

// --- Set Utama ---

const RumahSederhana: React.FC<{
  position: [number, number, number];
  rotationY?: number;
  wallColor?: string;
  roofColor?: string;
  scale?: number;
}> = ({
  position,
  rotationY = 0,
  wallColor = "#EDE5D2",
  roofColor = PALETTE.gentengMerah,
  scale = 1,
}) => (
  <group position={position} rotation={[0, rotationY, 0]} scale={[scale, scale, scale]}>
    <mesh position={[0, 2.0, 0]}>
      <boxGeometry args={[6.4, 4.0, 5.4]} />
      <meshStandardMaterial color={wallColor} roughness={0.92} />
    </mesh>
    <mesh position={[0, 4.7, 0]} rotation={[0, Math.PI / 4, 0]}>
      <coneGeometry args={[5.2, 2.1, 4]} />
      <meshStandardMaterial color={roofColor} roughness={0.85} />
    </mesh>
  </group>
);

/**
 * Geografi jalan raya & alun-alun kunci:
 * aspal X +3..+15 (#2E3238), marka putih X +9, trotoar X 0..+3 (Y=0.15),
 * alun-alun hijau barat, kendaraan parkir statis di X +13, dan latar kota.
 */
export const JalanRayaKunci: React.FC<{
  showParkedVehicles?: boolean;
  showBackgroundTown?: boolean;
}> = ({ showParkedVehicles = true, showBackgroundTown = true }) => {
  const dashes = Array.from({ length: 30 }, (_, i) => -82 + i * 5.6);
  return (
    <group>
      {/* Aspal jalan raya kunci X +3..+15 */}
      <mesh position={[9.0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 180]} />
        <meshStandardMaterial
          color="#FFFFFF"
          map={aspalTexture()}
          bumpMap={aspalTexture()}
          bumpScale={0.04}
          roughness={0.92}
        />
      </mesh>

      {/* Marka putih putus-putus tengah X +9 */}
      {dashes.map((z) => (
        <mesh key={z} position={[9.0, 0.012, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.18, 2.6]} />
          <meshStandardMaterial color={PALETTE.marka} roughness={0.85} />
        </mesh>
      ))}
      {/* Garis tepi aspal */}
      {[3.25, 14.75].map((x) => (
        <mesh key={x} position={[x, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.14, 180]} />
          <meshStandardMaterial color={PALETTE.marka} roughness={0.85} />
        </mesh>
      ))}

      {/* Trotoar pemisah X 0..+3, Y 0.15 */}
      <mesh position={[1.5, 0.075, 0]}>
        <boxGeometry args={[3.0, 0.15, 180]} />
        <meshStandardMaterial color={PALETTE.trotoar} roughness={0.92} />
      </mesh>
      <mesh position={[2.95, 0.08, 0]}>
        <boxGeometry args={[0.12, 0.16, 180]} />
        <meshStandardMaterial color={PALETTE.trotoarGelap} roughness={0.9} />
      </mesh>

      {/* Trotoar bahu timur X +15..+17.5 */}
      <mesh position={[16.25, 0.075, 0]}>
        <boxGeometry args={[2.5, 0.15, 180]} />
        <meshStandardMaterial color={PALETTE.trotoar} roughness={0.92} />
      </mesh>

      {/* Alun-alun hijau luas sisi barat X -68..0 */}
      <mesh position={[-34, -0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[68, 180]} />
        <meshStandardMaterial color={PALETTE.alunAlun} roughness={0.96} />
      </mesh>
      {/* Dasar timur di luar bahu jalan */}
      <mesh position={[35, -0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[36, 180]} />
        <meshStandardMaterial color={PALETTE.alunAlunTepian} roughness={0.96} />
      </mesh>

      {/* Kendaraan menepi statis di bahu timur X +13 */}
      {showParkedVehicles && (
        <group>
          <Mobil position={[13.0, 0, -28.0]} rotationY={Math.PI} color="#D8D2C5" />
          <Motor position={[13.2, 0, -22.5]} rotationY={Math.PI} rider={false} />
          <Angkot position={[13.0, 0, -17.0]} rotationY={Math.PI} />
          <Mobil position={[13.0, 0, -10.5]} rotationY={Math.PI} color="#C95A49" />
          <Motor position={[13.2, 0, -5.0]} rotationY={Math.PI} rider={false} color="#2D6A9F" />
          <Mobil position={[13.0, 0, 6.0]} rotationY={Math.PI} color="#5C7A8C" />
          <Angkot position={[13.0, 0, 18.0]} rotationY={Math.PI} />
          <Mobil position={[13.0, 0, 32.0]} rotationY={Math.PI} color="#D9B44A" />
        </group>
      )}

      {/* Rumah-rumah & pohon latar (menjaga koridor alun-alun & warung tetap bersih) */}
      {showBackgroundTown && (
        <group>
          <RumahSederhana position={[22, 0, -32]} rotationY={-Math.PI / 2} />
          <RumahSederhana position={[23, 0, -18]} rotationY={-Math.PI / 2} wallColor="#E2D9C6" roofColor="#9F4636" />
          <RumahSederhana position={[22, 0, -2]} rotationY={-Math.PI / 2} wallColor="#ECE6D8" />
          <RumahSederhana position={[22, 0, 26]} rotationY={-Math.PI / 2} wallColor="#DFD8C8" />
          <RumahSederhana position={[22, 0, 42]} rotationY={-Math.PI / 2} roofColor="#A24735" />

          <RumahSederhana position={[-28, 0, -40]} rotationY={Math.PI / 2} wallColor="#E5DDD0" />
          <RumahSederhana position={[-30, 0, 32]} rotationY={Math.PI / 2} wallColor="#EAE2D2" />
          <RumahSederhana position={[-22, 0, 56]} wallColor="#E2D8C4" />

          <Pohon position={[16.5, 0, -24]} scale={1.1} />
          <Pohon position={[16.5, 0, -8]} scale={0.95} />
          <Pohon position={[16.5, 0, 12]} scale={1.05} />
          <Pohon position={[16.5, 0, 36]} scale={1.0} />
          <Pohon position={[-3.5, 0, 34]} scale={1.0} />
          <Pohon position={[-26, 0, -12]} scale={1.25} />
          <Pohon position={[-26, 0, 6]} scale={1.15} />
        </group>
      )}
    </group>
  );
};

/**
 * Menara jam pusat kota di [-14, 0, -58], tinggi 28 m, pelat jam Ø 4,2 m di Y=22 m.
 * Jarum jam/menit/detik berputar kontinu mengikuti prop `menit`; sirene mengontrol pointLight suar.
 */
export const MenaraJam: React.FC<{
  position?: [number, number, number];
  rotationY?: number;
  menit?: number;
  sirene?: number;
}> = ({
  position = [-14, 0, -58],
  rotationY = 0,
  menit = 12 * 60,
  sirene = 0,
}) => {
  const minuteAngle = -((menit % 60) / 60) * Math.PI * 2;
  const hourAngle = -(((menit / 60) % 12) / 12) * Math.PI * 2;
  const secondAngle = -(((menit * 60) % 60) / 60) * Math.PI * 2;
  const sireneClamped = Math.max(0, Math.min(1, sirene));

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* alas batu berundak */}
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[7.2, 3.0, 7.2]} />
        <meshStandardMaterial color={PALETTE.menaraTrim} roughness={0.9} />
      </mesh>
      {/* batang utama menara */}
      <mesh position={[0, 11.2, 0]}>
        <boxGeometry args={[5.4, 16.4, 5.4]} />
        <meshStandardMaterial color={PALETTE.menaraBatu} roughness={0.88} />
      </mesh>
      {/* pilaster sudut */}
      {([-1, 1] as const).map((sx) =>
        ([-1, 1] as const).map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * 2.55, 11.5, sz * 2.55]}>
            <boxGeometry args={[0.55, 19.0, 0.55]} />
            <meshStandardMaterial color="#B5AEA0" roughness={0.88} />
          </mesh>
        )),
      )}
      {/* ruang pelat jam */}
      <mesh position={[0, 22.0, 0]}>
        <boxGeometry args={[6.0, 5.4, 6.0]} />
        <meshStandardMaterial color="#CFC7B4" roughness={0.85} />
      </mesh>
      {/* atap piramida hingga 28 m */}
      <mesh position={[0, 26.35, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[4.45, 3.3, 4]} />
        <meshStandardMaterial color="#586472" roughness={0.75} />
      </mesh>

      {/* pelat jam Ø 4.2 m (r=2.1) di Y=22 menghadap +Z */}
      <group position={[0, 22.0, 3.04]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[2.12, 2.12, 0.08, 40]} />
          <meshStandardMaterial color="#343B44" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.05]}>
          <circleGeometry args={[2.06, 40]} />
          <meshStandardMaterial map={clockFaceTexture()} roughness={0.65} />
        </mesh>

        {/* jarum jam */}
        <group position={[0, 0, 0.09]} rotation={[0, 0, hourAngle]}>
          <mesh position={[0, 0.54, 0]}>
            <boxGeometry args={[0.18, 1.15, 0.03]} />
            <meshStandardMaterial color="#181B20" roughness={0.5} />
          </mesh>
        </group>
        {/* jarum menit */}
        <group position={[0, 0, 0.12]} rotation={[0, 0, minuteAngle]}>
          <mesh position={[0, 0.78, 0]}>
            <boxGeometry args={[0.12, 1.66, 0.03]} />
            <meshStandardMaterial color="#181B20" roughness={0.5} />
          </mesh>
        </group>
        {/* jarum detik tipis merah */}
        <group position={[0, 0, 0.15]} rotation={[0, 0, secondAngle]}>
          <mesh position={[0, 0.84, 0]}>
            <boxGeometry args={[0.045, 1.78, 0.02]} />
            <meshStandardMaterial color={PALETTE.bahayaMerah} roughness={0.4} />
          </mesh>
        </group>
        {/* poros pusat */}
        <mesh position={[0, 0, 0.17]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.14, 0.14, 0.06, 16]} />
          <meshStandardMaterial color="#23272E" roughness={0.4} metalness={0.5} />
        </mesh>
      </group>

      {/* corong sirene & lampu suar di puncak */}
      <group position={[0, 27.6, 0]}>
        {([-1, 1] as const).map((side) => (
          <mesh
            key={side}
            position={[side * 0.75, -0.35, 0.75]}
            rotation={[0.25, side * 0.4, side * -Math.PI / 2]}
          >
            <coneGeometry args={[0.32, 0.75, 12, 1, true]} />
            <meshStandardMaterial
              color="#7C8590"
              roughness={0.4}
              metalness={0.6}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}
        <mesh position={[0, 0.55, 0]}>
          <cylinderGeometry args={[0.28, 0.34, 0.55, 14]} />
          <meshStandardMaterial
            color="#FF5938"
            emissive={PALETTE.sireneMerah}
            emissiveIntensity={0.2 + sireneClamped * 2.2}
            roughness={0.3}
          />
        </mesh>
        {sireneClamped > 0.01 && (
          <pointLight
            position={[0, 0.8, 0.6]}
            color={PALETTE.sireneMerah}
            intensity={sireneClamped * 6}
            distance={36}
          />
        )}
      </group>
    </group>
  );
};

/**
 * Set warung soto di sekitar meja [-3.1, 0, 44.3] (permukaan meja Y=0.85).
 * Tiang depan di [-4.2, 0, 45.8] & [-2.3, 0, 45.9] siap dipeluk pedagang.
 */
export const WarungSoto: React.FC = () => (
  <group>
    {/* lantai semen warung */}
    <mesh position={[-4.1, 0.015, 44.2]}>
      <boxGeometry args={[4.8, 0.03, 5.6]} />
      <meshStandardMaterial color="#C8C2B6" roughness={0.94} />
    </mesh>

    {/* dinding belakang separuh + etalase */}
    <mesh position={[-6.25, 1.35, 44.2]}>
      <boxGeometry args={[0.18, 2.7, 5.2]} />
      <meshStandardMaterial color={PALETTE.dindingKrem} roughness={0.92} />
    </mesh>

    {/* tiang-tiang kayu kanopi (termasuk [-4.2, 0, 45.8] untuk S03-C1) */}
    {(
      [
        [-4.2, 45.8],
        [-2.3, 45.9],
        [-2.3, 42.3],
        [-6.1, 45.9],
        [-6.1, 42.3],
      ] as Array<[number, number]>
    ).map(([px, pz], idx) => (
      <mesh key={idx} position={[px, 1.38, pz]}>
        <cylinderGeometry args={[0.075, 0.085, 2.76, 10]} />
        <meshStandardMaterial color={PALETTE.kayuWarung} roughness={0.9} />
      </mesh>
    ))}

    {/* atap kanopi genteng merah (tinggi Y=2.76..3.25 agar kamera S04 tidak terhalang) */}
    <mesh position={[-4.2, 2.9, 44.1]} rotation={[0, 0, -0.14]}>
      <boxGeometry args={[4.8, 0.16, 5.4]} />
      <meshStandardMaterial color={PALETTE.gentengMerah} roughness={0.85} />
    </mesh>
    {/* lis fascia */}
    <mesh position={[-1.92, 2.68, 44.1]}>
      <boxGeometry args={[0.12, 0.24, 5.45]} />
      <meshStandardMaterial color="#5E3C24" roughness={0.9} />
    </mesh>

    {/* papan nama warung */}
    <mesh position={[-1.85, 2.48, 44.1]} rotation={[0, Math.PI / 2, 0]}>
      <planeGeometry args={[1.65, 0.6]} />
      <meshStandardMaterial map={warungSignTexture()} roughness={0.8} />
    </mesh>

    {/* meja kayu makan di [-3.1, 0, 44.3], permukaan Y = 0.85 */}
    <group position={[-3.1, 0, 44.3]}>
      <mesh position={[0, 0.825, 0]}>
        <boxGeometry args={[1.45, 0.05, 0.92]} />
        <meshStandardMaterial color={PALETTE.kayuMeja} roughness={0.82} />
      </mesh>
      {([-0.62, 0.62] as const).map((lx) =>
        ([-0.36, 0.36] as const).map((lz) => (
          <mesh key={`${lx}${lz}`} position={[lx, 0.4, lz]}>
            <boxGeometry args={[0.07, 0.8, 0.07]} />
            <meshStandardMaterial color={PALETTE.kayuWarung} roughness={0.9} />
          </mesh>
        )),
      )}
    </group>

    {/* bangku kayu */}
    <group position={[-3.1, 0, 43.48]}>
      <mesh position={[0, 0.44, 0]}>
        <boxGeometry args={[1.35, 0.05, 0.34]} />
        <meshStandardMaterial color={PALETTE.kayuMeja} roughness={0.85} />
      </mesh>
      {([-0.52, 0.52] as const).map((lx) => (
        <mesh key={lx} position={[lx, 0.21, 0]}>
          <boxGeometry args={[0.07, 0.42, 0.28]} />
          <meshStandardMaterial color={PALETTE.kayuWarung} roughness={0.9} />
        </mesh>
      ))}
    </group>

    {/* gerobak etalase soto di latar */}
    <group position={[-5.1, 0, 43.2]}>
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[0.85, 1.1, 1.65]} />
        <meshStandardMaterial color="#7C5131" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.48, 0]}>
        <boxGeometry args={[0.78, 0.72, 1.55]} />
        <meshStandardMaterial color="#DCEAF0" transparent opacity={0.42} roughness={0.2} />
      </mesh>
      <mesh position={[0, 1.25, 0.25]}>
        <cylinderGeometry args={[0.22, 0.2, 0.3, 14]} />
        <meshStandardMaterial color="#B5BCC4" roughness={0.35} metalness={0.7} />
      </mesh>
    </group>
  </group>
);

/**
 * Rambu #1: "JAM MELAYANG 12.00 — BERPEGANGANLAH."
 * Pelat 1.7 x 1.3 m di Y=2.35, tekstur 1024x768, anisotropy 8.
 */
export const Rambu1: React.FC<{
  position?: [number, number, number];
  rotationY?: number;
}> = ({ position = [-0.8, 0, 40.5], rotationY = 0 }) => (
  <group position={position} rotation={[0, rotationY, 0]}>
    <mesh position={[0, 1.15, -0.04]}>
      <cylinderGeometry args={[0.06, 0.075, 2.3, 12]} />
      <meshStandardMaterial color="#555E68" roughness={0.5} metalness={0.6} />
    </mesh>
    <mesh position={[0, 2.35, 0]}>
      <boxGeometry args={[1.76, 1.36, 0.05]} />
      <meshStandardMaterial color={PALETTE.rambuHitam} roughness={0.75} />
    </mesh>
    <mesh position={[0, 2.35, 0.03]}>
      <planeGeometry args={[1.7, 1.3]} />
      <meshStandardMaterial map={rambu1Texture()} roughness={0.72} />
    </mesh>
  </group>
);

/**
 * Pagar jeruji besi sekolah di sekitar Z=19 + bangunan sekolah di latar.
 */
export const PagarSekolah: React.FC = () => {
  const bars = Array.from({ length: 48 }, (_, i) => -11.4 + i * 0.24);
  const pillars = [-11.8, -8.0, -4.2, -0.4];
  return (
    <group>
      {/* tembok dasar pagar */}
      <mesh position={[-6.1, 0.22, 19.0]}>
        <boxGeometry args={[11.6, 0.44, 0.22]} />
        <meshStandardMaterial color="#DDD6C5" roughness={0.92} />
      </mesh>
      {/* palang horizontal atas & bawah jeruji */}
      {[0.65, 1.48].map((y) => (
        <mesh key={y} position={[-6.1, y, 19.0]}>
          <boxGeometry args={[11.6, 0.05, 0.06]} />
          <meshStandardMaterial color="#2F3740" roughness={0.45} metalness={0.6} />
        </mesh>
      ))}
      {/* jeruji vertikal */}
      {bars.map((x) => (
        <mesh key={x} position={[x, 1.05, 19.0]}>
          <cylinderGeometry args={[0.02, 0.02, 1.24, 8]} />
          <meshStandardMaterial color="#37404A" roughness={0.45} metalness={0.65} />
        </mesh>
      ))}
      {/* pilar bata */}
      {pillars.map((x) => (
        <mesh key={x} position={[x, 0.9, 19.0]}>
          <boxGeometry args={[0.38, 1.8, 0.38]} />
          <meshStandardMaterial color="#B86B4B" roughness={0.9} />
        </mesh>
      ))}

      {/* halaman & bangunan sekolah di belakang pagar */}
      <mesh position={[-6.1, 0.01, 15.0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12.5, 8.2]} />
        <meshStandardMaterial color="#C8C4BA" roughness={0.95} />
      </mesh>
      <mesh position={[-6.1, 2.1, 12.2]}>
        <boxGeometry args={[11.6, 4.2, 3.8]} />
        <meshStandardMaterial color="#F2ECD8" roughness={0.9} />
      </mesh>
      <mesh position={[-6.1, 4.9, 12.2]}>
        <boxGeometry args={[12.4, 1.5, 4.4]} />
        <meshStandardMaterial color={PALETTE.gentengMerah} roughness={0.85} />
      </mesh>
      {[-9.6, -6.2, -2.8].map((wx) => (
        <mesh key={wx} position={[wx, 2.25, 14.12]}>
          <planeGeometry args={[1.6, 1.1]} />
          <meshStandardMaterial color="#3D5266" roughness={0.35} />
        </mesh>
      ))}
    </group>
  );
};

// --- Set Interior S06 ---

export const KANTOR_SEATS: Array<{
  pos: [number, number, number];
  rotY: number;
}> = [
  { pos: [-1.45, 0, 2.3], rotY: 1.05 },
  { pos: [1.45, 0, 2.3], rotY: -1.05 },
  { pos: [-1.45, 0, 0.1], rotY: 1.05 },
  { pos: [1.45, 0, 0.1], rotY: -1.05 },
  { pos: [-1.45, 0, -2.1], rotY: 1.05 },
  { pos: [1.45, 0, -2.1], rotY: -1.05 },
];

const KursiKantorBersabuk: React.FC = () => (
  <group>
    {/* kaki bintang & tiang kursi */}
    <mesh position={[0, 0.06, 0]}>
      <cylinderGeometry args={[0.26, 0.28, 0.06, 5]} />
      <meshStandardMaterial color="#2D3238" roughness={0.5} metalness={0.5} />
    </mesh>
    <mesh position={[0, 0.3, 0]}>
      <cylinderGeometry args={[0.04, 0.04, 0.46, 10]} />
      <meshStandardMaterial color="#454C54" roughness={0.4} metalness={0.6} />
    </mesh>
    {/* dudukan */}
    <mesh position={[0, 0.54, 0]}>
      <boxGeometry args={[0.48, 0.08, 0.48]} />
      <meshStandardMaterial color="#2D3540" roughness={0.85} />
    </mesh>
    {/* sandaran */}
    <mesh position={[0, 0.96, -0.21]}>
      <boxGeometry args={[0.44, 0.72, 0.07]} />
      <meshStandardMaterial color="#2D3540" roughness={0.85} />
    </mesh>
    {/* sabuk pengaman oranye-hitam pada sandaran kursi */}
    <mesh position={[0, 0.96, -0.17]} rotation={[0, 0, 0.62]}>
      <boxGeometry args={[0.055, 0.56, 0.03]} />
      <meshStandardMaterial color={PALETTE.sabukOranye} roughness={0.75} />
    </mesh>
    <mesh position={[0, 0.96, -0.17]} rotation={[0, 0, -0.62]}>
      <boxGeometry args={[0.055, 0.56, 0.03]} />
      <meshStandardMaterial color={PALETTE.sabukOranye} roughness={0.75} />
    </mesh>
  </group>
);

/**
 * Set Kantor S06-A: lorong kubikel simetris + meja/monitor + kursi bersabuk pengaman #F28C28.
 */
export const SetKantor: React.FC = () => (
  <group>
    <mesh position={[0, 0, 1]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[10, 16]} />
      <meshStandardMaterial color={PALETTE.lantaiKantor} roughness={0.85} />
    </mesh>
    {/* dinding belakang & samping */}
    <mesh position={[0, 2.2, -5.2]}>
      <boxGeometry args={[10, 4.4, 0.2]} />
      <meshStandardMaterial color={PALETTE.dindingKantor} roughness={0.92} />
    </mesh>
    {([-4.2, 4.2] as const).map((x) => (
      <mesh key={x} position={[x, 2.2, 1]}>
        <boxGeometry args={[0.2, 4.4, 16]} />
        <meshStandardMaterial color={PALETTE.dindingKantor} roughness={0.92} />
      </mesh>
    ))}

    {/* sekat kubikel rendah agar dada & sabuk pengaman seluruh baris terbaca dari kamera lorong */}
    {[-3.2, -1.0, 1.2, 3.4].map((z) => {
      const h = z === 3.4 ? 0.58 : 0.72;
      return ([-1, 1] as const).map((side) => (
        <mesh key={`${z}${side}`} position={[side * 2.2, h / 2, z]}>
          <boxGeometry args={[2.8, h, 0.08]} />
          <meshStandardMaterial color={PALETTE.kubikel} roughness={0.9} />
        </mesh>
      ));
    })}

    {/* 6 meja + komputer + kursi bersabuk */}
    {KANTOR_SEATS.map((seat, idx) => (
      <group key={idx} position={seat.pos} rotation={[0, seat.rotY, 0]}>
        <KursiKantorBersabuk />
        {/* meja di depan kursi (+Z lokal) */}
        <group position={[0, 0, 0.72]}>
          <mesh position={[0, 0.74, 0]}>
            <boxGeometry args={[1.15, 0.05, 0.56]} />
            <meshStandardMaterial color="#E6DFD2" roughness={0.8} />
          </mesh>
          <mesh position={[-0.48, 0.36, 0]}>
            <boxGeometry args={[0.06, 0.72, 0.48]} />
            <meshStandardMaterial color="#8A949E" roughness={0.6} />
          </mesh>
          <mesh position={[0.48, 0.36, 0]}>
            <boxGeometry args={[0.06, 0.72, 0.48]} />
            <meshStandardMaterial color="#8A949E" roughness={0.6} />
          </mesh>
          {/* monitor */}
          <mesh position={[0, 0.98, 0.1]}>
            <boxGeometry args={[0.46, 0.3, 0.03]} />
            <meshStandardMaterial color="#252A30" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.98, 0.082]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[0.41, 0.25]} />
            <meshStandardMaterial color="#D8EEFF" emissive="#9EC8EB" emissiveIntensity={0.25} />
          </mesh>
          {/* keyboard */}
          <mesh position={[0, 0.775, -0.14]}>
            <boxGeometry args={[0.34, 0.02, 0.12]} />
            <meshStandardMaterial color="#3A4048" roughness={0.6} />
          </mesh>
        </group>
      </group>
    ))}
  </group>
);

export const KELAS_SEATS: Array<[number, number, number]> = [
  [-2.0, 0, 1.0],
  [0.0, 0, 1.0],
  [2.0, 0, 1.0],
  [-2.0, 0, -1.1],
  [0.0, 0, -1.1],
  [2.0, 0, -1.1],
];

/**
 * Set Kelas S06-B: papan tulis hijau "Latihan Melayang" + skema berpegangan,
 * deretan meja-kursi murid berpalang pegangan.
 */
export const SetKelas: React.FC = () => (
  <group>
    <mesh position={[0, 0, 1]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[10, 12]} />
      <meshStandardMaterial color="#D9D3C5" roughness={0.9} />
    </mesh>
    {/* dinding depan & samping */}
    <mesh position={[0, 2.2, -3.7]}>
      <boxGeometry args={[10, 4.4, 0.2]} />
      <meshStandardMaterial color="#F2EDE0" roughness={0.92} />
    </mesh>
    {([-4.6, 4.6] as const).map((x) => (
      <mesh key={x} position={[x, 2.2, 1]}>
        <boxGeometry args={[0.2, 4.4, 12]} />
        <meshStandardMaterial color="#F2EDE0" roughness={0.92} />
      </mesh>
    ))}

    {/* papan tulis hijau di depan tengah */}
    <group position={[0, 2.05, -3.56]}>
      <mesh>
        <boxGeometry args={[3.5, 1.68, 0.06]} />
        <meshStandardMaterial color="#8A5A36" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0, 0.036]}>
        <planeGeometry args={[3.3, 1.5]} />
        <meshStandardMaterial map={papanKelasTexture()} roughness={0.88} />
      </mesh>
    </group>

    {/* deretan meja & kursi murid (menghadap -Z ke papan tulis) */}
    {KELAS_SEATS.map(([sx, sy, sz], idx) => (
      <group key={idx} position={[sx, sy, sz]}>
        {/* kursi murid */}
        <mesh position={[0, 0.34, 0]}>
          <boxGeometry args={[0.38, 0.05, 0.36]} />
          <meshStandardMaterial color="#B98350" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.56, 0.16]}>
          <boxGeometry args={[0.38, 0.36, 0.04]} />
          <meshStandardMaterial color="#B98350" roughness={0.85} />
        </mesh>
        {/* meja murid + palang pengaman kuning di depan */}
        <group position={[0, 0, -0.52]}>
          <mesh position={[0, 0.58, 0]}>
            <boxGeometry args={[0.78, 0.045, 0.48]} />
            <meshStandardMaterial color="#C8935E" roughness={0.8} />
          </mesh>
          {([-0.34, 0.34] as const).map((lx) => (
            <mesh key={lx} position={[lx, 0.28, 0]}>
              <boxGeometry args={[0.045, 0.56, 0.4]} />
              <meshStandardMaterial color="#58616B" roughness={0.6} />
            </mesh>
          ))}
          <mesh position={[0, 0.64, 0.24]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.022, 0.022, 0.78, 10]} />
            <meshStandardMaterial color={PALETTE.rambuKuning} roughness={0.5} />
          </mesh>
        </group>
      </group>
    ))}
  </group>
);

export const PASAR_VENDOR_POS: [number, number, number] = [0.05, 0, -0.82];

/**
 * Set Pasar S06-C: lapak meja, peti buah warna-warni, tumpukan sayur,
 * jaring transparan berpola grid di atas dagangan, dan tali pengikat menegang.
 */
export const SetPasar: React.FC = () => {
  const fruits: Array<[number, number, string]> = [
    [-0.14, -0.08, "#F28C28"],
    [0.0, -0.06, "#F4B829"],
    [0.14, -0.08, "#E04A32"],
    [-0.1, 0.08, "#F4B829"],
    [0.06, 0.09, "#F28C28"],
    [0.0, 0.0, "#E04A32"],
  ];
  const gridOffsets = [-0.55, -0.28, 0, 0.28, 0.55];

  return (
    <group>
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#B5AEA2" roughness={0.95} />
      </mesh>
      <mesh position={[0, 1.5, -2.2]}>
        <planeGeometry args={[10, 4]} />
        <meshStandardMaterial color="#DDD6C8" roughness={0.94} />
      </mesh>
      {/* atap tenda pasar di atas */}
      <mesh position={[0, 2.55, 0]} rotation={[0.15, 0, 0]}>
        <boxGeometry args={[4.4, 0.08, 2.8]} />
        <meshStandardMaterial color="#2D7AB8" roughness={0.85} />
      </mesh>

      {/* meja lapak */}
      <mesh position={[0, 0.76, 0]}>
        <boxGeometry args={[2.5, 0.06, 1.05]} />
        <meshStandardMaterial color={PALETTE.kayuMeja} roughness={0.85} />
      </mesh>
      {([-1.05, 1.05] as const).map((lx) => (
        <mesh key={lx} position={[lx, 0.37, 0]}>
          <boxGeometry args={[0.1, 0.74, 0.92]} />
          <meshStandardMaterial color={PALETTE.kayuWarung} roughness={0.9} />
        </mesh>
      ))}

      {/* peti buah kiri */}
      <group position={[-0.68, 0.88, 0.04]}>
        <mesh>
          <boxGeometry args={[0.62, 0.2, 0.5]} />
          <meshStandardMaterial color="#B38352" roughness={0.9} />
        </mesh>
        {fruits.map(([fx, fz, col], i) => (
          <mesh key={i} position={[fx, 0.14, fz]}>
            <sphereGeometry args={[0.085, 12, 10]} />
            <meshStandardMaterial color={col} roughness={0.65} />
          </mesh>
        ))}
      </group>

      {/* tumpukan sayur tengah */}
      <group position={[0.02, 0.88, 0.05]}>
        {(
          [
            [-0.12, 0, "#4B8F44"],
            [0.08, 0.02, "#5CA852"],
            [-0.02, -0.06, "#3F7C39"],
            [0.0, 0.08, "#6BB85C"],
          ] as Array<[number, number, string]>
        ).map(([vx, vz, col], i) => (
          <mesh key={i} position={[vx, 0.08 + (i % 2) * 0.05, vz]}>
            <sphereGeometry args={[0.13, 12, 10]} />
            <meshStandardMaterial color={col} roughness={0.85} />
          </mesh>
        ))}
      </group>

      {/* kaleng kerupuk kanan */}
      <mesh position={[0.74, 0.98, 0.04]}>
        <boxGeometry args={[0.36, 0.38, 0.36]} />
        <meshStandardMaterial color="#3B8AC4" roughness={0.4} metalness={0.3} />
      </mesh>

      {/* jaring penutup dagangan (bidang transparan + garis grid) */}
      <group position={[0, 1.18, 0.04]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.1, 0.85]} />
          <meshStandardMaterial
            color="#E8F5DF"
            transparent
            opacity={0.22}
            side={THREE.DoubleSide}
            roughness={0.8}
          />
        </mesh>
        {gridOffsets.map((gx) => (
          <mesh key={gx} position={[gx * 1.6, 0.005, 0]}>
            <boxGeometry args={[0.018, 0.018, 0.86]} />
            <meshStandardMaterial color={PALETTE.taliHijau} roughness={0.75} />
          </mesh>
        ))}
        {[-0.36, -0.18, 0, 0.18, 0.36].map((gz) => (
          <mesh key={gz} position={[0, 0.005, gz]}>
            <boxGeometry args={[2.1, 0.018, 0.018]} />
            <meshStandardMaterial color={PALETTE.taliHijau} roughness={0.75} />
          </mesh>
        ))}
      </group>

      {/* tali pengikat kuning menegang menuju tangan pedagang */}
      {[
        { pos: [-0.35, 1.0, -0.2] as [number, number, number], rot: [0.35, 0, -0.5] as [number, number, number] },
        { pos: [0.35, 1.0, -0.2] as [number, number, number], rot: [0.35, 0, 0.5] as [number, number, number] },
      ].map((rope, i) => (
        <mesh key={i} position={rope.pos} rotation={rope.rot}>
          <cylinderGeometry args={[0.018, 0.018, 0.85, 8]} />
          <meshStandardMaterial color={PALETTE.rambuKuning} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
};

export const RS_PATIENT_POS: [number, number, number] = [-0.75, 0.64, 0.0];
export const RS_NURSE_POS: [number, number, number] = [0.65, 0, -0.92];

const JangkarTambat: React.FC<{
  from: [number, number, number];
  to: [number, number, number];
}> = ({ from, to }) => {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const dz = to[2] - from[2];
  const len = Math.hypot(dx, dy, dz);
  const mid: [number, number, number] = [
    (from[0] + to[0]) / 2,
    (from[1] + to[1]) / 2,
    (from[2] + to[2]) / 2,
  ];
  const dir = new THREE.Vector3(dx, dy, dz).normalize();
  const quat = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    dir,
  );
  const euler = new THREE.Euler().setFromQuaternion(quat);

  return (
    <group>
      {/* jangkar baut lantai */}
      <mesh position={[to[0], 0.02, to[2]]}>
        <cylinderGeometry args={[0.09, 0.11, 0.04, 14]} />
        <meshStandardMaterial color="#58636F" roughness={0.4} metalness={0.7} />
      </mesh>
      <mesh position={[to[0], 0.055, to[2]]}>
        <cylinderGeometry args={[0.035, 0.035, 0.04, 8]} />
        <meshStandardMaterial color="#2D333B" roughness={0.4} metalness={0.8} />
      </mesh>
      {/* sabuk tambat oranye-kuning */}
      <mesh position={mid} rotation={[euler.x, euler.y, euler.z]}>
        <boxGeometry args={[0.055, len, 0.025]} />
        <meshStandardMaterial color={PALETTE.sabukOranye} roughness={0.65} />
      </mesh>
    </group>
  );
};

/**
 * Set Rumah Sakit S06-E: ranjang (rangka + kasur), tiang infus + kantung,
 * dan sabuk tambat oranye-kuning dari kaki ranjang & tiang ke jangkar baut lantai.
 */
export const SetRS: React.FC = () => (
  <group>
    <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[10, 10]} />
      <meshStandardMaterial color={PALETTE.lantaiRS} roughness={0.82} />
    </mesh>
    <mesh position={[0, 2.2, -2.5]}>
      <boxGeometry args={[10, 4.4, 0.16]} />
      <meshStandardMaterial color="#F6FAFC" roughness={0.9} />
    </mesh>
    <mesh position={[-3.2, 2.2, 0]}>
      <boxGeometry args={[0.16, 4.4, 10]} />
      <meshStandardMaterial color="#F6FAFC" roughness={0.9} />
    </mesh>

    {/* ranjang RS di tengah */}
    <group position={[0, 0, 0]}>
      {(
        [
          [-0.9, -0.44],
          [0.9, -0.44],
          [-0.9, 0.44],
          [0.9, 0.44],
        ] as Array<[number, number]>
      ).map(([lx, lz], i) => (
        <mesh key={i} position={[lx, 0.25, lz]}>
          <cylinderGeometry args={[0.04, 0.04, 0.5, 10]} />
          <meshStandardMaterial color="#8A95A2" roughness={0.4} metalness={0.6} />
        </mesh>
      ))}
      <mesh position={[0, 0.48, 0]}>
        <boxGeometry args={[2.0, 0.08, 0.98]} />
        <meshStandardMaterial color="#AEB8C2" roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[1.92, 0.16, 0.9]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.9} />
      </mesh>
      <mesh position={[0.25, 0.69, 0]}>
        <boxGeometry args={[1.25, 0.05, 0.92]} />
        <meshStandardMaterial color="#75A8C9" roughness={0.9} />
      </mesh>
      <mesh position={[-0.72, 0.72, 0]}>
        <boxGeometry args={[0.36, 0.09, 0.56]} />
        <meshStandardMaterial color="#F4F8FB" roughness={0.9} />
      </mesh>
    </group>

    {/* tiang infus + kantung */}
    <group position={[1.18, 0, 0.45]}>
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.24, 0.26, 0.06, 12]} />
        <meshStandardMaterial color="#7A8590" roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0.98, 0]}>
        <cylinderGeometry args={[0.025, 0.03, 1.9, 10]} />
        <meshStandardMaterial color="#B5BFC8" roughness={0.35} metalness={0.75} />
      </mesh>
      <mesh position={[-0.14, 1.72, 0]}>
        <boxGeometry args={[0.14, 0.24, 0.06]} />
        <meshStandardMaterial color="#B8E4F8" transparent opacity={0.75} roughness={0.3} />
      </mesh>
    </group>

    {/* sabuk tambat ke jangkar baut lantai */}
    <JangkarTambat from={[0.9, 0.44, 0.44]} to={[1.25, 0.04, 0.78]} />
    <JangkarTambat from={[-0.9, 0.44, 0.44]} to={[-1.25, 0.04, 0.78]} />
    <JangkarTambat from={[1.18, 0.55, 0.45]} to={[1.56, 0.04, 0.72]} />
  </group>
);

export const PROYEK_WORKERS: Array<[number, number, number]> = [
  [-2.6, 2.27, 0.26],
  [-0.9, 2.27, 0.26],
  [0.8, 2.27, 0.26],
  [2.5, 2.27, 0.26],
];

/**
 * Set Proyek S06-F: perancah pipa, tower crane kuning dengan kait KOSONG,
 * papan jam besar "11.55", dan balok beton.
 */
export const SetProyek: React.FC = () => (
  <group>
    <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[48, 48]} />
      <meshStandardMaterial color="#A89F92" roughness={0.96} />
    </mesh>

    {/* struktur gedung setengah jadi + balok beton */}
    <mesh position={[0, 0.9, -1.8]}>
      <boxGeometry args={[9.5, 1.8, 3.2]} />
      <meshStandardMaterial color="#9BA2AA" roughness={0.92} />
    </mesh>
    {[-3.4, 3.2].map((bx) => (
      <mesh key={bx} position={[bx, 0.5, 2.4]}>
        <boxGeometry args={[1.4, 1.0, 1.0]} />
        <meshStandardMaterial color="#8A9199" roughness={0.9} />
      </mesh>
    ))}

    {/* perancah pipa baja (papan duduk di Y=2.55 Z=-0.02..+0.42, pipa pegangan di Y=3.06 Z=+0.65) */}
    <group position={[0, 0, 0.2]}>
      {[-3.6, -1.8, 0, 1.8, 3.6].map((x) => (
        <React.Fragment key={x}>
          <mesh position={[x, 2.3, -0.35]}>
            <cylinderGeometry args={[0.045, 0.045, 4.6, 8]} />
            <meshStandardMaterial color={PALETTE.bajaAbu} roughness={0.5} metalness={0.6} />
          </mesh>
          <mesh position={[x, 2.3, 0.45]}>
            <cylinderGeometry args={[0.045, 0.045, 4.6, 8]} />
            <meshStandardMaterial color={PALETTE.bajaAbu} roughness={0.5} metalness={0.6} />
          </mesh>
        </React.Fragment>
      ))}
      {/* papan/pipa duduk di Y=2.55 (pekerja duduk di tepi depan agar lutut & kaki menjuntai jelas) */}
      <mesh position={[0, 2.55, 0.0]}>
        <boxGeometry args={[7.5, 0.09, 0.44]} />
        <meshStandardMaterial color="#C8935A" roughness={0.85} />
      </mesh>
      {/* pipa pegangan depan di Y=3.06 tepat di genggaman tangan */}
      <mesh position={[0, 3.06, 0.45]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, 7.6, 10]} />
        <meshStandardMaterial color={PALETTE.rambuKuning} roughness={0.5} />
      </mesh>
    </group>

    {/* papan jam besar "11.55" di kiri-tengah */}
    <group position={[-4.6, 4.3, 0.8]}>
      <mesh position={[0, -2.15, -0.05]}>
        <cylinderGeometry args={[0.08, 0.1, 4.3, 10]} />
        <meshStandardMaterial color={PALETTE.bajaAbu} roughness={0.5} metalness={0.6} />
      </mesh>
      <mesh>
        <boxGeometry args={[2.7, 1.38, 0.12]} />
        <meshStandardMaterial color="#1E242C" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.07]}>
        <planeGeometry args={[2.56, 1.28]} />
        <meshStandardMaterial map={proyekJamTexture()} roughness={0.65} />
      </mesh>
    </group>

    {/* tower crane kuning dengan kait KOSONG */}
    <group position={[2.6, 0, -4.5]}>
      {/* tiang utama derek */}
      <mesh position={[0, 6.8, 0]}>
        <boxGeometry args={[0.95, 13.6, 0.95]} />
        <meshStandardMaterial color={PALETTE.derekKuning} roughness={0.55} metalness={0.25} />
      </mesh>
      {/* kabin operator */}
      <mesh position={[0, 12.6, 0.5]}>
        <boxGeometry args={[1.15, 1.1, 1.1]} />
        <meshStandardMaterial color="#2C3540" roughness={0.4} />
      </mesh>
      {/* lengan horizontal panjang (jib) */}
      <mesh position={[-3.2, 13.5, 0]}>
        <boxGeometry args={[13.2, 0.65, 0.72]} />
        <meshStandardMaterial color={PALETTE.derekKuning} roughness={0.55} metalness={0.25} />
      </mesh>
      {/* penyeimbang belakang */}
      <mesh position={[2.8, 13.4, 0]}>
        <boxGeometry args={[2.2, 1.0, 1.0]} />
        <meshStandardMaterial color="#58616B" roughness={0.85} />
      </mesh>
      {/* kabel & kait KOSONG diam */}
      <group position={[-5.2, 13.2, 0]}>
        <mesh position={[0, -1.65, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 3.3, 8]} />
          <meshStandardMaterial color="#23272E" roughness={0.4} metalness={0.7} />
        </mesh>
        <mesh position={[0, -3.35, 0]}>
          <boxGeometry args={[0.42, 0.36, 0.24]} />
          <meshStandardMaterial color={PALETTE.derekKuning} roughness={0.5} />
        </mesh>
        <mesh position={[0, -3.72, 0]} rotation={[0, 0, 0.35]}>
          <torusGeometry args={[0.2, 0.055, 10, 18, Math.PI * 1.4]} />
          <meshStandardMaterial color="#1D2024" roughness={0.4} metalness={0.7} />
        </mesh>
      </group>
    </group>
  </group>
);

/**
 * Set Trotoar Helm S06-D: trotoar panjang, bangku taman, pohon, tiang lampu, dan bangunan latar.
 */
export const SetTrotoarHelm: React.FC = () => (
  <group>
    {/* jalan depan */}
    <mesh position={[0, -0.02, 5.5]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[40, 8]} />
      <meshStandardMaterial color={PALETTE.aspal} roughness={0.92} />
    </mesh>
    {/* trotoar utama */}
    <mesh position={[0, 0.06, 0]}>
      <boxGeometry args={[40, 0.12, 4.8]} />
      <meshStandardMaterial color={PALETTE.trotoar} roughness={0.92} />
    </mesh>
    {/* rumput taman belakang */}
    <mesh position={[0, 0, -6.5]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[40, 10]} />
      <meshStandardMaterial color={PALETTE.alunAlun} roughness={0.95} />
    </mesh>

    {/* bangku taman */}
    {[-3.4, 2.2].map((bx) => (
      <group key={bx} position={[bx, 0.12, -1.35]}>
        <mesh position={[0, 0.4, 0]}>
          <boxGeometry args={[1.6, 0.07, 0.45]} />
          <meshStandardMaterial color={PALETTE.kayuMeja} roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.72, -0.2]}>
          <boxGeometry args={[1.6, 0.36, 0.06]} />
          <meshStandardMaterial color={PALETTE.kayuMeja} roughness={0.85} />
        </mesh>
        {([-0.65, 0.65] as const).map((lx) => (
          <mesh key={lx} position={[lx, 0.2, 0]}>
            <boxGeometry args={[0.08, 0.4, 0.4]} />
            <meshStandardMaterial color="#373E46" roughness={0.6} />
          </mesh>
        ))}
      </group>
    ))}

    <Pohon position={[-6.2, 0, -3.2]} scale={1.1} />
    <Pohon position={[-0.6, 0, -3.5]} scale={1.0} />
    <Pohon position={[4.8, 0, -3.2]} scale={1.15} />
    <TiangLampu position={[-4.5, 0.12, -1.8]} />
    <TiangLampu position={[1.4, 0.12, -1.8]} />

    <RumahSederhana position={[-5.5, 0, -9.0]} wallColor="#EDE5D2" />
    <RumahSederhana position={[3.0, 0, -9.2]} wallColor="#E2DAC8" roofColor="#9F4636" />
  </group>
);
