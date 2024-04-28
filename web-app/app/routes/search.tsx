import {
  Box,
  Button,
  ClickAwayListener,
  Collapse,
  Container,
  Grid,
  Paper,
  Slide,
  Stack,
} from "@mui/material";
import { Form, useLoaderData, useNavigate, useSubmit } from "@remix-run/react";
import { LoaderFunctionArgs } from "@remix-run/server-runtime";
import { FormEvent, useEffect, useRef, useState } from "react";
import { elastic } from "~/services/Elastic";
import { SongResult } from "~/src/DataTypes";
import {
  SearchHit,
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

export const handle = {
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
    index: "songs",
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

export const CompareCollapseAndList: React.FC<{
  onClickAway: () => void;
  showCompareList: boolean;
  compareRef: React.MutableRefObject<HTMLDivElement | null>;
  compareSongs: SearchHit<SongResult>[];
  onCompareClick: () => void;
}> = ({
  compareRef,
  compareSongs,
  onClickAway,
  onCompareClick,
  showCompareList,
}) => {
  const showCompare = compareSongs.length > 0 && !showCompareList;
  return (
    <ClickAwayListener onClickAway={onClickAway}>
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
              <Box ref={compareRef}>
                <CompareOverlay
                  songs={compareSongs}
                  onCompareClick={onCompareClick}
                />
              </Box>
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
              <CompareList songs={compareSongs} />
            </Container>
          </Collapse>
        </Paper>
      </Slide>
    </ClickAwayListener>
  );
};

function SearchFilters(props: {
  params: Record<string, string>;
  corpusOptions: { value: string; label: string }[] | undefined;
  availableTimeSignatures: string[] | undefined;
}) {
  const { t } = useTranslation("search");
  const navigate = useNavigate();
  const resetFields = () => {
    localStorage.removeItem("searchParams");
    navigate("/search");
  };
  return (
    <>
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
            metadataFields={props.params.metadataFields}
            metadataQuery={props.params.metadataQuery}
          />
          <CorpusSelect
            corpus={props.params.corpus}
            corpusOptions={props.corpusOptions}
          />
        </Stack>
      </FilterGroupCollapse>
      <FilterGroupCollapse title={t("basicFilters")}>
        <Grid container spacing={1}>
          <Grid item xs="auto">
            <KeySelect
              keyValue={props.params.key}
              alternativeKeys={props.params.alternativeKeys}
            />
          </Grid>
          <Grid item xs={12} sm="auto">
            <TimeSignatureSelect
              availableTimeSignatures={props.availableTimeSignatures}
              timeSignature={props.params.timeSignature}
            />
          </Grid>
          <Grid item xs="auto" md={12}>
            <TempoSlider
              tempoFrom={props.params.tempoFrom}
              tempoTo={props.params.tempoTo}
              useTempo={props.params.useTempo}
            />
          </Grid>
        </Grid>
      </FilterGroupCollapse>
      <FilterGroupCollapse title={t("ambitusFilters")}>
        <Stack direction="column" spacing={1}>
          <NoteRangeSlider
            noteFrom={props.params.noteHighestFrom}
            noteTo={props.params.noteHighestTo}
            label={t("highestNote")}
            nameFrom="noteHighestFrom"
            nameTo="noteHighestTo"
          />
          <NoteRangeSlider
            noteFrom={props.params.noteLowestFrom}
            noteTo={props.params.noteLowestTo}
            label={t("lowestNote")}
            nameFrom="noteLowestFrom"
            nameTo="noteLowestTo"
          />
          <AmbitusSlider
            ambitusFrom={props.params.ambitusFrom}
            ambitusTo={props.params.ambitusTo}
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
          <RhythmNgramSearch rhythmNgram={props.params.rhythmNgram} />
          <MelodicNgramSearch
            melodicNgram={props.params.melodicNgram}
            melodicNgramRelative={props.params.melodicNgramRelative}
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
    </>
  );
}

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

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const originalFormData = new FormData(e.currentTarget);
    if (pagination.pageSize !== 10) {
      formData.set("pageSize", pagination.pageSize.toString());
    }
    for (const value of originalFormData.keys()) {
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
    // keep compare data
    formData.set("compareIds", params.compareIds);
    submit(formData);
  };

  const [showCompareList, setShowCompareList] = useState(
    params.showCompareList === "1",
  );
  useUpdateQueryStringValueWithoutNavigation(
    "showCompareList",
    showCompareList ? "1" : "0",
  );

  const compareRef = useRef<HTMLDivElement>(null);

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
      <CompareCollapseAndList
        onClickAway={() => {
          setShowCompareList(false);
        }}
        showCompareList={showCompareList}
        compareRef={compareRef}
        compareSongs={compareData}
        onCompareClick={() => {
          setShowCompareList(true);
        }}
      />
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
            ? `${(compareRef.current?.clientHeight ?? 0) + 40}px`
            : 0,
        }}
      >
        <Form onSubmit={onSubmit}>
          <Stack spacing={1} alignItems={"flex-start"} direction={"column"}>
            <SearchFilters
              params={params}
              corpusOptions={availableCorpuses}
              availableTimeSignatures={availableTimeSignatures}
            />
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
