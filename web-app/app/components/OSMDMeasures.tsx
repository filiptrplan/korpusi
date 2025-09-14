import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";
import React, { useEffect, useMemo, useRef } from "react";

export interface OSMDMeasureProps {
  xml?: string;
  displayLyrics?: boolean;
  startMeasure: number;
  endMeasure: number;
  zoom?: number;
  fixedMeasureWidth?: number;
  divProps?: React.HTMLAttributes<HTMLDivElement>;
}

export const OSMDMeasures: React.FC<OSMDMeasureProps> = ({
  xml,
  startMeasure,
  endMeasure,
  displayLyrics = false,
  zoom = 0.8,
  fixedMeasureWidth,
  divProps,
}) => {
  const ref = useRef(null);
  const osmd = useMemo(() => {
    if (ref.current === null) return null;
    const osmd = new OpenSheetMusicDisplay(ref.current, {
      autoResize: false,
      drawingParameters: "compacttight",
      drawCredits: false,
      disableCursor: true,
      drawLyrics: displayLyrics,
    });
    return osmd;
  }, [ref.current]);

  const resetOSMD = async () => {
    if (osmd === null) return;
    if (xml === "" || !xml) return;
    await osmd.load(xml);
    osmd.render();
    if (ref.current) {
      (ref.current as HTMLElement).innerHTML = "";
    }
  };

  // These are done as functions and not in useEffect because we have to reset the OSMD object
  // if we remove something and want to add it back
  useEffect(() => {
    if (osmd === null) return;
    resetOSMD().then(() => {
      osmd.setOptions({
        drawFromMeasureNumber: startMeasure,
        drawUpToMeasureNumber: endMeasure + 1,
        drawLyrics: displayLyrics,
      });
      osmd.zoom = zoom;
      if (fixedMeasureWidth) {
        osmd.EngravingRules.FixedMeasureWidth = true;
        osmd.EngravingRules.FixedMeasureWidthFixedValue = fixedMeasureWidth;
      }
      osmd.EngravingRules.MinSkyBottomDistBetweenSystems = 0.0;
      osmd.EngravingRules.MinimumDistanceBetweenSystems = 0.0;
      osmd.render();
    });
  }, [
    osmd,
    xml,
    displayLyrics,
    startMeasure,
    endMeasure,
    zoom,
    fixedMeasureWidth,
  ]);

  // This is needed so the OSMD renders on page load
  useEffect(() => {
    osmd?.render();
  }, []);

  return <div ref={ref} {...divProps}></div>;
};
