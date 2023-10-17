import {
  GraphicalMusicSheet,
  OpenSheetMusicDisplay,
} from "opensheetmusicdisplay";
import React, { useEffect, useMemo, useRef, useState } from "react";

export interface OSMDProps {
  xml?: string;
  displayFirstNNotes?: number;
  displayLyrics?: boolean;
  displayLastNNotes?: number;
}

export const OSMD: React.FC<OSMDProps> = ({
  xml,
  displayFirstNNotes,
  displayLastNNotes,
  displayLyrics = false,
}) => {
  const ref = useRef(null);
  const [originalGraphicSheet, setOriginalGraphicSheet] =
    useState<GraphicalMusicSheet>();
  const osmd = useMemo(() => {
    if (ref.current === null) return null;
    return new OpenSheetMusicDisplay(ref.current, {
      autoResize: false,
      drawingParameters: "compacttight",
      drawCredits: false,
      disableCursor: true,
    });
  }, [ref.current]);

  const resetOSMD = async () => {
    if (osmd === null) return;
    if (xml === "" || !xml) return;
    await osmd.load(xml);
    if (ref.current) {
      (ref.current as HTMLElement).innerHTML = "";
    }
  };

  // These are done as functions and not in useEffect because we have to reset the OSMD object
  // if we remove something and want to add it back
  useEffect(() => {
    if (osmd === null) return;
    resetOSMD().then(() => {
      osmdDisplayFirstNNotes(displayFirstNNotes);
      osmdDisplayLyrics(displayLyrics);
      osmdDisplayLastNNotes(displayLastNNotes);
      osmd.render();
    });
  }, [osmd, xml, displayFirstNNotes, displayLyrics, displayLastNNotes]);

  // Remove lyrics
  const osmdDisplayLyrics = (_displayLyrics?: boolean) => {
    if (osmd === null || _displayLyrics !== false) return;
    osmd.GraphicSheet.MeasureList.forEach((measureList) => {
      measureList.forEach((measure) => {
        measure.staffEntries.forEach((staffEntry) => {
          staffEntry.LyricsEntries = [];
        });
      });
    });
  };

  // Display first n notes
  const osmdDisplayFirstNNotes = (_displayFirstNNotes?: number) => {
    if (osmd == null || !_displayFirstNNotes) return;
    let noteCounter = 0;
    let measureNumber = -1;
    osmd.GraphicSheet.MeasureList.forEach((measureList) => {
      measureList.forEach((measure) => {
        measure.staffEntries.forEach((staffEntry) => {
          staffEntry.graphicalVoiceEntries.forEach((voiceEntry) => {
            if (voiceEntry.notes) {
              const notes = voiceEntry.notes.filter(
                (x) => !x.sourceNote.isRest()
              );
              noteCounter += notes.length;
              if (noteCounter >= _displayFirstNNotes && measureNumber === -1) {
                measureNumber = measure.MeasureNumber;
              }
              if (noteCounter > _displayFirstNNotes) {
                notes.forEach((note) => {
                  note.sourceNote.NoteheadColor = "#b6b6b6";
                });
              }
            }
          });
        });
      });
    });

    if (measureNumber !== -1) {
      osmd.setOptions({
        drawUpToMeasureNumber: measureNumber + 1,
      });
    }
  };

  const osmdDisplayLastNNotes = (_displayLastNNotes?: number) => {
    if (osmd == null || !_displayLastNNotes) return;
    let noteCounter = 0;
    let measureNumber = -1;
    const reversedMeasureList = [...osmd.GraphicSheet.MeasureList].reverse();
    reversedMeasureList.forEach((measureList) => {
      const reversedMeasureList = [...measureList].reverse();
      reversedMeasureList.forEach((measure) => {
        const reversedStaffEntries = [...measure.staffEntries].reverse();
        reversedStaffEntries.forEach((staffEntry) => {
          const reversedVoiceEntries = [
            ...staffEntry.graphicalVoiceEntries,
          ].reverse();
          reversedVoiceEntries.forEach((voiceEntry) => {
            if (voiceEntry.notes) {
              const notes = voiceEntry.notes.filter(
                (x) => !x.sourceNote.isRest()
              );
              noteCounter += notes.length;
              if (noteCounter >= _displayLastNNotes && measureNumber === -1) {
                measureNumber = measure.MeasureNumber;
              }
              if (noteCounter > _displayLastNNotes) {
                notes.forEach((note) => {
                  note.sourceNote.NoteheadColor = "#b6b6b6";
                });
              }
            }
          });
        });
      });
    });

    if (measureNumber !== -1) {
      osmd.setOptions({
        drawFromMeasureNumber: measureNumber + 1,
      });
    }
  };

  return <div ref={ref}></div>;
};
