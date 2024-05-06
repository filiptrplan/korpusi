import {
  Checkbox,
  FormControlLabel,
  FormLabel,
  Slider,
  Stack,
  TextField,
} from "@mui/material";
import React from "react";
import { useControlledState } from "./useControlledState";
import { useTranslation } from "react-i18next";

interface DurationSliderProps {
  durationFrom?: string;
  durationTo?: string;
  useDuration?: string;
}

export const DurationSlider: React.FC<DurationSliderProps> = ({
  durationFrom,
  durationTo,
  useDuration
}) => {
  const [durationFromState, setDurationFromState] = useControlledState(
    durationFrom ? parseInt(durationFrom) : 0,
  );
  const [durationToState, setDurationToState] = useControlledState(
    durationTo ? parseInt(durationTo) : 600,
  );
  const [useDurationState, setDurationState] = useControlledState(
    useDuration == "on" || false,
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
          <FormLabel>{t("durationSliderLabel")}:</FormLabel>
          <TextField
            disabled={!useDurationState}
            label={t("from")}
            name="durationFrom"
            type="number"
            value={durationFromState}
            sx={{
              width: "5rem",
            }}
            onChange={(e) => {
              setDurationFromState(parseInt(e.target.value));
            }}
          />
          <Slider
            disabled={!useDurationState}
            sx={{
              width: "15rem",
              display: {
                xs: "none",
                md: "block",
              },
            }}
            value={[durationFromState, durationToState]}
            onChange={(e, value) => {
              value = value as number[];
              setDurationFromState(value[0] as number);
              setDurationToState(value[1] as number);
            }}
            disableSwap
            min={0}
            max={600}
          />
          <TextField
            disabled={!useDurationState}
            name="durationTo"
            type="number"
            label={t("to")}
            sx={{
              width: "5rem",
            }}
            value={durationToState}
            onChange={(e) => {
              setDurationToState(parseInt(e.target.value));
            }}
          />
        </Stack>
        <FormControlLabel
          control={
            <Checkbox
              checked={useDurationState}
              name="useDuration"
              onChange={(e) => {
                setDurationState(e.target.checked);
              }}
            />
          }
          label={t("useDuration")}
        />
      </Stack>
    </Stack>
  );
};
