import { SearchTotalHits } from "@elastic/elasticsearch/lib/api/types";
import {
  Alert,
  AlertTitle,
  Button,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useLoaderData, useRouteError } from "@remix-run/react";
import { LoaderFunctionArgs } from "@remix-run/server-runtime";
import { useTranslation } from "react-i18next";
import { elastic } from "~/services/Elastic";
import { SongResult } from "~/src/DataTypes";
import { CompareList } from "./compare/CompareList";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const params = Object.fromEntries(url.searchParams);
  let ids: string[] = [];
  if ("ids" in params) {
    ids = params.ids.split(",");
  }
  const data = await elastic.search<SongResult>({
    query: {
      ids: {
        values: ids,
      },
    },
  });
  if ((data.hits.total as SearchTotalHits).value !== ids.length) {
    throw new Error("Not all ids found");
  }
  return {
    songs: data.hits.hits,
  };
};

export default function Compare() {
  const { songs } = useLoaderData<typeof loader>();
  const { t } = useTranslation("compare");
  if (songs.length < 2) {
    return (
      <Alert severity="error">
        <AlertTitle>{t("tooFewSongs")}</AlertTitle>
        {t("tooFewSongsDescription")}
      </Alert>
    );
  }
  return <CompareList songs={songs} />;
}
