import { SearchHit } from "@elastic/elasticsearch/lib/api/types";
import { Box, Slider, Stack, Typography } from "@mui/material";
import {
  Chart as ChartJS,
  CategoryScale,
  ChartData,
  Colors,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { t } from "i18next";
import { useState } from "react";
import { Line } from "react-chartjs-2";
import { useTranslation } from "react-i18next";
import { SongResult } from "~/src/DataTypes";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Colors
);

interface ContourGraphProps {
  songs: SearchHit<SongResult>[] | SearchHit<SongResult>;
}

export const ContourGraph: React.FC<ContourGraphProps> = ({
  songs: songProp,
}) => {
  const { t } = useTranslation("components");
  const songs = Array.isArray(songProp) ? songProp : [songProp];
  const makeData = (
    song: SearchHit<SongResult>
  ): ChartData<"line">["datasets"][0] => {
    return {
      label: song._source!.metadata.title,
      data: song
        ._source!.contour.melodic_contour_string_relative.split(" ")
        .map((x) => parseInt(x)),
      tension: 0.4,
      pointRadius(ctx, options) {
        const index = ctx.dataIndex;
        const value = ctx.dataset.data[index] as number;
        if (value === null) return 0;
        return Math.abs(value) < 2 ? 2 : 4;
      },
    };
  };
  const maxLength = songs.reduce((max, song) => {
    return Math.max(
      max,
      song._source!.contour.melodic_contour_string_relative.split(" ").length
    );
  }, 0);
  const [range, setRange] = useState<number[]>([0, maxLength]);
  const data: ChartData<"line"> = {
    datasets: songs.map((song) => makeData(song)),
    labels: Array.from(Array(maxLength).keys()).map((x) => x + 1),
  };
  return (
    <Box
      sx={{
        minWidth: "400px",
      }}
    >
      <Stack
        sx={{
          pr: 2,
        }}
        direction="row"
        spacing={3}
        alignItems="center"
      >
        <Typography
          sx={{
            flexShrink: 0,
          }}
          noWrap
        >
          {t("ContourGraph.contourRange")}:
        </Typography>
        <Slider
          sx={{
            width: "100%",
          }}
          value={range}
          onChange={(_, value) => setRange(value as number[])}
          valueLabelDisplay="auto"
          min={0}
          max={maxLength}
        />
      </Stack>
      <Line
        data={data}
        options={{
          plugins: {
            legend: {
              position: "top" as const,
            },
            colors: {
              enabled: true,
            },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: t("ContourGraph.beat"),
              },
              min: range[0],
              max: range[1],
            },
          },
        }}
      />
    </Box>
  );
};
