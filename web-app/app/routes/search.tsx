import {
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  Form,
  useLoaderData,
  useNavigate,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import { LoaderFunctionArgs } from "@remix-run/server-runtime";
import { useEffect, useState } from "react";
import { elastic } from "~/services/Elastic";
import { SongResult } from "~/src/DataTypes";
import { useDebounceSubmit } from "~/src/useDebounceSubmit";
import { ResultRow } from "./search/ResultRow";
import { sklanjaj } from "~/src/helpers";
import { SearchTotalHits } from "@elastic/elasticsearch/lib/api/types";
import { useTranslation } from "react-i18next";

export let handle = {
  i18n: "search",
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const params = Object.fromEntries(url.searchParams);
  let pageSize = 10;
  let page = 1;
  let metadataFields: string[] = [];
  if ("pageSize" in params) {
    pageSize = parseInt(params.pageSize);
  }
  if ("page" in params) {
    page = parseInt(params.page);
  }
  if ("metadataFields" in params) {
    metadataFields = params.metadataFields.split(",");
  }

  const data = await elastic.search<SongResult>({
    index: "songs",
    from: (page - 1) * pageSize,
    size: pageSize,
    query: {
      // multi_match: {
      //   query: `*${params.title}*`,
      //   fields: ["metadata.*"],
      //   type: "phrase_prefix",
      //   lenient: true,
      // },
      query_string: {
        query: `*${params.metadataQuery}*`,
        fields:
          metadataFields.length > 0
            ? metadataFields.map((x) => `metadata.${x}`)
            : ["metadata.*"],
      },
    },
  });
  const totalPages =
    Math.ceil((data.hits.total as SearchTotalHits)?.value / pageSize) ?? 0;
  return {
    data: data.hits.hits,
    params,
    pagination: {
      total: totalPages,
      pageSize: pageSize,
      totalHits: (data.hits.total as SearchTotalHits)?.value ?? 0,
      current: Math.min(page, totalPages),
    },
  };
};

export default function Search() {
  const { data, params, pagination } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const { t } = useTranslation("search");

  const resultComponents = data.map((song) => {
    return <ResultRow songHit={song} key={song._id} />;
  });

  const searching = navigation.state !== "idle";
  const submit = useSubmit();

  return (
    <div>
      <Form
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          if (pagination.pageSize !== 10) {
            formData.set("pageSize", pagination.pageSize.toString());
          }
          submit(formData);
        }}
      >
        <Stack spacing={1} direction="column" alignItems={"flex-start"}>
          <Stack spacing={1} direction="row">
            <TextField
              name="metadataQuery"
              label={t("searchByMetadata")}
              variant="outlined"
              defaultValue={params.metadataQuery || ""}
              id="metadataQuery"
            />
            <FormControl
              sx={{
                width: "15rem",
              }}
            >
              <InputLabel id="metadata-field-label">
                {t("chooseMetadataFields")}
              </InputLabel>
              <Select
                label={t("chooseMetadataFields")}
                labelId="metadata-field-label"
                name="metadataFields"
                multiple
                defaultValue={
                  params.metadataFields ? params.metadataFields.split(",") : []
                }
              >
                <MenuItem value="title">{t("metadataTitle")}</MenuItem>
                <MenuItem value="composer">{t("metadataComposer")}</MenuItem>
                <MenuItem value="lyricist">{t("metadataLyricist")}</MenuItem>
              </Select>
            </FormControl>
          </Stack>
          <Button type="submit" variant="contained">
            {t("search")}
          </Button>
        </Stack>
      </Form>
      <Stack
        direction={"row"}
        sx={{
          width: "100%",
          my: 1,
        }}
        alignContent={"center"}
        alignItems={"center"}
      >
        <Typography
          variant="caption"
          sx={{
            whiteSpace: "nowrap",
          }}
        >
          {t("results", { count: pagination.totalHits })}
        </Typography>
        <Divider sx={{ mx: 1, flexGrow: 1 }} />
        <Button variant="text" size="small">
          Izberi dela
        </Button>
      </Stack>
      <Box
        sx={{
          position: "relative",
        }}
      >
        <CircularProgress
          sx={{
            opacity: searching ? 1 : 0,
            zIndex: 100,
            position: "absolute",
            left: "50%",
            top: "50%",
            marginLeft: "-1rem",
            marginTop: "-1rem",
            transition: "opacity 0.35s ease",
          }}
        />
        <Stack
          spacing={1}
          sx={{
            mt: 1,
            opacity: searching ? 0.5 : 1,
            transition: "opacity 0.35s ease",
            minHeight: "5rem",
          }}
        >
          {resultComponents}
        </Stack>
      </Box>
      <Stack
        direction={"row"}
        alignItems={"center"}
        justifyContent={"center"}
        gap={2}
        sx={{
          mt: 2,
        }}
      >
        <FormControl size="small">
          <InputLabel id="page-size-label">Št. na stran</InputLabel>
          <Select
            labelId="page-size-label"
            defaultValue={10}
            sx={{
              minWidth: "7rem",
            }}
            size="small"
            label="Št. na stran"
            value={pagination.pageSize}
            onChange={(e) => {
              const link = new URLSearchParams(params);
              const pageSize = parseInt(e.target.value as string);
              link.set("pageSize", e.target.value.toString());
              if (pageSize * (pagination.current - 1) > pagination.totalHits) {
                link.set(
                  "page",
                  Math.ceil(pagination.totalHits / pageSize).toString()
                );
              }
              navigate(`?${link.toString()}`);
            }}
          >
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={20}>20</MenuItem>
            <MenuItem value={50}>50</MenuItem>
          </Select>
        </FormControl>
        <Pagination
          count={pagination.total}
          page={pagination.current}
          onChange={(e, page) => {
            const link = new URLSearchParams(params);
            link.set("page", page ? page.toString() : "1");
            navigate(`?${link.toString()}`);
          }}
        />
      </Stack>
    </div>
  );
}
