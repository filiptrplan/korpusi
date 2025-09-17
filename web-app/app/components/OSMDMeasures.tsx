import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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
  const [osmd, setOsmd] = useState<null | OpenSheetMusicDisplay>(null);

  const handleRef = useCallback((node: HTMLDivElement | null) => {
    if (node === null) return;
    const temp_osmd = new OpenSheetMusicDisplay(node as HTMLElement, {
      autoResize: false,
      drawingParameters: "compacttight",
      drawCredits: false,
      disableCursor: true,
      drawLyrics: displayLyrics,
    });
    setOsmd(temp_osmd);
  }, []);

  const resetOSMD = async () => {
    if (osmd === null) return;
    if (xml === "" || !xml) return;
    await osmd.load(xml);
    osmd.render();
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

  return <div ref={handleRef} {...divProps}></div>;
};
