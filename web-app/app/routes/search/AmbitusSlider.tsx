import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormLabel,
  Input,
  Slider,
  Stack,
  TextField,
} from "@mui/material";
import React from "react";
import { useControlledState } from "./useControlledState";
import { useTranslation } from "react-i18next";

interface AmbitusSliderProps {
  ambitusFrom?: string;
  ambitusTo?: string;
  useTempo?: string;
}

export const AmbitusSlider: React.FC<AmbitusSliderProps> = ({
  ambitusFrom,
  ambitusTo,
  useTempo,
}) => {
  const [ambitusFromState, setAmbituFromState] = useControlledState(
    ambitusFrom ? parseInt(ambitusFrom) : 0
  );
  const [ambitusToState, setAmbitusToState] = useControlledState(
    ambitusTo ? parseInt(ambitusTo) : 80
  );
  const [useTempoState, setUseTempoState] = useControlledState(
    useTempo == "on" || false
  );

  const { t } = useTranslation("search");
  return (
    <Stack direction={"row"} spacing={1} alignItems={"center"}>
      <FormLabel>{t("ambitus")}:</FormLabel>
      <Stack
        direction={"row"}
        spacing={2}
        alignContent={"center"}
        alignItems={"center"}
      >
        <TextField
          label={t("from")}
          name="ambitusFrom"
          type="number"
          value={ambitusFromState}
          sx={{
            width: "5rem",
          }}
          onChange={(e) => {
            setAmbituFromState(parseInt(e.target.value));
          }}
        />
        <Slider
          sx={{
            width: "15rem",
          }}
          value={[ambitusFromState, ambitusToState]}
          onChange={(e, value) => {
            value = value as number[];
            setAmbituFromState(value[0] as number);
            setAmbitusToState(value[1] as number);
          }}
          disableSwap
          min={0}
          max={80}
        />
        <TextField
          name="ambitusTo"
          type="number"
          label={t("to")}
          sx={{
            width: "5rem",
          }}
          value={ambitusToState}
          onChange={(e) => {
            setAmbitusToState(parseInt(e.target.value));
          }}
        />
      </Stack>
    </Stack>
  );
};
