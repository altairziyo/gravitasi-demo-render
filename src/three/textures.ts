import * as THREE from "three";

/**
 * Semua tekstur digambar prosedural lewat canvas 2D (tanpa aset gambar luar):
 * belang tahanan, label dada, pelat nomor sel, muka jam, poster aturan, denah mini.
 * Hasilnya di-cache per kunci supaya tidak digambar ulang tiap frame.
 */
const cache = new Map<string, THREE.CanvasTexture>();

const make = (
  key: string,
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
): THREE.CanvasTexture => {
  const hit = cache.get(key);
  if (hit) return hit;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  cache.set(key, tex);
  return tex;
};

/** Belang tahanan: dasar abu terang + garis oranye horizontal (mengelilingi badan kapsul). */
export const stripesTexture = (): THREE.CanvasTexture => {
  const tex = make("stripes", 256, 256, (ctx, w, h) => {
    ctx.fillStyle = "#d9d9d9";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#e8862e";
    for (let y = 14; y < h; y += 64) {
      ctx.fillRect(0, y, w, 32);
    }
  });
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
};

/** Label dada / pelat teks putih dengan tepi abu dan teks gelap tebal. */
export const labelTexture = (text: string): THREE.CanvasTexture =>
  make(`label-${text}`, 256, 128, (ctx, w, h) => {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#9a9a9a";
    ctx.lineWidth = 8;
    ctx.strokeRect(6, 6, w - 12, h - 12);
    ctx.fillStyle = "#222222";
    ctx.font = "800 64px Arial, Helvetica, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, w / 2, h / 2 + 4);
  });

/** Pelat nomor sel di atas pintu: pelat terang, teks gelap. */
export const cellPlateTexture = (text: string): THREE.CanvasTexture =>
  make(`cell-${text}`, 256, 96, (ctx, w, h) => {
    ctx.fillStyle = "#eef1f4";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#39434f";
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, w - 10, h - 10);
    ctx.fillStyle = "#2b3440";
    ctx.font = "800 56px Arial, Helvetica, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, w / 2, h / 2 + 3);
  });

/** Muka jam dinding: lingkaran putih, garis menit, jarum menunjuk ±10.10. */
export const clockTexture = (): THREE.CanvasTexture =>
  make("clock", 256, 256, (ctx, w, h) => {
    const cx = w / 2;
    const cy = h / 2;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#f4f1e6";
    ctx.beginPath();
    ctx.arc(cx, cy, 118, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#39434f";
    ctx.lineWidth = 6;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const r1 = 96;
      const r2 = 110;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
      ctx.stroke();
    }
    ctx.strokeStyle = "#23272e";
    ctx.lineCap = "round";
    // jarum jam ke 10, jarum menit ke 2
    ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(-2.36) * 62, cy + Math.sin(-2.36) * 62);
    ctx.stroke();
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(-0.52) * 88, cy + Math.sin(-0.52) * 88);
    ctx.stroke();
    ctx.fillStyle = "#c22f2f";
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.fill();
  });

/** Poster aturan: kop merah + baris-baris teks semu. */
export const posterTexture = (): THREE.CanvasTexture =>
  make("poster", 256, 320, (ctx, w, h) => {
    ctx.fillStyle = "#f0ead8";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#a39a83";
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, w - 8, h - 8);
    ctx.fillStyle = "#c03a30";
    ctx.fillRect(18, 18, w - 36, 52);
    ctx.fillStyle = "#ffffff";
    ctx.font = "800 30px Arial, Helvetica, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("ATURAN", w / 2, 45);
    ctx.fillStyle = "#9a927c";
    for (let i = 0; i < 6; i++) {
      const lw = w - 60 - (i % 3) * 34;
      ctx.fillRect(30, 100 + i * 34, lw, 13);
    }
  });

/** Denah mini di kertas: grid + blok ruangan + rute putus-putus biru (untuk dipegang tokoh). */
export const denahMiniTexture = (): THREE.CanvasTexture =>
  make("denah-mini", 256, 192, (ctx, w, h) => {
    ctx.fillStyle = "#f7f5ee";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#d8d4c4";
    ctx.lineWidth = 1;
    for (let x = 0; x <= w; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += 16) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    const blocks: Array<[number, number, number, number, string]> = [
      [14, 14, 70, 52, "#ddd5c3"],
      [98, 14, 70, 52, "#b7d99a"],
      [182, 14, 60, 52, "#f0dfae"],
      [14, 116, 70, 58, "#c3d6e2"],
      [98, 116, 70, 58, "#ddcfe8"],
      [182, 116, 60, 58, "#9aa5b1"],
    ];
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#2b3440";
    for (const [x, y, bw, bh, color] of blocks) {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, bw, bh);
      ctx.strokeRect(x, y, bw, bh);
    }
    ctx.strokeStyle = "#2f5fb3";
    ctx.lineWidth = 5;
    ctx.setLineDash([10, 7]);
    ctx.beginPath();
    ctx.moveTo(48, 92);
    ctx.lineTo(48, 104);
    ctx.lineTo(212, 104);
    ctx.lineTo(212, 92);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#2b3440";
    ctx.beginPath();
    ctx.arc(212, 92, 7, 0, Math.PI * 2);
    ctx.fill();
  });

/**
 * Kepala SIMU: belahan vertikal toska (kiri) / oranye (kanan).
 * Pada UV sphere three.js: depan (+Z) di u=0.25, kanan layar (+X) di u=0.5,
 * belakang di u=0.75. Jadi pita u 0.25..0.75 = separuh +X (oranye, kanan layar),
 * sisanya toska (kiri layar). Garis belahan lurus di u=0.25 (depan) & u=0.75 (belakang).
 */
export const simuHeadTexture = (): THREE.CanvasTexture =>
  make("simu-head", 1024, 512, (ctx, w, h) => {
    ctx.fillStyle = "#1F9E8E";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#F08A24";
    ctx.fillRect(w * 0.25, 0, w * 0.5, h);
    // garis belahan halus tepat di tengah depan & belakang
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.fillRect(w * 0.25 - 5, 0, 10, h);
    ctx.fillRect(w * 0.75 - 5, 0, 10, h);
  });

/** Emblem dada SIMU: segitiga "play" terbelah toska (kiri) / oranye (kanan), latar transparan. */
export const simuEmblemTexture = (): THREE.CanvasTexture =>
  make("simu-emblem", 256, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const tri = () => {
      ctx.beginPath();
      ctx.moveTo(84, 58);
      ctx.lineTo(84, 198);
      ctx.lineTo(188, 128);
      ctx.closePath();
    };
    // separuh kiri toska
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w / 2, h);
    ctx.clip();
    tri();
    ctx.fillStyle = "#1F9E8E";
    ctx.fill();
    ctx.restore();
    // separuh kanan oranye
    ctx.save();
    ctx.beginPath();
    ctx.rect(w / 2, 0, w / 2, h);
    ctx.clip();
    tri();
    ctx.fillStyle = "#F08A24";
    ctx.fill();
    ctx.restore();
    // garis tepi halus
    tri();
    ctx.strokeStyle = "rgba(70,64,54,0.35)";
    ctx.lineWidth = 5;
    ctx.lineJoin = "round";
    ctx.stroke();
  });
