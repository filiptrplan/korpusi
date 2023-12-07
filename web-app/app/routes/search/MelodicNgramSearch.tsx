import { Checkbox, FormControlLabel, Stack, TextField } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useControlledState } from "./useControlledState";

interface MelodicNgramSearchProps {
  melodicNgram?: string;
  melodicNgramRelative?: string;
}

export const MelodicNgramSearch: React.FC<MelodicNgramSearchProps> = ({
  melodicNgram,
  melodicNgramRelative,
}) => {
  const { t } = useTranslation("search");
  const [melodicNgramState, setMelodicNgramState] = useControlledState(
    melodicNgram ?? ""
  );
  const [melodicNgramRelativeState, setMelodicNgramRelativeState] =
    useControlledState(
      melodicNgramRelative ? melodicNgramRelative === "on" : false
    );
  return (
    <>
      <Stack
        direction={{
          xs: "column",
          sm: "row",
        }}
        spacing={1}
      >
        <TextField
          name="melodicNgram"
          label={t("melodicNgram")}
          value={melodicNgramState}
          sx={{
            width: "15rem",
          }}
          onChange={(e) => {
            setMelodicNgramState(e.target.value);
          }}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={melodicNgramRelativeState}
              onChange={(e) => {
                setMelodicNgramRelativeState(e.target.checked);
              }}
              name="melodicNgramRelative"
            />
          }
          label={t("melodicNgramRelative")}
        />
      </Stack>
    </>
  );
};
