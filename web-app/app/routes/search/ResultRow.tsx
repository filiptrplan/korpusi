import { Card, CardHeader } from "@mui/material";
import { SongResult } from "~/src/DataTypes";

export interface ResultRowProps {
  song: SongResult;
}

export const ResultRow: React.FC<ResultRowProps> = ({ song }) => {
  return (
    <Card variant="outlined">
      <CardHeader
        titleTypographyProps={{
          typography: "h6",
          fontSize: "1.15rem",
        }}
        subheaderTypographyProps={{
          fontSize: "0.8rem",
        }}
        title={song.metadata.title ?? "Naslov ni znan"}
        subheader={song.metadata.composer ?? "Skladatelj ni znan"}
      />
    </Card>
  );
};
