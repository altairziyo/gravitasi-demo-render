import React from "react";
import {
  AbsoluteFill,
  interpolate,
  Series,
  useCurrentFrame,
} from "remotion";
import { Character } from "./Character";
import { Camera, SceneLayer } from "./Prison";
import { DenahCard, LocationBanner, SpeechBubble, Stamp, TimePill } from "./Graphics";

export const SHOT_FRAMES = 90;
export const TOTAL_FRAMES = SHOT_FRAMES * 9;

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

/** S1 — Wide koridor: tahanan baru jalan masuk diantar sipir, banner lokasi pop. */
const Shot1: React.FC = () => {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [0, SHOT_FRAMES - 1], [180, 620], clamp);
  return (
    <AbsoluteFill>
      <Camera
        from={{ fx: 960, fy: 580, s: 0.68 }}
        to={{ fx: 1000, fy: 580, s: 0.71 }}
        durationInFrames={SHOT_FRAMES}
      >
        <SceneLayer>
          <Character outfit="tahanan" walking style={{ position: "absolute", left: x, top: 415 }} width={315} />
          <Character outfit="sipir" walking blinkOffset={40} style={{ position: "absolute", left: x + 370, top: 415 }} width={315} />
        </SceneLayer>
      </Camera>
      <LocationBanner text="LAPAS BATU HITAM" delay={12} style={{ left: 36, top: 30 }} />
    </AbsoluteFill>
  );
};

/** S2 — Medium depan sel C-07: stempel hukuman menghantam layar + guncangan. */
const Shot2: React.FC = () => {
  const frame = useCurrentFrame();
  const shakeT = frame >= 24 && frame <= 34 ? 34 - frame : 0;
  const sx = shakeT ? Math.sin(frame * 2.3) * shakeT * 0.8 : 0;
  const sy = shakeT ? Math.cos(frame * 2.9) * shakeT * 0.6 : 0;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", inset: 0, transform: `translate(${sx}px, ${sy}px)` }}>
        <Camera
          from={{ fx: 730, fy: 610, s: 1.0 }}
          to={{ fx: 730, fy: 595, s: 1.1 }}
          durationInFrames={SHOT_FRAMES}
        >
          <SceneLayer>
            <Character outfit="tahanan" expression="kaget" style={{ position: "absolute", left: 600, top: 400 }} width={330} />
            <Character outfit="sipir" blinkOffset={25} style={{ position: "absolute", left: 1010, top: 400 }} width={330} />
          </SceneLayer>
        </Camera>
      </div>
      <Stamp text="10 TAHUN PENJARA" delay={24} style={{ left: 300, top: 96 }} />
    </AbsoluteFill>
  );
};

/** S3 — Two-shot: sipir bicara, balon dialog dengan nama. */
const Shot3: React.FC = () => (
  <AbsoluteFill>
    <Camera
      from={{ fx: 800, fy: 610, s: 0.94 }}
      to={{ fx: 820, fy: 605, s: 0.98 }}
      durationInFrames={SHOT_FRAMES}
    >
      <SceneLayer>
        <Character outfit="sipir" talking blinkOffset={15} style={{ position: "absolute", left: 470, top: 405 }} width={325} />
        <Character outfit="tahanan" style={{ position: "absolute", left: 950, top: 405 }} width={325} />
      </SceneLayer>
    </Camera>
    <SpeechBubble
      name="SIPIR"
      text="Sel C-07. Ini rumah barumu untuk waktu yang lama."
      delay={10}
      width={470}
      style={{ left: 90, top: 84 }}
    />
  </AbsoluteFill>
);

/** S4 — Close-up tahanan kaget. */
const Shot4: React.FC = () => (
  <AbsoluteFill>
    <Camera
      from={{ fx: 800, fy: 480, s: 1.75 }}
      to={{ fx: 800, fy: 470, s: 1.9 }}
      durationInFrames={SHOT_FRAMES}
    >
      <SceneLayer>
        <Character outfit="tahanan" expression="kaget" talking style={{ position: "absolute", left: 610, top: 330 }} width={380} />
      </SceneLayer>
    </Camera>
    <SpeechBubble
      name="C-07"
      nameColor="#b35c14"
      text="Sepuluh tahun?! Lama banget!"
      delay={12}
      width={430}
      style={{ left: 770, top: 110 }}
    />
  </AbsoluteFill>
);

/** S5 — Di dalam sel dekat ranjang: mikir, pill HARI KE-1. */
const Shot5: React.FC = () => (
  <AbsoluteFill>
    <Camera
      from={{ fx: 1270, fy: 620, s: 1.0 }}
      to={{ fx: 1270, fy: 615, s: 1.07 }}
      durationInFrames={SHOT_FRAMES}
    >
      <SceneLayer>
        <Character outfit="tahanan" expression="mikir" armPose="up" style={{ position: "absolute", left: 1340, top: 420 }} width={300} />
      </SceneLayer>
    </Camera>
    <TimePill text="HARI KE-1" delay={14} style={{ right: 40, top: 34 }} />
  </AbsoluteFill>
);

/** S6 — Lompatan waktu: pill berganti HARI KE-40, ekspresi berubah licik. */
const Shot6: React.FC = () => {
  const frame = useCurrentFrame();
  const outScale = interpolate(frame, [28, 38], [1, 0], clamp);
  return (
    <AbsoluteFill>
      <Camera
        from={{ fx: 1270, fy: 615, s: 1.07 }}
        to={{ fx: 1270, fy: 610, s: 1.13 }}
        durationInFrames={SHOT_FRAMES}
      >
        <SceneLayer>
          <Character outfit="tahanan" expression="licik" armPose="point" style={{ position: "absolute", left: 1340, top: 420 }} width={300} />
          {/* kertas denah mini di tangan */}
          <div
            style={{
              position: "absolute",
              left: 1630,
              top: 596,
              width: 92,
              height: 66,
              backgroundColor: "#f7f5ee",
              border: "4px solid #2b3440",
              borderRadius: 5,
              transform: "rotate(-7deg)",
              backgroundImage:
                "linear-gradient(#d8d4c4 1px, transparent 1px), linear-gradient(90deg, #d8d4c4 1px, transparent 1px)",
              backgroundSize: "14px 14px",
            }}
          />
        </SceneLayer>
      </Camera>
      <div style={{ position: "absolute", right: 40, top: 34, transform: `scale(${outScale})`, opacity: outScale }}>
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "4px solid #23272e",
            borderRadius: 999,
            padding: "8px 26px",
            fontFamily: "Arial, Helvetica, sans-serif",
            fontWeight: 800,
            fontSize: 30,
            color: "#23272e",
          }}
        >
          HARI KE-1
        </div>
      </div>
      <TimePill text="HARI KE-40" delay={40} style={{ right: 40, top: 34 }} />
    </AbsoluteFill>
  );
};

/** S7 — Kartu denah layar penuh di atas set yang digelapkan. */
const Shot7: React.FC = () => (
  <AbsoluteFill>
    <Camera
      from={{ fx: 960, fy: 560, s: 0.667 }}
      to={{ fx: 960, fy: 560, s: 0.667 }}
      durationInFrames={SHOT_FRAMES}
    >
      <SceneLayer />
    </Camera>
    <AbsoluteFill style={{ backgroundColor: "rgba(20,26,36,0.55)" }} />
    <DenahCard style={{ left: 150, top: 60 }} />
  </AbsoluteFill>
);

/** S8 — Close-up licik: kesimpulan tokoh. */
const Shot8: React.FC = () => (
  <AbsoluteFill>
    <Camera
      from={{ fx: 800, fy: 480, s: 1.75 }}
      to={{ fx: 800, fy: 470, s: 1.9 }}
      durationInFrames={SHOT_FRAMES}
    >
      <SceneLayer>
        <Character outfit="tahanan" expression="licik" talking style={{ position: "absolute", left: 610, top: 330 }} width={380} />
      </SceneLayer>
    </Camera>
    <SpeechBubble
      name="C-07"
      nameColor="#b35c14"
      text="Patroli cuma tiap dua jam. Menarik..."
      delay={12}
      width={450}
      style={{ left: 750, top: 110 }}
    />
  </AbsoluteFill>
);

/** S9 — Malam: sipir patroli jalan, kamera pan mengikuti; tahanan mengintip licik. */
const Shot9: React.FC = () => {
  const frame = useCurrentFrame();
  const gx = interpolate(frame, [0, SHOT_FRAMES - 1], [240, 1330], clamp);
  const fx = interpolate(frame, [0, SHOT_FRAMES - 1], [800, 1120], clamp);
  return (
    <AbsoluteFill>
      <Camera
        from={{ fx, fy: 600, s: 0.8 }}
        to={{ fx, fy: 600, s: 0.8 }}
        durationInFrames={SHOT_FRAMES}
      >
        <SceneLayer>
          <Character outfit="sipir" walking blinkOffset={30} style={{ position: "absolute", left: gx, top: 415 }} width={315} />
          <Character outfit="tahanan" expression="licik" style={{ position: "absolute", left: 1560, top: 430 }} width={290} />
        </SceneLayer>
      </Camera>
      <AbsoluteFill style={{ backgroundColor: "rgba(14,28,54,0.30)" }} />
      <TimePill text="PUKUL 02.00" delay={10} style={{ right: 40, top: 34 }} />
    </AbsoluteFill>
  );
};

export const Proto: React.FC = () => {
  return (
    <Series>
      <Series.Sequence durationInFrames={SHOT_FRAMES}>
        <Shot1 />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SHOT_FRAMES}>
        <Shot2 />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SHOT_FRAMES}>
        <Shot3 />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SHOT_FRAMES}>
        <Shot4 />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SHOT_FRAMES}>
        <Shot5 />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SHOT_FRAMES}>
        <Shot6 />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SHOT_FRAMES}>
        <Shot7 />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SHOT_FRAMES}>
        <Shot8 />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SHOT_FRAMES}>
        <Shot9 />
      </Series.Sequence>
    </Series>
  );
};
