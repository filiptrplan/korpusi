import { useTranslation } from "react-i18next";
import notes from "./notes.json";

export const midiToNote = (midi: number): string => {
  return (
    Object.keys(notes).find(
      (key) => notes[key as keyof typeof notes] === midi,
    ) || ""
  );
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
