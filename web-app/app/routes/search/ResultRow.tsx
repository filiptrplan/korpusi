import {
  Box,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { SearchHit } from "@elastic/elasticsearch/lib/api/types";
import { useNavigate, useSearchParams } from "@remix-run/react";
import Difference from "@mui/icons-material/Difference";
import FileDownload from "@mui/icons-material/FileDownload";
import { InfoCard } from "~/components/InfoCard";
import { useTranslation } from "react-i18next";
import { SearchType } from "~/routes/search";
import { ReactNode } from "react";

export interface ResultRowProps {
  searchHit: SearchHit<{ corpus_id: string } & unknown>;
  title?: string;
  titleMissingMessage: string;
  subtitle?: string;
  subtitleMissingMessage: string;
  corpusOptions?: { value: string; label: string }[];
  children: ReactNode;
  type: SearchType;
}

export const ResultRow: React.FC<ResultRowProps> = ({
  subtitle,
  searchHit,
  corpusOptions,
  children,
  title,
  type,
  titleMissingMessage,
  subtitleMissingMessage,
}) => {
  const navigate = useNavigate();
  const [_params, setParams] = useSearchParams();

  const { t } = useTranslation("search");

  const createDownloadLink = () => {
    const blob = new Blob([JSON.stringify(searchHit._source)], {
      type: "application/json",
    });
    return URL.createObjectURL(blob);
  };

  const onAddToComparison = () => {
    setParams((params) => {
      const compareIds = params.get("compareIds");
      if (compareIds) {
        params.set("compareIds", `${compareIds},${searchHit._id}`);
      } else {
        params.set("compareIds", searchHit._id);
      }
      return params;
    });
  };

  return (
    <Card
      variant="outlined"
      sx={{
        display: "flex",
      }}
    >
      <CardActionArea
        onClick={() => {
          navigate(
            `/${type == SearchType.Audio ? "audio" : "song"}/${searchHit._id}`
          );
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
                  {title ?? titleMissingMessage}
                </Typography>
                <Typography
                  variant="body2"
                  fontSize={"0.8rem"}
                  sx={{
                    color: "text.secondary",
                  }}
                >
                  {subtitle ?? subtitleMissingMessage}
                </Typography>
              </Box>
              <InfoCard
                sx={{
                  display: {
                    xs: "none",
                    sm: "block",
                  },
                }}
                title={t("corpus")}
                value={
                  corpusOptions?.find(
                    (x) => x.value === searchHit._source?.corpus_id
                  )?.label
                }
              />
              {children}
            </Stack>
          </Stack>
        </CardContent>
      </CardActionArea>
      <CardActions>
        <Tooltip title="Dodaj primerjavi">
          <IconButton
            sx={{
              zIndex: 2,
            }}
            onClick={onAddToComparison}
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
            download={`${title}.json`}
            target="_blank"
          >
            <FileDownload sx={{ color: "text.primary" }} />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
};
