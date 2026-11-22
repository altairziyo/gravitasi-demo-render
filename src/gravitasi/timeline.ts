/**
 * Tabel timeline, konstanta kamera rima S01<->S13, dan palet warna bersama
 * untuk komposisi demo Gravitasi S01-S06.
 */

export const FPS = 30;
export const WIDTH = 1280;
export const HEIGHT = 720;
export const TOTAL_FRAMES = 6041;

export const SHOTS = [
  { id: "S01-A", frames: 96 },
  { id: "S01-B", frames: 178 },
  { id: "S01-C", frames: 225 },
  { id: "S01-D", frames: 176 },
  { id: "S01-E", frames: 107 },
  { id: "HITAM", frames: 26 },
  { id: "S02-A", frames: 91 },
  { id: "S02-B", frames: 287 },
  { id: "S02-C", frames: 219 },
  { id: "S02-D", frames: 384 },
  { id: "S02-E", frames: 275 },
  { id: "S02-F", frames: 148 },
  { id: "S03-A", frames: 375 },
  { id: "S03-B", frames: 227 },
  { id: "S03-C1", frames: 52 },
  { id: "S03-C2", frames: 71 },
  { id: "S03-C3", frames: 84 },
  { id: "S03-D", frames: 84 },
  { id: "S03-E", frames: 150 },
  { id: "S04-A", frames: 165 },
  { id: "S04-B1", frames: 114 },
  { id: "S04-B2", frames: 226 },
  { id: "S04-C1", frames: 230 },
  { id: "S04-C2", frames: 170 },
  { id: "S04-D", frames: 109 },
  { id: "S05-A", frames: 204 },
  { id: "S05-B1", frames: 45 },
  { id: "S05-B2", frames: 59 },
  { id: "S05-C", frames: 118 },
  { id: "S05-D", frames: 296 },
  { id: "S06-A", frames: 214 },
  { id: "S06-B", frames: 152 },
  { id: "S06-C", frames: 82 },
  { id: "S06-D", frames: 229 },
  { id: "S06-E", frames: 125 },
  { id: "S06-F", frames: 248 },
] as const;

export type ShotId = (typeof SHOTS)[number]["id"];

const totalCheck = SHOTS.reduce((acc, shot) => acc + shot.frames, 0);
if (totalCheck !== TOTAL_FRAMES) {
  throw new Error(
    `Jumlah durasi SHOTS harus ${TOTAL_FRAMES}, terhitung ${totalCheck}`,
  );
}

export type ShotTiming = {
  id: ShotId;
  frames: number;
  start: number;
  end: number;
};

export const SHOT_TIMINGS: ShotTiming[] = (() => {
  let cursor = 0;
  return SHOTS.map((s) => {
    const start = cursor;
    cursor += s.frames;
    return { id: s.id, frames: s.frames, start, end: cursor };
  });
})();

export const SHOT_FRAMES: Record<ShotId, number> = SHOTS.reduce(
  (acc, s) => {
    acc[s.id] = s.frames;
    return acc;
  },
  {} as Record<ShotId, number>,
);

/**
 * Konstanta kunci rima visual S01-D <-> S13-B (juga basis S13-A).
 * Mengikat FOV, sudut curam, up-vector bebas gimbal lock, offset kamera,
 * sumbu jatuh di jalan raya, warna aspal & langit, serta preset TerikKunci.
 */
export const RHYME_FALL_CAM = {
  fov: 46,
  pitchDeg: -78,
  up: [0, 0, -1] as [number, number, number],
  distance: 3.55,
  camOffset: [-0.2, 3.49, 0.7] as [number, number, number],
  axisX: 9.5,
  axisZ: -18.0,
  yFrom: 20.0,
  yTo: 12.5,
  bodyRotation: [-Math.PI / 2, 0.18, 0.22] as [number, number, number],
  from: {
    pos: [9.3, 23.49, -17.3] as [number, number, number],
    look: [9.5, 19.85, -18.0] as [number, number, number],
    fov: 46,
  },
  to: {
    pos: [9.3, 15.99, -17.3] as [number, number, number],
    look: [9.5, 12.35, -18.0] as [number, number, number],
    fov: 46,
  },
  asphaltColor: "#2E3238",
  markaColor: "#D8D6CE",
  skyColor: "#B8D4E8",
  lightingPreset: "TerikKunci" as const,
} as const;

export const PALETTE = {
  // Aspal & lanskap
  aspal: "#2E3238",
  marka: "#D8D6CE",
  trotoar: "#B6BCC3",
  trotoarGelap: "#8E969F",
  alunAlun: "#6FA35A",
  alunAlunTepian: "#5D8E4B",

  // Langit per suasana
  langitTerik: "#B8D4E8",
  langitStandar: "#9BC8E8",
  langitMelayang: "#A8D8F5",
  langitPagi: "#BFDDF2",
  langitFestival: "#8CC4EE",
  langitSore: "#E8925C",
  langitMalam: "#141D2E",

  // Tokoh Dimas (referensi bersama)
  kulitTan: "#D98E54",
  syalKunyit: "#E8862E",
  jaketIndigo: "#5B4B9E",
  kuningan: "#C9962E",

  // Rambu, keselamatan, peringatan
  rambuKuning: "#F4B829",
  rambuHitam: "#1D2024",
  sabukOranye: "#F28C28",
  bahayaMerah: "#E03E36",
  jaringSamar: "#D49A3A",
  sireneMerah: "#FF4A2E",
  taliHijau: "#2FA84F",

  // Kota & warung
  gentengMerah: "#B84D38",
  dindingKrem: "#E8DFC8",
  menaraBatu: "#DDD6C5",
  menaraTrim: "#7D8793",
  kayuWarung: "#8A5A36",
  kayuMeja: "#9E6A41",

  // Cairan & prop FX
  kuahSoto: "#E89A2C",
  esTeh: "#7C3F14",
  topiMerah: "#D94B2B",
  koranKertas: "#EDE9DE",
  debu: "#9A8C7A",

  // Interior S06
  papanTulis: "#244D36",
  lantaiKantor: "#D4DAE0",
  dindingKantor: "#EDF0F4",
  kubikel: "#B4C0CC",
  lantaiRS: "#EAF2F7",
  derekKuning: "#E8B024",
  bajaAbu: "#5C6570",

  // Varian figuran
  kulitWarga: ["#C88753", "#B07042", "#DA9E6C"] as const,
  bajuWarga: ["#4A7C9B", "#6A8D5E", "#C96D4B", "#7A6998", "#D6A84A", "#5B6E7D"] as const,
  celanaWarga: ["#3C434E", "#4F463D", "#2E3B4E"] as const,
  helmWarga: ["#F4B829", "#F28C28", "#F4F6F8", "#3B82C4", "#55A65A"] as const,
} as const;
