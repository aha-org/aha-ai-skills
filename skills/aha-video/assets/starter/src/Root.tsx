import React from "react";
import { Composition } from "remotion";
import { Moment, MOMENT_FRAMES } from "./Moment";
import { Narrated, NARRATED_FRAMES } from "./Narrated";
import { Reel, TOTAL } from "./Reel";

// Every composition is 1080 x 1920 at 30 fps (vertical reels). Add a 1920 x 1080 one for TV loops and decks.
export const Root: React.FC = () => (
  <>
    <Composition id="Moment" component={Moment} durationInFrames={MOMENT_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="Narrated" component={Narrated} durationInFrames={NARRATED_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="Reel" component={Reel} durationInFrames={TOTAL} fps={30} width={1080} height={1920} />
  </>
);
