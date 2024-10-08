import {
  Autocomplete,
  FormLabel,
  Slider,
  Stack,
  TextField,
} from "@mui/material";
import { useControlledState } from "../../utils/useControlledState";
import { useTranslation } from "react-i18next";
import { allNotes, midiToNote, noteToMidi } from "~/utils/notes";
import { useMemo } from "react";

interface NoteRangeSliderProps {
  noteFrom?: string;
  noteTo?: string;
  label?: string;
  nameFrom: string;
  nameTo: string;
}

export const NoteRangeSlider: React.FC<NoteRangeSliderProps> = ({
  noteFrom,
  noteTo,
  label,
  nameFrom,
  nameTo,
}) => {
  const [noteFromState, setNoteFromState] = useControlledState(
    noteFrom ? parseInt(noteFrom) : 23
  );
  const [noteToState, setNoteToState] = useControlledState(
    noteTo ? parseInt(noteTo) : 132
  );
  const { t } = useTranslation("search");
  const options = useMemo(() => {
    return [...new Set(Object.values(allNotes))];
  }, []);
  return (
    <>
      <Stack direction={"row"} spacing={2} alignItems={"center"}>
        <FormLabel>{label}:</FormLabel>
        <Autocomplete
          value={noteFromState}
          sx={{
            width: "6rem",
          }}
          onChange={(e, newValue) => {
            console.log(newValue)
            setNoteFromState(newValue as number);
          }}
          disableClearable
          renderInput={(params) => <TextField {...params} label={t("from")} />}
          options={options}
          getOptionLabel={(option) => midiToNote(option)}
        />
        <TextField
          name={nameFrom}
          sx={{
            display: "none",
          }}
          value={noteFromState}
        />
        <Slider
          sx={{
            width: "15rem",
            display: {
              xs: "none",
              md: "block",
            },
          }}
          value={[noteFromState, noteToState]}
          onChange={(e, value) => {
            value = value as number[];
            console.log(value)
            setNoteFromState(value[0] as number);
            setNoteToState(value[1] as number);
            console.log(value[1])
          }}
          disableSwap
          min={23}
          max={132}
        />
        <Autocomplete
          value={noteToState}
          sx={{
            width: "6rem",
          }}
          onChange={(e, newValue) => {
            setNoteToState(newValue as number);
          }}
          disableClearable
          renderInput={(params) => <TextField {...params} label={t("to")} />}
          options={options}
          getOptionLabel={(option) => midiToNote(option)}
        />
        <TextField
          name={nameTo}
          sx={{
            display: "none",
          }}
          value={noteToState}
        />
      </Stack>
    </>
  );
};
