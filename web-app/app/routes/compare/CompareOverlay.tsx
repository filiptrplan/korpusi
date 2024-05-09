import { SearchHit } from "@elastic/elasticsearch/lib/api/types";
import { Button, Chip, Stack, Typography } from "@mui/material";
import { useSearchParams } from "@remix-run/react";
import { useContext } from "react";
import { useTranslation } from "react-i18next";
import { CompareContext, SearchType, SearchTypeContext } from "~/routes/search";

interface CompareOverlayProps {
  onCompareClick: () => void;
}

export const CompareOverlay: React.FC<CompareOverlayProps> = ({
  onCompareClick,
}) => {
  const {xmlHits, audioHits} = useContext(CompareContext);
  const searchType = useContext(SearchTypeContext);

  const hits: SearchHit<{metadata: {title: string}} & unknown>[] = searchType == SearchType.Audio ? 
    audioHits : xmlHits;

  const { t } = useTranslation("search");
  const [params, setParams] = useSearchParams();
  const compareIds = params.get("compareIds")?.split(",") || [];

  const onRemoveAll = () => {
    setParams((params) => {
      params.delete("compareIds");
      return params;
    });
  };

  const onSongDelete = (song: SearchHit<{metadata: {title: string}} & unknown>) => {
    setParams((params) => {
      params.delete("compareIds");
      params.append(
        "compareIds",
        compareIds.filter((id) => id !== song._id).join(",")
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
        {hits.map((song) => {
          const title = song._source!.metadata.title;
          return (
            <Chip
              key={title}
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
