import { Composition } from "remotion";
import { FidgetShort } from "./FidgetShort";
import song from "./song.json";

export const MyComposition = () => {
  return (
    <Composition
      id="FidgetShort"
      component={FidgetShort}
      durationInFrames={song.durationInFrames}
      fps={song.fps}
      width={1080}
      height={1920}
    />
  );
};
