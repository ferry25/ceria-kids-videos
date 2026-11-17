import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import { ToothShort } from "./tooth/ToothShort";
import toothSong from "./tooth_song.json";

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
    </>
  );
};
