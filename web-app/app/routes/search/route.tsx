import {
  Box,
  CircularProgress,
  Divider,
  FormControl,
  Input,
  InputLabel,
  Link,
  MenuItem,
  Pagination,
  PaginationItem,
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
import { ResultRow } from "./ResultRow";
import { sklanjaj } from "~/src/helpers";
import { SearchTotalHits } from "@elastic/elasticsearch/lib/api/types";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const params = Object.fromEntries(url.searchParams);
  if (!("title" in params) || params.title === "") {
    return {
      data: [],
      params,
      pagination: { total: 0, current: 1, totalHits: 0, pageSize: 10 },
    };
  }
  let pageSize = 10;
  let page = 1;
  if ("pageSize" in params) {
    pageSize = parseInt(params.pageSize);
  }
  if ("page" in params) {
    page = parseInt(params.page);
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
        query: `*${params.title}*`,
        fields: ["metadata.*"],
      },
    },
  });
  const totalPages =
    Math.ceil((data.hits.total as SearchTotalHits)?.value / pageSize) ?? 0;
  return {
    data: data.hits.hits.map((hit) => hit._source),
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

  const resultComponents = data.map((song) => {
    return <ResultRow song={song} />;
  });

  useEffect(() => {
    const titleField = document.getElementById("title");
    if (titleField instanceof HTMLInputElement) {
      titleField.value = params.title || "";
    }
  }, [params.title]);

  const searching =
    navigation.location &&
    new URLSearchParams(navigation.location.search).has("title");

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
        <TextField
          name="title"
          label="Išči"
          variant="outlined"
          defaultValue={params.title || ""}
          id="title"
        />
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
          {pagination.totalHits}{" "}
          {sklanjaj(pagination.totalHits, [
            "rezultat",
            "rezultata",
            "rezultati",
            "rezultatov",
          ])}
        </Typography>
        <Divider sx={{ mx: 1, flexGrow: 1 }} />
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
