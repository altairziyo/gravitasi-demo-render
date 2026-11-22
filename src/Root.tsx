import React from "react";
import { Composition } from "remotion";
import { Proto, TOTAL_FRAMES } from "./Proto";
import { Proto3D } from "./Proto3D";
import { SimuShowcase, SIMU_SHOWCASE_FRAMES } from "./SimuShowcase";
import { DimasShowcase, DIMAS_SHOWCASE_FRAMES } from "./DimasShowcase";
import { GravitasiDemo } from "./GravitasiDemo";
import { FPS, HEIGHT, TOTAL_FRAMES as GRAVITASI_FRAMES, WIDTH } from "./gravitasi/timeline";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Proto"
        component={Proto}
        durationInFrames={TOTAL_FRAMES}
        fps={30}
        width={1280}
        height={720}
      />
      <Composition
        id="Proto3D"
        component={Proto3D}
        durationInFrames={TOTAL_FRAMES}
        fps={30}
        width={1280}
        height={720}
      />
      <Composition
        id="SimuShowcase"
        component={SimuShowcase}
        durationInFrames={SIMU_SHOWCASE_FRAMES}
        fps={30}
        width={1280}
        height={720}
      />
      <Composition
        id="DimasShowcase"
        component={DimasShowcase}
        durationInFrames={DIMAS_SHOWCASE_FRAMES}
        fps={30}
        width={1280}
        height={720}
      />
      <Composition
        id="GravitasiDemo"
        component={GravitasiDemo}
        durationInFrames={GRAVITASI_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    </>
  );
};
