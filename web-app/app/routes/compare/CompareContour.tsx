import { useContext } from "react";
import { ContourGraph } from "~/components/ContourGraph";
import { Box } from "@mui/material";
import { CompareContext } from "~/routes/search";

export const CompareContour: React.FC = () => {
  const {xmlHits: songs} = useContext(CompareContext);
  return (
    <Box
      sx={{
        mr: 1,
      }}
    >
      <ContourGraph songs={songs} />
    </Box>
  );
};
