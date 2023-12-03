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

interface KeySelectProps {
  keyValue?: string;
  alternativeKeys?: string;
}

export const KeySelect: React.FC<KeySelectProps> = ({
  keyValue,
  alternativeKeys,
}) => {
  const [keyState, setKeyState] = useControlledState(keyValue || "none");
  const [alternativeKeysState, setAlternativeKeysState] = useControlledState(
    alternativeKeys == "on" || false
  );
  const { t } = useTranslation("search");
  return (
    <Stack spacing={1} direction="row">
      <FormControl>
        <InputLabel id="key-label">{t("key")}</InputLabel>
        <Select
          labelId="key-label"
          label={t("key")}
          name="key"
          sx={{
            width: "6rem",
          }}
          value={keyState}
          onChange={(e) => {
            setKeyState(e.target.value as string);
          }}
        >
          <MenuItem value="none">{t("none")}</MenuItem>
          <MenuItem value="C">{t("C")}</MenuItem>
          <MenuItem value="D">{t("D")}</MenuItem>
        </Select>
      </FormControl>
      <FormControlLabel
        control={
          <Checkbox
            checked={alternativeKeysState}
            name="alternativeKeys"
            onChange={(e) => {
              setAlternativeKeysState(e.target.checked);
            }}
          />
        }
        label={t("alternativeKeys")}
      />
    </Stack>
  );
};
