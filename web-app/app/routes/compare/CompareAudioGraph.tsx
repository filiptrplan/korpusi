import { Box } from "@mui/material";
import { useContext } from "react";
import { GraphAudio } from "~/routes/audio/GraphAudio";
import { CompareContext } from "~/routes/search";

export const CompareAudioGraph: React.FC = () => {
  const { audioHits } = useContext(CompareContext);
  return (
    <Box
      sx={{
        mr: 4,
      }}
    >
      <GraphAudio audioResults={audioHits.map((x) => x._source!)} />
    </Box>
  );
};
