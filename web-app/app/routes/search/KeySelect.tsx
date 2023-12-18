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
import { useKeyTranslate } from "~/utils/notes";

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
  const tKeys = useKeyTranslate();
  return (
    <Stack
      spacing={1}
      direction={{
        xs: "column",
        sm: "row",
      }}
    >
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
          <MenuItem value="none">{tKeys("none")}</MenuItem>
          <MenuItem value="G">{tKeys("G")}</MenuItem>
          <MenuItem value="D">{tKeys("D")}</MenuItem>
          <MenuItem value="A">{tKeys("A")}</MenuItem>
          <MenuItem value="E">{tKeys("E")}</MenuItem>
          <MenuItem value="B">{tKeys("B")}</MenuItem>
          <MenuItem value="F#">{tKeys("F#")}</MenuItem>
          <MenuItem value="C#">{tKeys("C#")}</MenuItem>
          <MenuItem value="F">{tKeys("F")}</MenuItem>
          <MenuItem value="B-">{tKeys("B-")}</MenuItem>
          <MenuItem value="E-">{tKeys("E-")}</MenuItem>
          <MenuItem value="A-">{tKeys("A-")}</MenuItem>
          <MenuItem value="D-">{tKeys("D-")}</MenuItem>
          <MenuItem value="G-">{tKeys("G-")}</MenuItem>
          <MenuItem value="C-">{tKeys("C-")}</MenuItem>
          <MenuItem value="a">{tKeys("a")}</MenuItem>
          <MenuItem value="e">{tKeys("e")}</MenuItem>
          <MenuItem value="b">{tKeys("b")}</MenuItem>
          <MenuItem value="f#">{tKeys("f#")}</MenuItem>
          <MenuItem value="c#">{tKeys("c#")}</MenuItem>
          <MenuItem value="g#">{tKeys("g#")}</MenuItem>
          <MenuItem value="d#">{tKeys("d#")}</MenuItem>
          <MenuItem value="d">{tKeys("d")}</MenuItem>
          <MenuItem value="g">{tKeys("g")}</MenuItem>
          <MenuItem value="c">{tKeys("c")}</MenuItem>
          <MenuItem value="f">{tKeys("f")}</MenuItem>
          <MenuItem value="b-">{tKeys("b-")}</MenuItem>
          <MenuItem value="e-">{tKeys("e-")}</MenuItem>
          <MenuItem value="a-">{tKeys("a-")}</MenuItem>
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
