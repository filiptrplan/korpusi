import { useContext, useEffect, useState } from "react";
import { songsContext } from "./CompareList";
import { OSMDMeasures } from "~/components/OSMDMeasures";
import { Grid, Slider, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

export const CompareSheetMusic: React.FC = () => {
  const songs = useContext(songsContext);
  const { t } = useTranslation("compare");

  const maxMeasures = songs.reduce((min, song) => {
    return Math.min(min, song._source!.duration.measures);
  }, Infinity);

  const [measureRange, setMeasureRange] = useState<[number, number]>([
    1,
    maxMeasures,
  ]);

  const [measureWidth, setMeasureWidth] = useState<number>(20);

  useEffect(() => {
    setMeasureRange([1, maxMeasures]);
  }, [songs.length]);

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
            fixedMeasureWidth={measureWidth}
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
      <Grid container columnGap={2} alignItems={"center"}>
        <Grid item xs="auto" columnGap={2} container alignItems={"center"}>
          <Grid item xs="auto">
            <Typography gutterBottom>{t("measureFromTo")}:</Typography>
          </Grid>
          <Grid item xs={"auto"}>
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
          </Grid>
        </Grid>
        <Grid columnGap={2} item xs="auto" container alignItems={"center"}>
          <Grid
            item
            xs="auto"
            sx={{
              pl: 2,
            }}
          >
            <Typography gutterBottom>{t("measureWidth")}:</Typography>
          </Grid>
          <Grid item xs={"auto"}>
            <Slider
              min={1}
              max={50}
              defaultValue={20}
              disableSwap
              valueLabelDisplay="auto"
              onChangeCommitted={(e, value) => {
                // this is for optimization, so we don't rerender the whole thing on every change
                setMeasureWidth(value as number);
              }}
              sx={{
                width: "20rem",
              }}
            />
          </Grid>
        </Grid>
      </Grid>
      <Grid container alignItems={"center"}>
        {rows}
      </Grid>
    </Stack>
  );
};
