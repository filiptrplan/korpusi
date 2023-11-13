import {
  Box,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  CardHeader,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { SongResult } from "~/src/DataTypes";
import { SearchHit } from "@elastic/elasticsearch/lib/api/types";
import { useNavigate } from "@remix-run/react";
import Difference from "@mui/icons-material/Difference";
import FileDownload from "@mui/icons-material/FileDownload";

export interface ResultRowProps {
  songHit: SearchHit<SongResult>;
}

export const ResultRow: React.FC<ResultRowProps> = ({ songHit }) => {
  const song = songHit._source!;
  const navigate = useNavigate();
  return (
    <Card
      variant="outlined"
      sx={{
        display: "flex",
      }}
    >
      <CardActionArea
        onClick={(e) => {
          navigate(`/song/${songHit._id}`);
        }}
      >
        <CardContent>
          <Stack direction={"row"} gap={0} alignContent={"space-between"}>
            <Box>
              <Typography variant="h6" fontSize={"1.15rem"}>
                {" "}
                {song.metadata.title ?? "Naslov ni znan"}
              </Typography>
              <Typography
                variant="body2"
                fontSize={"0.8rem"}
                sx={{
                  color: "text.secondary",
                }}
              >
                {song.metadata.composer ?? "Skladatelj ni znan"}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </CardActionArea>
      <CardActions>
        <Tooltip title="Dodaj primerjavi">
          <IconButton
            sx={{
              zIndex: 10,
            }}
          >
            <Difference
              sx={{
                color: "text.primary",
              }}
            />
          </IconButton>
        </Tooltip>
        <Tooltip title="Prenesi datoteko">
          <IconButton>
            <FileDownload sx={{ color: "text.primary" }} />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
};
