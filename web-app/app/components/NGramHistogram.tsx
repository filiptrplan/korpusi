import { SearchHit } from "@elastic/elasticsearch/lib/api/types";
import { Box, Slider, Stack, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { NGramHistogramGraph } from "~/components/NGramHistogramGraph";
import { SongResult } from "~/src/DataTypes";
import { getColorHex } from "~/utils/helpers";

export interface NGramHistogramProps {
  songs: SearchHit<SongResult>[] | SearchHit<SongResult>;
  type: "pitch" | "rhythm";
}

export const NGramHistogram: React.FC<NGramHistogramProps> = ({
  songs,
  type,
}) => {
  const { t } = useTranslation("components");
  const [topN, setTopN] = useState(10);

  const graphComponents = useMemo(() => {
    if (Array.isArray(songs)) {
      return songs.map((song, i) => {
        return (
          <NGramHistogramGraph
            key={song._id}
            songs={song}
            type={type}
            topN={topN}
            colorHex={getColorHex(i)}
          />
        );
      });
    } else {
      return <NGramHistogramGraph songs={songs} type={type} topN={topN} />;
    }
  }, [songs, topN]);

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
          {t("ngrams.topN")}:
        </Typography>
        <Slider
          sx={{
            width: "100%",
          }}
          value={topN}
          onChange={(_, value) => setTopN(value as number)}
          valueLabelDisplay="auto"
          min={3}
          max={20}
        />
      </Stack>
      {type == "pitch" ? (
        <Typography
          sx={{
            whiteSpace: "pre-line",
          }}
        >
          {t("ngrams.pitchNgramExplanation")}
        </Typography>
      ) : null}
      {graphComponents}
    </Box>
  );
};
