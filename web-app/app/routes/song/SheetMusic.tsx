import { useContext, useState } from "react";
import { SongContext } from "../song.$id";
import {
  Box,
  Checkbox,
  FormControl,
  FormControlLabel,
  Slider,
  Stack,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { OSMDMeasures } from "~/components/OSMDMeasures";

export const SheetMusic: React.FC = ({}) => {
  const song = useContext(SongContext);
  const { t } = useTranslation("song");
  const [range, setRange] = useState<[number, number]>([
    1,
    song.duration.measures,
  ]);

  const [displayLyrics, setDisplayLyrics] = useState<boolean>(false);

  return (
    <Stack direction="column">
      <Stack
        direction={{
          xs: "column",
          sm: "row",
        }}
        spacing={{
          xs: 1,
          sm: 2,
        }}
        alignItems={{
          xs: "flex-start",
          sm: "center",
        }}
      >
        <Typography noWrap flexShrink={0}>
          {t("sheetMusic.measureRange")}:
        </Typography>
        <Box
          sx={{
            px: 2,
            width: "100%",
            alignItems: "center",
            display: "flex",
          }}
        >
          <Slider
            min={1}
            max={song.duration.measures}
            defaultValue={[1, song.duration.measures]}
            disableSwap
            valueLabelDisplay="auto"
            onChangeCommitted={(e, value) => {
              // this is for optimization, so we don't rerender the whole thing on every change
              setRange(value as [number, number]);
            }}
          />
        </Box>
        <FormControlLabel
          control={
            <Checkbox
              value={displayLyrics}
              onChange={(e) => setDisplayLyrics(e.target.checked)}
            />
          }
          sx={{
            flexShrink: 0,
          }}
          label={t("sheetMusic.lyrics")}
        />
      </Stack>
      <OSMDMeasures
        xml={song.original_file}
        startMeasure={range[0]}
        endMeasure={range[1]}
        displayLyrics={displayLyrics}
      />
    </Stack>
  );
};
