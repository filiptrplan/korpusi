import { useContext } from "react";
import { songsContext } from "./CompareList";
import { ContourGraph } from "~/components/ContourGraph";
import { Box } from "@mui/material";

export const CompareContour: React.FC = ({}) => {
  const songs = useContext(songsContext);
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
