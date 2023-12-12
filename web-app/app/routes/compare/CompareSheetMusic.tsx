import { useContext, useEffect, useMemo, useState } from "react";
import { songsContext } from "./CompareList";
import { OSMDMeasures } from "~/components/OSMDMeasures";
import {
  FormControl,
  FormControlLabel,
  Grid,
  Slider,
  Stack,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";

export const CompareSheetMusic: React.FC = ({}) => {
  const songs = useContext(songsContext);
  const { t } = useTranslation("compare");

  const maxMeasures = useMemo(() => {
    if (songs.length == 0) return 32;
    const result = songs.reduce((max, song) => {
      let length = song._source!.rhythm.measure_starts.length;
      if (length == 0) {
        length = song._source!.contour.measure_starts.length;
      }
      if (length == 0) return max;
      return Math.min(max, song._source!.rhythm.measure_starts.length);
    }, Infinity);
    return result === 0 ? 32 : result;
  }, [songs]);

  const [measureRange, setMeasureRange] = useState<[number, number]>([
    1,
    maxMeasures,
  ]);

  useEffect(() => {
    if (maxMeasures == Infinity || maxMeasures == 0) return;
    setMeasureRange([1, maxMeasures]);
  }, [maxMeasures]);

  const rows = songs.map((song, i) => {
    return (
      <>
        <Grid item xs={1} key={`${i}title`}>
          <Typography fontWeight={500} fontSize="0.75rem">
            {song._source!.metadata.title}
          </Typography>
        </Grid>
        <Grid item xs={11} key={i}>
          <OSMDMeasures
            divProps={{
              style: {
                width: "100%",
              },
            }}
            fixedMeasureWidth={20}
            zoom={0.7}
            key={song._id}
            xml={song._source!.original_file}
            startMeasure={measureRange[0]}
            endMeasure={measureRange[1]}
          />
        </Grid>
      </>
    );
  });
  return (
    <Stack
      sx={{
        mb: 1,
      }}
    >
      <Stack direction="row" spacing={4} alignItems={"center"}>
        <Typography gutterBottom>{t("measureFromTo")}</Typography>
        <Slider
          min={1}
          max={maxMeasures}
          defaultValue={[1, maxMeasures]}
          disableSwap
          valueLabelDisplay="auto"
          onChangeCommitted={(e, value) => {
            // this is for optimization, so we don't rerender the whole thing on every change
            setMeasureRange(value as [number, number]);
          }}
          sx={{
            width: "20rem",
          }}
        />
      </Stack>
      <Grid container alignItems={"center"}>
        {rows}
      </Grid>
    </Stack>
  );
};
