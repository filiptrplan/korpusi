import { Button, Grid, Stack } from "@mui/material";
import { Form, useLoaderData, useNavigate, useSubmit } from "@remix-run/react";
import { LoaderFunctionArgs } from "@remix-run/server-runtime";
import { FormEvent, createContext, useEffect, useState } from "react";
import { elastic } from "~/services/Elastic";
import { SongResult } from "~/src/DataTypes";
import {
  AggregationsStringTermsAggregate,
  QueryDslQueryContainer,
  SearchTotalHits,
} from "@elastic/elasticsearch/lib/api/types";
import { useTranslation } from "react-i18next";
import { MetadataSelect } from "./search/MetadataSelect";
import { KeySelect } from "./search/KeySelect";
import { TimeSignatureSelect } from "./search/TimeSignatureSelect";
import { TempoSlider } from "./search/TempoSlider";
import { NoteRangeSlider } from "./search/NoteRangeSlider";
import { AmbitusSlider } from "./search/AmbitusSlider";
import { RhythmNgramSearch } from "./search/RhythmNgramSearch";
import { MelodicNgramSearch } from "./search/MelodicNgramSearch";
import { CorpusSelect } from "./search/CorpusSelect";
import { FilterGroupCollapse } from "./search/FilterGroupCollapse";
import { ResultList } from "./search/ResultList";
import { CompareOverlay } from "./search/CompareOverlay";
import {
  constructQuery,
  getAvailableTimeSignatures,
  getAvailableCorpuses,
} from "./search/searchService";

export let handle = {
  i18n: "search",
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const params = Object.fromEntries(url.searchParams);
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
    query: constructQuery(params),
  });
  const totalPages =
    Math.ceil((data.hits.total as SearchTotalHits)?.value / pageSize) ?? 0;
  return {
    data: data.hits.hits,
    params,
    availableTimeSignatures: await getAvailableTimeSignatures(),
    availableCorpuses: await getAvailableCorpuses(),
    pagination: {
      total: totalPages,
      pageSize: pageSize,
      totalHits: (data.hits.total as SearchTotalHits)?.value ?? 0,
      current: Math.min(page, totalPages),
    },
  };
};

export const CompareContext = createContext<{
  compareIds: string[];
  setCompareIds: (ids: string[]) => void;
}>({
  compareIds: [],
  setCompareIds: () => {},
});

export default function Search() {
  const {
    data,
    params,
    pagination,
    availableTimeSignatures,
    availableCorpuses,
  } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const { t } = useTranslation("search");

  // load the last search params from local storage
  useEffect(() => {
    if (
      localStorage.getItem("searchParams") &&
      window.location.href.indexOf("?") === -1 &&
      window.location.href.indexOf("search") > -1
    ) {
      // this will execute only if there are no params
      const params = JSON.parse(localStorage.getItem("searchParams")!);
      const link = new URLSearchParams(params);
      navigate(`?${link.toString()}`, {
        replace: true,
      });
    }
  }, [navigate]);

  // save the search params to local storage
  useEffect(() => {
    localStorage.setItem("searchParams", JSON.stringify(params));
  }, [params]);

  const submit = useSubmit();

  const resetFields = () => {
    localStorage.removeItem("searchParams");
    navigate("/search");
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const originalFormData = new FormData(e.currentTarget);
    if (pagination.pageSize !== 10) {
      formData.set("pageSize", pagination.pageSize.toString());
    }
    for (let value of originalFormData.keys()) {
      // delete empty keys
      if (
        formData.get(value) === "" ||
        formData.get(value) === null ||
        formData.get(value) === undefined ||
        formData.getAll(value).length === 0 ||
        formData.get(value) === "none"
      ) {
        formData.delete(value);
      }
    }
    submit(formData);
  };

  const [compareIds, setCompareIds] = useState<string[]>([]);
  useEffect(() => {
    if (localStorage.getItem("compareIds")) {
      setCompareIds(JSON.parse(localStorage.getItem("compareIds")!));
    }
  }, []);
  const setCompareIdsContext = (ids: string[]) => {
    localStorage.setItem("compareIds", JSON.stringify(ids));
    setCompareIds(ids);
  };

  return (
    <CompareContext.Provider
      value={{
        compareIds,
        setCompareIds: setCompareIdsContext,
      }}
    >
      <div>
        <CompareOverlay />
        <Form onSubmit={onSubmit}>
          <Stack spacing={1} alignItems={"flex-start"} direction={"column"}>
            <FilterGroupCollapse
              title={t("metadataFilters")}
              defaultCollapsed={false}
            >
              <Stack
                direction={{
                  sm: "column",
                  md: "row",
                }}
              >
                <MetadataSelect
                  metadataFields={params.metadataFields}
                  metadataQuery={params.metadataQuery}
                />
                <CorpusSelect
                  corpus={params.corpus}
                  corpusOptions={availableCorpuses}
                />
              </Stack>
            </FilterGroupCollapse>
            <FilterGroupCollapse title={t("basicFilters")}>
              <Grid
                container
                // direction={{
                //   md: "column",
                //   lg: "row",
                // }}
                spacing={1}
              >
                <Grid item xs="auto">
                  <KeySelect
                    keyValue={params.key}
                    alternativeKeys={params.alternativeKeys}
                  />
                </Grid>
                <Grid item xs={12} sm="auto">
                  <TimeSignatureSelect
                    availableTimeSignatures={availableTimeSignatures}
                    timeSignature={params.timeSignature}
                  />
                </Grid>
                <Grid item xs="auto" md={12}>
                  <TempoSlider
                    tempoFrom={params.tempoFrom}
                    tempoTo={params.tempoTo}
                    useTempo={params.useTempo}
                  />
                </Grid>
              </Grid>
            </FilterGroupCollapse>
            <FilterGroupCollapse title={t("ambitusFilters")}>
              <Stack direction="column" spacing={1}>
                <NoteRangeSlider
                  noteFrom={params.noteHighestFrom}
                  noteTo={params.noteHighestTo}
                  label={t("highestNote")}
                  nameFrom="noteHighestFrom"
                  nameTo="noteHighestTo"
                />
                <NoteRangeSlider
                  noteFrom={params.noteLowestFrom}
                  noteTo={params.noteLowestTo}
                  label={t("lowestNote")}
                  nameFrom="noteLowestFrom"
                  nameTo="noteLowestTo"
                />
                <AmbitusSlider
                  ambitusFrom={params.ambitusFrom}
                  ambitusTo={params.ambitusTo}
                />
              </Stack>
            </FilterGroupCollapse>
            <FilterGroupCollapse title={t("patternFilters")}>
              <Stack
                direction={{
                  xs: "column",
                  md: "row",
                }}
                spacing={1}
              >
                <RhythmNgramSearch rhythmNgram={params.rhythmNgram} />
                <MelodicNgramSearch
                  melodicNgram={params.melodicNgram}
                  melodicNgramRelative={params.melodicNgramRelative}
                />
              </Stack>
            </FilterGroupCollapse>
            <Stack spacing={1} direction="row">
              <Button
                type="submit"
                variant="contained"
                sx={{
                  py: 1,
                  px: 3,
                  boxShadow: "none",
                }}
              >
                {t("search")}
              </Button>
              <Button
                sx={{
                  py: 1,
                  px: 3,
                  boxShadow: "none",
                }}
                variant="outlined"
                onClick={resetFields}
              >
                {t("reset")}
              </Button>
            </Stack>
          </Stack>
        </Form>
        <ResultList
          pagination={pagination}
          songHits={data}
          availableCorpuses={availableCorpuses}
        />
      </div>
    </CompareContext.Provider>
  );
}
