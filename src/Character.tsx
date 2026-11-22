import React from "react";
import { useCurrentFrame } from "remotion";

/**
 * Rig karakter universal gaya "Gimana Kalau?".
 * Satu rig untuk semua tokoh: kepala bola hitam glossy, mata putih ekspresif,
 * blush, mulut kecil. Diferensiasi lewat outfit + ekspresi saja.
 * Kanvas SVG: 320 x 480. Kepala pusat (160,118) r=96. Badan y 205..385, kaki 385..462.
 */
export type Outfit = "tahanan" | "sipir" | "hoodie";
export type Expression = "normal" | "kaget" | "mikir" | "licik";
export type ArmPose = "down" | "up" | "point";

type Props = {
  outfit: Outfit;
  expression?: Expression;
  talking?: boolean;
  walking?: boolean;
  armPose?: ArmPose;
  blinkOffset?: number;
  flip?: boolean;
  label?: string;
  width?: number;
  style?: React.CSSProperties;
};

const SKIN = "#1b1b21";

const Mouth: React.FC<{ expression: Expression; talking: boolean; frame: number }> = ({
  expression,
  talking,
  frame,
}) => {
  if (talking) {
    const open = Math.floor(frame / 4) % 2 === 0;
    return <ellipse cx={160} cy={168} rx={8} ry={open ? 10 : 2.5} fill="#5b2330" />;
  }
  switch (expression) {
    case "kaget":
      return <ellipse cx={160} cy={170} rx={7} ry={9} fill="#5b2330" />;
    case "licik":
      // seringai miring
      return (
        <path
          d="M146 164 Q162 176 178 162"
          stroke="#0c0c10"
          strokeWidth={5}
          fill="none"
          strokeLinecap="round"
        />
      );
    case "mikir":
      return (
        <path
          d="M150 168 Q160 164 170 168"
          stroke="#0c0c10"
          strokeWidth={5}
          fill="none"
          strokeLinecap="round"
        />
      );
    default:
      return (
        <path
          d="M148 163 Q160 172 172 163"
          stroke="#0c0c10"
          strokeWidth={5}
          fill="none"
          strokeLinecap="round"
        />
      );
  }
};

const Eyes: React.FC<{
  expression: Expression;
  blinking: boolean;
  frame: number;
  walking: boolean;
}> = ({ expression, blinking, frame }) => {
  if (blinking) {
    return (
      <g stroke="#0c0c10" strokeWidth={6} strokeLinecap="round" fill="none">
        <path d="M106 118 Q124 126 142 118" />
        <path d="M178 118 Q196 126 214 118" />
      </g>
    );
  }

  // pupil: posisi & ukuran per ekspresi
  let pupilR = 8.5;
  let dx = 0;
  let dy = 1;
  let eyeRy = 25;
  let lidCover = 0; // seberapa banyak kelopak menutup dari atas (0..1)
  if (expression === "kaget") {
    pupilR = 5;
    eyeRy = 29;
    dy = -2;
  } else if (expression === "mikir") {
    lidCover = 0.52;
    dx = 6;
    dy = 4;
    pupilR = 7.5;
  } else if (expression === "licik") {
    lidCover = 0.42;
    dx = -6;
    pupilR = 7;
  }

  const eye = (cx: number) => (
    <g key={cx}>
      <ellipse cx={cx} cy={116} rx={18} ry={eyeRy} fill="#ffffff" />
      <circle cx={cx + dx} cy={116 + dy} r={pupilR} fill="#101014" />
      <circle cx={cx + dx + 3} cy={116 + dy - 3} r={2.4} fill="#ffffff" />
      {lidCover > 0 && (
        <rect
          x={cx - 20}
          y={116 - eyeRy - 2}
          width={40}
          height={eyeRy * 2 * lidCover}
          fill={SKIN}
        />
      )}
    </g>
  );

  // alis per ekspresi
  let brows: React.ReactNode = (
    <g stroke="#0c0c10" strokeWidth={6} strokeLinecap="round" fill="none">
      <path d="M106 76 Q124 68 142 76" />
      <path d="M178 76 Q196 68 214 76" />
    </g>
  );
  if (expression === "kaget") {
    brows = (
      <g stroke="#0c0c10" strokeWidth={6} strokeLinecap="round" fill="none">
        <path d="M106 66 Q124 56 142 66" />
        <path d="M178 66 Q196 56 214 66" />
      </g>
    );
  } else if (expression === "mikir") {
    brows = (
      <g stroke="#0c0c10" strokeWidth={6} strokeLinecap="round" fill="none">
        <path d="M106 82 Q124 78 142 80" />
        <path d="M178 64 Q196 54 214 64" />
      </g>
    );
  } else if (expression === "licik") {
    brows = (
      <g stroke="#0c0c10" strokeWidth={6} strokeLinecap="round" fill="none">
        <path d="M106 84 L142 74" />
        <path d="M178 74 L214 84" />
      </g>
    );
  }

  return (
    <g>
      {eye(124)}
      {eye(196)}
      {brows}
    </g>
  );
};

const Torso: React.FC<{ outfit: Outfit; label: string }> = ({ outfit, label }) => {
  const torsoPath =
    "M96 218 Q160 196 224 218 L236 372 Q160 392 84 372 Z";
  if (outfit === "tahanan") {
    return (
      <g>
        <defs>
          <clipPath id="torsoClip">
            <path d={torsoPath} />
          </clipPath>
        </defs>
        <g clipPath="url(#torsoClip)">
          <rect x={80} y={195} width={160} height={200} fill="#d9d9d9" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect key={i} x={80} y={208 + i * 34} width={160} height={17} fill="#e8862e" />
          ))}
        </g>
        <path d={torsoPath} fill="none" stroke="#00000022" strokeWidth={3} />
        {/* label dada */}
        <g>
          <rect x={130} y={262} width={60} height={30} rx={4} fill="#ffffff" stroke="#9a9a9a" strokeWidth={2} />
          <text
            x={160}
            y={284}
            textAnchor="middle"
            fontFamily="Arial, Helvetica, sans-serif"
            fontWeight={800}
            fontSize={19}
            fill="#222222"
          >
            {label}
          </text>
        </g>
      </g>
    );
  }
  if (outfit === "sipir") {
    return (
      <g>
        <path d={torsoPath} fill="#2e4a73" />
        <path d="M138 210 L160 246 L182 210 L172 204 L160 224 L148 204 Z" fill="#d9e2ee" />
        <rect x={156} y={246} width={8} height={110} fill="#24405f" />
        {[268, 300, 332].map((y) => (
          <circle key={y} cx={160} cy={y} r={4.5} fill="#e8c85a" />
        ))}
        <rect x={104} y={238} width={26} height={18} rx={3} fill="#e8c85a" />
      </g>
    );
  }
  // hoodie merah
  return (
    <g>
      <path d={torsoPath} fill="#c03a30" />
      <rect x={126} y={318} width={68} height={44} rx={8} fill="#a8322a" />
      <line x1={148} y1={222} x2={144} y2={252} stroke="#f2d0cb" strokeWidth={5} strokeLinecap="round" />
      <line x1={172} y1={222} x2={176} y2={252} stroke="#f2d0cb" strokeWidth={5} strokeLinecap="round" />
    </g>
  );
};

export const Character: React.FC<Props> = ({
  outfit,
  expression = "normal",
  talking = false,
  walking = false,
  armPose = "down",
  blinkOffset = 0,
  flip = false,
  label = "C-07",
  width = 320,
  style,
}) => {
  const frame = useCurrentFrame();
  const height = width * 1.5;

  const blinkCycle = (frame + blinkOffset) % 105;
  const blinking = blinkCycle < 5;

  const walkPhase = frame * 0.55;
  const legSwing = walking ? Math.sin(walkPhase) * 17 : 0;
  const bob = walking ? -Math.abs(Math.sin(walkPhase)) * 5 : 0;
  const armSwing = walking ? Math.sin(walkPhase) * 10 : 0;

  const pants = outfit === "sipir" ? "#22354f" : outfit === "hoodie" ? "#3a3f47" : "#8a8f96";
  const sleeve =
    outfit === "sipir" ? "#2e4a73" : outfit === "hoodie" ? "#c03a30" : "#e8862e";

  const rightArmRotate =
    armPose === "up" ? -148 : armPose === "point" ? -82 : -armSwing;
  const leftArmRotate = armPose === "down" || armPose === "point" ? armSwing : 0;

  return (
    <div
      style={{
        width,
        height,
        transform: flip ? "scaleX(-1)" : undefined,
        ...style,
      }}
    >
      <svg viewBox="0 0 320 480" width={width} height={height}>
        <defs>
          <radialGradient id={`headGrad-${outfit}`} cx="38%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#55555f" />
            <stop offset="45%" stopColor="#2b2b33" />
            <stop offset="100%" stopColor="#131318" />
          </radialGradient>
        </defs>

        <g transform={`translate(0 ${bob})`}>
          {/* kaki */}
          <g transform={`rotate(${legSwing} 146 388)`}>
            <rect x={130} y={384} width={30} height={58} rx={10} fill={pants} />
            <rect x={122} y={436} width={42} height={16} rx={7} fill="#22242a" />
          </g>
          <g transform={`rotate(${-legSwing} 174 388)`}>
            <rect x={160} y={384} width={30} height={58} rx={10} fill={pants} />
            <rect x={156} y={436} width={42} height={16} rx={7} fill="#22242a" />
          </g>

          {/* badan */}
          <Torso outfit={outfit} label={label} />

          {/* lengan digambar SETELAH badan supaya terlihat menggantung di sisi tubuh */}
          <g transform={`rotate(${leftArmRotate} 92 232)`}>
            <rect x={77} y={226} width={30} height={104} rx={15} fill={sleeve} />
            <circle cx={92} cy={332} r={15} fill={SKIN} />
          </g>
          <g transform={`rotate(${rightArmRotate} 228 232)`}>
            <rect x={213} y={226} width={30} height={104} rx={15} fill={sleeve} />
            <circle cx={228} cy={332} r={15} fill={SKIN} />
          </g>

          {/* hood di belakang kepala untuk hoodie */}
          {outfit === "hoodie" && (
            <path
              d="M62 128 Q60 30 160 26 Q260 30 258 128 Q258 150 244 158 Q250 96 160 92 Q70 96 76 158 Q62 150 62 128 Z"
              fill="#a8322a"
            />
          )}

          {/* kepala */}
          <circle cx={160} cy={118} r={96} fill={`url(#headGrad-${outfit})`} />
          {/* highlight glossy */}
          <ellipse
            cx={112}
            cy={56}
            rx={40}
            ry={19}
            fill="#ffffff"
            opacity={0.32}
            transform="rotate(-24 112 56)"
          />
          <ellipse
            cx={100}
            cy={48}
            rx={17}
            ry={8}
            fill="#ffffff"
            opacity={0.5}
            transform="rotate(-24 100 48)"
          />

          {/* topi sipir */}
          {outfit === "sipir" && (
            <g>
              <path d="M66 96 Q70 22 160 20 Q250 22 254 96 L254 104 L66 104 Z" fill="#22354f" />
              <rect x={60} y={94} width={200} height={15} rx={7} fill="#182a42" />
              <circle cx={160} cy={58} r={9} fill="#e8c85a" />
            </g>
          )}

          <Eyes expression={expression} blinking={blinking} frame={frame} walking={walking} />

          {/* blush */}
          <ellipse cx={88} cy={150} rx={15} ry={8} fill="#e88ca0" opacity={0.5} />
          <ellipse cx={232} cy={150} rx={15} ry={8} fill="#e88ca0" opacity={0.5} />

          <Mouth expression={expression} talking={talking} frame={frame} />
        </g>
      </svg>
    </div>
  );
};
