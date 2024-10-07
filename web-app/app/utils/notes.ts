import { useTranslation } from "react-i18next";
import notes from "./notes.json";

export const midiToNote = (midi: number): string => {
  const indexes: string[] = [];
  Object.values(notes).forEach((value, i) => {
    if (value === midi) {
      indexes.push(Object.keys(notes)[i]);
    }
  });
  if (indexes.length === 1) {
    return indexes[0];
  } else {
    return indexes.join("/");
  }
};

export const noteToMidi = (note: string): number => {
  note = note.replace("b", "♭");
  return notes[note as keyof typeof notes];
};

export const allNotes = notes;

export const useKeyTranslate = (): ((key: string) => string) => {
  const { t } = useTranslation("keys");
  return (key: string) => t(key);
};
