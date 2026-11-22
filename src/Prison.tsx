import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";

/**
 * Satu set latar penjara digambar kode (SVG 1920x1080):
 * koridor + tiga pintu sel berjeruji (C-12, C-07, C-13) + ranjang susun + jendela.
 * Semua shot mengambil sudut berbeda dari set yang sama lewat komponen Camera.
 */

const CellDoor: React.FC<{ x: number; label: string }> = ({ x, label }) => (
  <g>
    <rect x={x} y={250} width={330} height={640} fill="#7e8fa3" />
    <rect x={x} y={250} width={330} height={640} fill="none" stroke="#39434f" strokeWidth={14} />
    {/* jeruji vertikal */}
    {Array.from({ length: 8 }).map((_, i) => (
      <rect key={i} x={x + 28 + i * 40} y={262} width={11} height={616} fill="#4a5563" />
    ))}
    {/* jeruji horizontal */}
    <rect x={x + 6} y={420} width={318} height={12} fill="#4a5563" />
    <rect x={x + 6} y={660} width={318} height={12} fill="#4a5563" />
    {/* pelat nomor sel */}
    <g>
      <rect x={x + 115} y={196} width={100} height={40} rx={6} fill="#eef1f4" stroke="#39434f" strokeWidth={4} />
      <text
        x={x + 165}
        y={226}
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight={800}
        fontSize={26}
        fill="#2b3440"
      >
        {label}
      </text>
    </g>
  </g>
);

export const PrisonSet: React.FC = () => {
  return (
    <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
      {/* dinding dua nada */}
      <rect x={0} y={0} width={1920} height={560} fill="#ddd5c3" />
      <rect x={0} y={560} width={1920} height={330} fill="#93a7bc" />
      <rect x={0} y={548} width={1920} height={14} fill="#77879b" />
      {/* lantai */}
      <rect x={0} y={890} width={1920} height={190} fill="#66727f" />
      <rect x={0} y={890} width={1920} height={10} fill="#525d69" />
      {Array.from({ length: 9 }).map((_, i) => (
        <line
          key={i}
          x1={120 + i * 220}
          y1={1080}
          x2={300 + i * 220}
          y2={900}
          stroke="#59636f"
          strokeWidth={5}
        />
      ))}
      <line x1={0} y1={985} x2={1920} y2={985} stroke="#59636f" strokeWidth={5} />

      {/* lampu langit-langit */}
      {[300, 960, 1620].map((x) => (
        <g key={x}>
          <rect x={x - 110} y={26} width={220} height={26} rx={10} fill="#f4f1e6" stroke="#b9b2a0" strokeWidth={4} />
          <rect x={x - 130} y={52} width={260} height={60} fill="#fffbe8" opacity={0.13} />
        </g>
      ))}

      {/* jendela berjeruji kiri atas */}
      <g>
        <rect x={120} y={110} width={210} height={150} fill="#bcd3e2" stroke="#77879b" strokeWidth={10} />
        {[162, 204, 246, 288].map((x) => (
          <rect key={x} x={x} y={110} width={9} height={150} fill="#5d6b7a" />
        ))}
      </g>

      {/* poster aturan */}
      <g>
        <rect x={1560} y={120} width={180} height={230} fill="#f0ead8" stroke="#a39a83" strokeWidth={5} />
        <rect x={1580} y={140} width={140} height={26} fill="#c03a30" />
        <text x={1650} y={160} textAnchor="middle" fontFamily="Arial" fontWeight={800} fontSize={17} fill="#ffffff">
          TATA TERTIB
        </text>
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x={1582} y={186 + i * 30} width={136 - (i % 3) * 22} height={11} fill="#9a927c" />
        ))}
      </g>

      {/* jam dinding */}
      <g>
        <circle cx={1830} cy={180} r={46} fill="#f4f1e6" stroke="#39434f" strokeWidth={7} />
        <line x1={1830} y1={180} x2={1830} y2={148} stroke="#39434f" strokeWidth={6} strokeLinecap="round" />
        <line x1={1830} y1={180} x2={1856} y2={192} stroke="#39434f" strokeWidth={6} strokeLinecap="round" />
      </g>

      {/* pintu-pintu sel */}
      <CellDoor x={90} label="C-12" />
      <CellDoor x={560} label="C-07" />
      <CellDoor x={1030} label="C-13" />

      {/* ranjang susun kanan */}
      <g>
        <rect x={1470} y={330} width={16} height={560} fill="#5d6b7a" />
        <rect x={1850} y={330} width={16} height={560} fill="#5d6b7a" />
        <rect x={1470} y={470} width={396} height={20} fill="#5d6b7a" />
        <rect x={1470} y={700} width={396} height={20} fill="#5d6b7a" />
        <rect x={1486} y={436} width={364} height={36} rx={8} fill="#e8e2d2" />
        <rect x={1486} y={666} width={364} height={36} rx={8} fill="#e8e2d2" />
        <rect x={1486} y={452} width={230} height={20} fill="#5b7ea6" />
        <rect x={1486} y={682} width={230} height={20} fill="#5b7ea6" />
        <rect x={1500} y={412} width={90} height={30} rx={10} fill="#f4f1e6" />
        <rect x={1500} y={642} width={90} height={30} rx={10} fill="#f4f1e6" />
      </g>

      {/* garis kuning lantai koridor */}
      <rect x={0} y={866} width={1920} height={9} fill="#d8b93c" opacity={0.65} />
    </svg>
  );
};

/** Kamera halus kontinu: fokus + skala diinterpolasi dengan easing di semua frame. */
export const Camera: React.FC<{
  from: { fx: number; fy: number; s: number };
  to: { fx: number; fy: number; s: number };
  durationInFrames: number;
  children: React.ReactNode;
}> = ({ from, to, durationInFrames, children }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [0, durationInFrames - 1], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const s = from.s + (to.s - from.s) * t;
  const fx = from.fx + (to.fx - from.fx) * t;
  const fy = from.fy + (to.fy - from.fy) * t;
  const tx = 640 - fx * s;
  const ty = 360 - fy * s;
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#66727f" }}>
      <div
        style={{
          position: "absolute",
          width: 1920,
          height: 1080,
          transform: `translate(${tx}px, ${ty}px) scale(${s})`,
          transformOrigin: "0 0",
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

/** Lapisan adegan 1920x1080: set + karakter diposisikan dalam koordinat set yang sama. */
export const SceneLayer: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ position: "absolute", width: 1920, height: 1080 }}>
    <PrisonSet />
    {children}
  </div>
);
