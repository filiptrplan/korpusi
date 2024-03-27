import {
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  Menu,
  MenuItem,
  Select,
  Stack,
} from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { useControlledState } from "./useControlledState";

interface TimeSignatureProps {
  availableTimeSignatures?: string[];
  timeSignature?: string;
}

export const TimeSignatureSelect: React.FC<TimeSignatureProps> = ({
  timeSignature,
  availableTimeSignatures,
}) => {
  const [timeSigState, setTimeSigState] = useControlledState(
    timeSignature || "",
  );
  const { t } = useTranslation("search");
  return (
    <FormControl>
      <InputLabel id="timesig-label">{t("timeSignature")}</InputLabel>
      <Select
        labelId="timesig-label"
        label={t("timeSignature")}
        name="timeSignature"
        sx={{
          width: "8rem",
        }}
        value={timeSigState}
        onChange={(e) => {
          setTimeSigState(e.target.value as string);
        }}
      >
        <MenuItem value="none">{t("metrumNone")}</MenuItem>
        {availableTimeSignatures
          ?.sort((a, b) => {
            return a.split("/")[1].localeCompare(b.split("/")[1]);
          })
          .map((timeSig) => (
            <MenuItem key={timeSig} value={timeSig}>
              {timeSig}
            </MenuItem>
          ))}
      </Select>
    </FormControl>
  );
};
