import { SearchHit } from "@elastic/elasticsearch/lib/api/types";
import { Button, Chip, Paper, Slide, Stack, Typography } from "@mui/material";
import { useNavigate, useSearchParams } from "@remix-run/react";
import { useContext } from "react";
import { useTranslation } from "react-i18next";
import { SongResult } from "~/src/DataTypes";

interface CompareOverlayProps {
  onCompareClick: () => void;
  songs: SearchHit<SongResult>[];
}

export const CompareOverlay: React.FC<CompareOverlayProps> = ({
  onCompareClick,
  songs,
}) => {
  const { t } = useTranslation("search");
  const [params, setParams] = useSearchParams();
  const compareIds = params.get("compareIds")?.split(",") || [];

  const onRemoveAll = () => {
    setParams((params) => {
      params.delete("compareIds");
      return params;
    });
  };

  const onSongDelete = (song: SearchHit<SongResult>) => {
    setParams((params) => {
      params.delete("compareIds");
      params.append(
        "compareIds",
        compareIds.filter((id) => id !== song._id).join(","),
      );
      return params;
    });
  };

  return (
    <Stack
      direction={"row"}
      justifyContent={"space-between"}
      alignItems={"center"}
    >
      <Stack
        sx={{
          pl: {
            xs: 2,
            md: 0,
          },
        }}
        direction={{
          xs: "column",
          md: "row",
        }}
        alignItems={{
          xs: "flex-start",
          md: "center",
        }}
      >
        <Typography
          sx={{
            display: {
              xs: "none",
              md: "block",
            },
          }}
          variant="body1"
          fontSize={"1.05rem"}
        >
          {t("youHaveAddedNItemsToCompare", { count: compareIds.length })}
        </Typography>
        {songs.map((song) => {
          const title = song._source!.metadata.title;
          return (
            <Chip
              label={title}
              variant="outlined"
              onDelete={() => onSongDelete(song)}
            />
          );
        })}
      </Stack>
      <Stack
        direction={{
          xs: "column",
          sm: "row",
        }}
        sx={{
          pr: {
            xs: 2,
            md: 0,
          },
        }}
        spacing={1}
      >
        <Button
          variant="contained"
          onClick={onCompareClick}
          disabled={compareIds.length < 2}
        >
          {t("compare")}
        </Button>
        <Button variant="text" onClick={onRemoveAll}>
          {t("removeAll")}
        </Button>
      </Stack>
    </Stack>
  );
};
