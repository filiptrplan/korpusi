import {
  Box,
  Button,
  ClickAwayListener,
  Collapse,
  Container,
  Drawer,
  Fade,
  Grid,
  Paper,
  Slide,
  Stack,
  Theme,
  useMediaQuery,
} from "@mui/material";
import {
  Form,
  Outlet,
  useLoaderData,
  useMatches,
  useNavigate,
  useSubmit,
} from "@remix-run/react";
import { LoaderFunctionArgs } from "@remix-run/server-runtime";
import { FormEvent, createContext, useEffect, useRef, useState } from "react";
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
import { CompareOverlay } from "./compare/CompareOverlay";
import {
  constructQuery,
  getAvailableTimeSignatures,
  getAvailableCorpuses,
} from "./search/searchService";
import { CompareList } from "./compare/CompareList";
import { useUpdateQueryStringValueWithoutNavigation } from "~/utils/misc";

export let handle = {
  i18n: ["search", "compare"],
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

  // Search data fetching
  const data = await elastic.search<SongResult>({
    index: "songs",
    from: (page - 1) * pageSize,
    size: pageSize,
    query: constructQuery(params),
  });

  const totalPages =
    Math.ceil((data.hits.total as SearchTotalHits)?.value / pageSize) ?? 0;

  // Compare song fetching
  let compareIds: string[] = [];
  if ("compareIds" in params) {
    compareIds = params.compareIds.split(",");
  }
  const compareData = await elastic.search<SongResult>({
    query: {
      ids: {
        values: compareIds,
      },
    },
  });

  if ((compareData.hits.total as SearchTotalHits).value !== compareIds.length) {
    throw new Error("Not all ids found");
  }

  return {
    data: data.hits.hits,
    compareData: compareData.hits.hits,
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

export default function Search() {
  const {
    data,
    params,
    pagination,
    availableTimeSignatures,
    availableCorpuses,
    compareData,
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

  const compareIds = params.compareIds ? params.compareIds.split(",") : [];
  const [showCompareList, setShowCompareList] = useState(
    params.showCompareList === "1"
  );
  useUpdateQueryStringValueWithoutNavigation(
    "showCompareList",
    showCompareList ? "1" : "0"
  );

  const showCompare = compareIds.length > 0 && !showCompareList;
  const compareRef = useRef<HTMLDivElement>(null);

  const onCompareClickAway = () => {
    setShowCompareList(false);
  };

  useEffect(() => {
    if (!document) return;
    if (showCompareList) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [showCompareList]);

  return (
    <>
      <ClickAwayListener onClickAway={onCompareClickAway}>
        <Slide direction="up" in={showCompare || showCompareList}>
          <Paper
            sx={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 100,
              px: {
                xs: 0,
                md: 3,
              },
              py: 2,
            }}
            elevation={3}
          >
            <Collapse in={showCompare} mountOnEnter timeout={700}>
              <Box>
                <CompareOverlay
                  songs={compareData}
                  onCompareClick={() => {
                    setShowCompareList(true);
                  }}
                />
              </Box>
            </Collapse>
            <Collapse in={showCompareList} mountOnEnter timeout={700}>
              <Container
                sx={{
                  height: "calc(100vh - 64px - 10vh)",
                  overflowY: "auto",
                }}
                maxWidth="xl"
              >
                <CompareList songs={compareData} />
              </Container>
            </Collapse>
          </Paper>
        </Slide>
      </ClickAwayListener>
      <div
        style={{
          position: "fixed",
          bottom: 0,
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          backgroundColor: "rgba(0,0,0,0.5)",
          opacity: showCompareList ? 1 : 0,
          transition: "opacity 0.7s",
          pointerEvents: showCompareList ? "auto" : "none",
        }}
      />
      <Box
        sx={{
          marginBottom: !showCompareList
            ? `${compareRef.current?.clientHeight ?? 0 + 20}px`
            : 0,
        }}
      >
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
              <Grid container spacing={1}>
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
      </Box>
    </>
  );
}
