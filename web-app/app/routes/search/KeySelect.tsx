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
  const [keyState, setKeyState] = useControlledState(keyValue || "");
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
            width: "8rem",
          }}
          value={keyState}
          onChange={(e) => {
            setKeyState(e.target.value as string);
          }}
        >
          <MenuItem value="none">{t("keys.none")}</MenuItem>
          <MenuItem value="G">{t("keys.G")}</MenuItem>
          <MenuItem value="D">{t("keys.D")}</MenuItem>
          <MenuItem value="A">{t("keys.A")}</MenuItem>
          <MenuItem value="E">{t("keys.E")}</MenuItem>
          <MenuItem value="B">{t("keys.B")}</MenuItem>
          <MenuItem value="F#">{t("keys.F#")}</MenuItem>
          <MenuItem value="C#">{t("keys.C#")}</MenuItem>
          <MenuItem value="F">{t("keys.F")}</MenuItem>
          <MenuItem value="B-">{t("keys.B-")}</MenuItem>
          <MenuItem value="E-">{t("keys.E-")}</MenuItem>
          <MenuItem value="A-">{t("keys.A-")}</MenuItem>
          <MenuItem value="D-">{t("keys.D-")}</MenuItem>
          <MenuItem value="G-">{t("keys.G-")}</MenuItem>
          <MenuItem value="C-">{t("keys.C-")}</MenuItem>
          <MenuItem value="a">{t("keys.a")}</MenuItem>
          <MenuItem value="e">{t("keys.e")}</MenuItem>
          <MenuItem value="b">{t("keys.b")}</MenuItem>
          <MenuItem value="f#">{t("keys.f#")}</MenuItem>
          <MenuItem value="c#">{t("keys.c#")}</MenuItem>
          <MenuItem value="g#">{t("keys.g#")}</MenuItem>
          <MenuItem value="d#">{t("keys.d#")}</MenuItem>
          <MenuItem value="d">{t("keys.d")}</MenuItem>
          <MenuItem value="g">{t("keys.g")}</MenuItem>
          <MenuItem value="c">{t("keys.c")}</MenuItem>
          <MenuItem value="f">{t("keys.f")}</MenuItem>
          <MenuItem value="b-">{t("keys.b-")}</MenuItem>
          <MenuItem value="e-">{t("keys.e-")}</MenuItem>
          <MenuItem value="a-">{t("keys.a-")}</MenuItem>
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
