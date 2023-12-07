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
import { InfoCard } from "./InfoCard";
import { useTranslation } from "react-i18next";
import notes from "./notes.json";

export interface ResultRowProps {
  songHit: SearchHit<SongResult>;
  corpusOptions?: { value: string; label: string }[];
}

export const ResultRow: React.FC<ResultRowProps> = ({
  songHit,
  corpusOptions,
}) => {
  const song = songHit._source!;
  const navigate = useNavigate();

  const { t } = useTranslation("search");

  const findNoteByValue = (note: number) => {
    return Object.keys(notes).find((key) => {
      return notes[key as keyof typeof notes] == note;
    });
  };

  const createDownloadLink = () => {
    const blob = new Blob([JSON.stringify(song)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    return url;
  };

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
        <CardContent
          sx={{
            py: 2,
          }}
        >
          <Stack direction={"row"} gap={0} alignContent={"space-between"}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box
                sx={{
                  paddingRight: 3,
                }}
              >
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
              <InfoCard
                title={t("corpus")}
                value={
                  corpusOptions?.find((x) => x.value === song.corpus_id)?.label
                }
              />
              <InfoCard
                title={t("key")}
                value={t(`keys.${song.key.most_certain_key}`)}
              />
              <InfoCard
                title={t("timeSignature")}
                value={song.time_signature}
              />
              <InfoCard title={t("tempoBPM")} value={song.tempo} />
              <InfoCard
                title={t("highestNote")}
                value={findNoteByValue(song.ambitus.max_note)}
              />
              <InfoCard
                title={t("lowestNote")}
                value={findNoteByValue(song.ambitus.min_note)}
              />
            </Stack>
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
          <IconButton
            component="a"
            href={createDownloadLink()}
            download={`${song.metadata.title}.json`}
            target="_blank"
          >
            <FileDownload sx={{ color: "text.primary" }} />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
};
