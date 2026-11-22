import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

const FONT = "Arial, Helvetica, sans-serif";

const usePop = (delay: number, damping = 14) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping, stiffness: 180, mass: 0.6 } });
  return Math.max(0, p);
};

/** Banner lokasi: pil navy gelap + teks putih kapital, pop-in dari kiri. */
export const LocationBanner: React.FC<{ text: string; delay?: number; style?: React.CSSProperties }> = ({
  text,
  delay = 10,
  style,
}) => {
  const p = usePop(delay);
  return (
    <div
      style={{
        position: "absolute",
        display: "flex",
        alignItems: "center",
        gap: 12,
        backgroundColor: "#1d2f4e",
        borderRadius: 10,
        padding: "12px 22px 12px 16px",
        transform: `translateX(${interpolate(p, [0, 1], [-260, 0])}px)`,
        opacity: p,
        boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
        ...style,
      }}
    >
      <div style={{ width: 16, height: 16, backgroundColor: "#f2c230", borderRadius: 3 }} />
      <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 30, color: "#ffffff", letterSpacing: 1 }}>
        {text}
      </span>
    </div>
  );
};

/** Pill waktu: pil putih tepi gelap, teks tebal. */
export const TimePill: React.FC<{ text: string; delay?: number; style?: React.CSSProperties }> = ({
  text,
  delay = 8,
  style,
}) => {
  const p = usePop(delay);
  return (
    <div
      style={{
        position: "absolute",
        backgroundColor: "#ffffff",
        border: "4px solid #23272e",
        borderRadius: 999,
        padding: "8px 26px",
        transform: `scale(${p})`,
        opacity: p,
        boxShadow: "0 6px 14px rgba(0,0,0,0.3)",
        ...style,
      }}
    >
      <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 30, color: "#23272e", letterSpacing: 1 }}>
        {text}
      </span>
    </div>
  );
};

/** Stempel animasi: menghantam layar dari skala besar, miring, tepi ganda merah. */
export const Stamp: React.FC<{ text: string; delay?: number; style?: React.CSSProperties }> = ({
  text,
  delay = 20,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({
    frame: frame - delay,
    fps,
    config: { damping: 11, stiffness: 260, mass: 0.8 },
  });
  const scale = interpolate(p, [0, 1], [3.4, 1]);
  const opacity = interpolate(frame - delay, [0, 4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        transform: `rotate(-8deg) scale(${scale})`,
        opacity,
        border: "7px solid #c22f2f",
        borderRadius: 12,
        padding: 6,
        backgroundColor: "rgba(255,255,255,0.08)",
        ...style,
      }}
    >
      <div
        style={{
          border: "3px solid #c22f2f",
          borderRadius: 7,
          padding: "10px 26px",
        }}
      >
        <span
          style={{
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 54,
            color: "#c22f2f",
            letterSpacing: 2,
            whiteSpace: "nowrap",
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
};

/** Balon dialog putih dengan label nama penutur. */
export const SpeechBubble: React.FC<{
  name: string;
  nameColor?: string;
  text: string;
  delay?: number;
  width?: number;
  style?: React.CSSProperties;
}> = ({ name, nameColor = "#1d2f4e", text, delay = 6, width = 430, style }) => {
  const p = usePop(delay, 13);
  return (
    <div
      style={{
        position: "absolute",
        width,
        transform: `scale(${interpolate(p, [0, 1], [0.5, 1])})`,
        transformOrigin: "bottom left",
        opacity: p,
        ...style,
      }}
    >
      <div
        style={{
          display: "inline-block",
          backgroundColor: nameColor,
          color: "#ffffff",
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: 20,
          padding: "4px 14px",
          borderRadius: "8px 8px 0 0",
          marginLeft: 18,
          letterSpacing: 1,
        }}
      >
        {name}
      </div>
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 14,
          padding: "16px 20px",
          boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: 27,
          lineHeight: 1.3,
          color: "#23272e",
        }}
      >
        {text}
      </div>
      <div
        style={{
          width: 26,
          height: 26,
          backgroundColor: "#ffffff",
          transform: "rotate(45deg)",
          marginLeft: 44,
          marginTop: -14,
        }}
      />
    </div>
  );
};

/** Titik pada rute denah mengikuti progres gambar garis (0..1). */
const ROUTE: Array<[number, number]> = [
  [180, 292],
  [180, 318],
  [812, 318],
  [812, 292],
];
const routePoint = (p: number): [number, number] => {
  const segs: number[] = [];
  let total = 0;
  for (let i = 0; i < ROUTE.length - 1; i++) {
    const dx = ROUTE[i + 1][0] - ROUTE[i][0];
    const dy = ROUTE[i + 1][1] - ROUTE[i][1];
    const len = Math.hypot(dx, dy);
    segs.push(len);
    total += len;
  }
  let d = p * total;
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i]) {
      const t = segs[i] === 0 ? 0 : d / segs[i];
      return [
        ROUTE[i][0] + (ROUTE[i + 1][0] - ROUTE[i][0]) * t,
        ROUTE[i][1] + (ROUTE[i + 1][1] - ROUTE[i][1]) * t,
      ];
    }
    d -= segs[i];
  }
  return ROUTE[ROUTE.length - 1];
};

const Block: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  label: string;
  children?: React.ReactNode;
}> = ({ x, y, w, h, color, label, children }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      backgroundColor: color,
      border: "4px solid #2b3440",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 24, color: "#2b3440" }}>{label}</span>
    {children}
  </div>
);

const Badge: React.FC<{ n: number; label: string; delay: number; style?: React.CSSProperties }> = ({
  n,
  label,
  delay,
  style,
}) => {
  const p = usePop(delay);
  return (
    <div style={{ position: "absolute", display: "flex", alignItems: "center", gap: 8, transform: `scale(${p})`, opacity: p, ...style }}>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          backgroundColor: "#e86a2e",
          border: "3px solid #ffffff",
          boxShadow: "0 3px 8px rgba(0,0,0,0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 24,
          color: "#ffffff",
        }}
      >
        {n}
      </div>
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "3px solid #2b3440",
          borderRadius: 8,
          padding: "3px 12px",
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: 20,
          color: "#2b3440",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </div>
    </div>
  );
};

/**
 * Kartu info denah lapas: kertas grid, blok-blok ruangan,
 * garis rute putus-putus yang MENGGAMBAR DIRI + titik berjalan,
 * pill info sipir, dan badge bernomor yang pop berurutan.
 */
export const DenahCard: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
  const frame = useCurrentFrame();
  const p = usePop(4, 15);
  const draw = interpolate(frame, [18, 68], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const [dotX, dotY] = routePoint(draw);
  const pillP = usePop(52);

  return (
    <div
      style={{
        position: "absolute",
        width: 980,
        height: 600,
        backgroundColor: "#f7f5ee",
        backgroundImage:
          "linear-gradient(#d8d4c4 1px, transparent 1px), linear-gradient(90deg, #d8d4c4 1px, transparent 1px)",
        backgroundSize: "28px 28px",
        border: "6px solid #2b3440",
        borderRadius: 22,
        boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
        transform: `scale(${interpolate(p, [0, 1], [0.7, 1])})`,
        opacity: p,
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 34,
          top: 22,
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 34,
          color: "#23272e",
          letterSpacing: 0.5,
        }}
      >
        DENAH LAPAS BATU HITAM
      </div>
      <div
        style={{
          position: "absolute",
          right: 30,
          top: 20,
          backgroundColor: "#2f5fb3",
          borderRadius: 999,
          padding: "8px 20px",
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: 21,
          color: "#ffffff",
          transform: `scale(${pillP})`,
          opacity: pillP,
        }}
      >
        SIPIR: TIAP 2 JAM
      </div>

      <Block x={40} y={86} w={280} h={196} color="#ddd5c3" label="BLOK C">
        {/* deretan sel kecil; sel tengah kuning = sel tokoh */}
        <div style={{ position: "absolute", top: 12, left: 14, display: "flex", gap: 8 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                width: 44,
                height: 52,
                backgroundColor: i === 2 ? "#f2c230" : "#c9c0aa",
                border: "3px solid #2b3440",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {i === 2 && (
                <div style={{ width: 22, height: 22, borderRadius: "50%", backgroundColor: "#1b1b21", position: "relative" }}>
                  <div style={{ position: "absolute", left: 5, top: 8, width: 4, height: 4, borderRadius: "50%", backgroundColor: "#fff" }} />
                  <div style={{ position: "absolute", right: 5, top: 8, width: 4, height: 4, borderRadius: "50%", backgroundColor: "#fff" }} />
                </div>
              )}
            </div>
          ))}
        </div>
        <span
          style={{
            position: "absolute",
            top: 70,
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 16,
            color: "#2b3440",
          }}
        >
          KAMU
        </span>
      </Block>
      <Block x={352} y={86} w={280} h={196} color="#b7d99a" label="HALAMAN" />
      <Block x={664} y={86} w={276} h={196} color="#f0dfae" label="RUANG MAKAN" />
      <Block x={40} y={330} w={280} h={180} color="#c3d6e2" label="" />
      <Block x={352} y={330} w={280} h={180} color="#ddcfe8" label="KANTOR" />
      <Block x={664} y={330} w={276} h={180} color="#9aa5b1" label="GERBANG" />

      {/* rute putus-putus menggambar diri: segmen ditambah satu per satu */}
      <svg style={{ position: "absolute", left: 0, top: 0 }} width={980} height={600} viewBox="0 0 980 600">
        {(() => {
          const totalLen = 26 + 632 + 26;
          const dash = 15;
          const gap = 10;
          const shown = draw * totalLen;
          const lines: React.ReactNode[] = [];
          for (let d = 0; d + dash <= shown + 0.001; d += dash + gap) {
            const [x1, y1] = routePoint(d / totalLen);
            const [x2, y2] = routePoint((d + dash) / totalLen);
            lines.push(
              <line key={d} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#2f5fb3" strokeWidth={6} strokeLinecap="round" />
            );
          }
          return lines;
        })()}
        {draw > 0 && <circle cx={dotX} cy={dotY} r={11} fill="#2b3440" stroke="#ffffff" strokeWidth={4} />}
      </svg>

      <Badge n={1} label="pintu belakang" delay={30} style={{ left: 26, top: 356 }} />
      <Badge n={2} label="pagar rusak" delay={58} style={{ left: 470, top: 66 }} />
    </div>
  );
};
