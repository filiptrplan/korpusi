import {
  SearchHit,
  SearchResponse,
  SearchTotalHits,
} from "@elastic/elasticsearch/lib/api/types";
import { Alert, AlertTitle } from "@mui/material";
import { useLoaderData } from "@remix-run/react";
import { LoaderFunctionArgs } from "@remix-run/server-runtime";
import { useTranslation } from "react-i18next";
import { elastic } from "~/services/Elastic";
import { AudioResult, SongResult } from "~/src/DataTypes";
import { CompareList } from "./compare/CompareList";
import Search, { SearchType } from "~/routes/search";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const params = Object.fromEntries(url.searchParams);
  let ids: string[] = [];
  if ("ids" in params) {
    ids = params.ids.split(",");
  }

  let searchType = SearchType.Audio;
  if ("searchType" in params) searchType = parseInt(params.searchType);

  let data: SearchResponse<unknown>;

  if (searchType == SearchType.Audio) {
    data = await elastic.search<AudioResult>({
      index: "audio",
      query: {
        ids: {
          values: ids,
        },
      },
    });
  } else {
    data = await elastic.search<SongResult>({
      index: "songs",
      query: {
        ids: {
          values: ids,
        },
      },
    });
  }

  if ((data.hits.total as SearchTotalHits).value !== ids.length) {
    throw new Error("Not all ids found");
  }

  return {
    xmlHits:
      searchType == SearchType.XML
        ? (data.hits.hits as unknown as SearchHit<SongResult>[])
        : [],
    audioHits:
      searchType == SearchType.Audio
        ? (data.hits.hits as unknown as SearchHit<AudioResult>[])
        : [],
    searchType,
  };
};

export default function Compare() {
  const { xmlHits, audioHits, searchType } = useLoaderData<typeof loader>();
  const { t } = useTranslation("compare");
  if (
    (searchType == SearchType.XML && xmlHits.length < 2) ||
    (searchType == SearchType.Audio && audioHits.length < 2)
  ) {
    return (
      <Alert severity="error">
        <AlertTitle>{t("tooFewSongs")}</AlertTitle>
        {t("tooFewSongsDescription")}
      </Alert>
    );
  }
  return <CompareList xmlHits={xmlHits} audioHits={audioHits} searchType={searchType} />;
}
