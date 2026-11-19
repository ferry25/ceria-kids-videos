import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import { ToothShort } from "./tooth/ToothShort";
import toothSong from "./tooth_song.json";
import { HandWashShort } from "./cuci-tangan/Video";
import cuciSong from "./cuci-tangan/song.json";
import { VeggieShort } from "./makan-sayur/Video";
import sayurSong from "./makan-sayur/song.json";
import { WaterShort } from "./minum-air/Video";
import airSong from "./minum-air/song.json";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <MyComposition />
      <Composition
        id="ToothShort"
        component={ToothShort}
        durationInFrames={toothSong.durationInFrames}
        fps={toothSong.fps}
        width={1080}
        height={1920}
      />
      <Composition
        id="HandWashShort"
        component={HandWashShort}
        durationInFrames={cuciSong.durationInFrames}
        fps={cuciSong.fps}
        width={1080}
        height={1920}
      />
      <Composition
        id="VeggieShort"
        component={VeggieShort}
        durationInFrames={sayurSong.durationInFrames}
        fps={sayurSong.fps}
        width={1080}
        height={1920}
      />
      <Composition
        id="WaterShort"
        component={WaterShort}
        durationInFrames={airSong.durationInFrames}
        fps={airSong.fps}
        width={1080}
        height={1920}
      />
    </>
  );
};
