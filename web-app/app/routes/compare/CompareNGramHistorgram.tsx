import { useContext } from "react";
import { Box } from "@mui/material";
import { CompareContext } from "~/routes/search";
import { NGramHistogram } from "~/components/NGramHistogram";

export interface CompareNGramHistogramProps {
  type: "pitch" | "rhythm";
}

export const CompareNGramHistogram: React.FC<CompareNGramHistogramProps> = ({type}) => {
  const {xmlHits: songs} = useContext(CompareContext);
  return (
    <Box
      sx={{
        mr: 1,
      }}
    >
      <NGramHistogram songs={songs} type={type} />
    </Box>
  );
};