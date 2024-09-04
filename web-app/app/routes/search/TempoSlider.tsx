import {
  Checkbox,
  FormControlLabel,
  FormLabel,
  Slider,
  Stack,
  TextField,
} from "@mui/material";
import React from "react";
import { useControlledState } from "../../utils/useControlledState";
import { useTranslation } from "react-i18next";

interface TempoSliderProps {
  tempoFrom?: string;
  tempoTo?: string;
  useTempo?: string;
}

export const TempoSlider: React.FC<TempoSliderProps> = ({
  tempoFrom,
  tempoTo,
  useTempo,
}) => {
  const [tempoFromState, setTempoFromState] = useControlledState(
    tempoFrom ? parseInt(tempoFrom) : 20,
  );
  const [tempoToState, setTempoToState] = useControlledState(
    tempoTo ? parseInt(tempoTo) : 160,
  );
  const [useTempoState, setUseTempoState] = useControlledState(
    useTempo == "on" || false,
  );

  const { t } = useTranslation("search");
  return (
    <Stack direction={"row"} spacing={1} alignItems={"center"}>
      <Stack
        direction={{
          xs: "column",
          lg: "row",
        }}
        spacing={1}
      >
        <Stack
          direction={"row"}
          spacing={{
            xs: 1,
            md: 2,
          }}
          alignContent={"center"}
          alignItems={"center"}
        >
          <FormLabel>{t("tempoBPM")}:</FormLabel>
          <TextField
            disabled={!useTempoState}
            label={t("from")}
            name="tempoFrom"
            type="number"
            value={tempoFromState}
            sx={{
              width: "5rem",
            }}
            onChange={(e) => {
              setTempoFromState(parseInt(e.target.value));
            }}
          />
          <Slider
            disabled={!useTempoState}
            sx={{
              width: "15rem",
              display: {
                xs: "none",
                md: "block",
              },
            }}
            value={[tempoFromState, tempoToState]}
            onChange={(e, value) => {
              value = value as number[];
              setTempoFromState(value[0] as number);
              setTempoToState(value[1] as number);
            }}
            disableSwap
            min={20}
            max={160}
          />
          <TextField
            disabled={!useTempoState}
            name="tempoTo"
            type="number"
            label={t("to")}
            sx={{
              width: "5rem",
            }}
            value={tempoToState}
            onChange={(e) => {
              setTempoToState(parseInt(e.target.value));
            }}
          />
        </Stack>
        <FormControlLabel
          control={
            <Checkbox
              checked={useTempoState}
              name="useTempo"
              onChange={(e) => {
                setUseTempoState(e.target.checked);
              }}
            />
          }
          label={t("useTempo")}
        />
      </Stack>
    </Stack>
  );
};
