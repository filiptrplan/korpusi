import {
  Box,
  Button,
  ClickAwayListener,
  Collapse,
  Container,
  Paper,
  Slide,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import MusicNote from "@mui/icons-material/MusicNote";
import GraphicEqIcon from "@mui/icons-material/GraphicEq";
import { Form, useLoaderData, useNavigate, useSubmit } from "@remix-run/react";
import { LoaderFunctionArgs } from "@remix-run/server-runtime";
import {
  FormEvent,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { elastic } from "~/services/Elastic";
import { AudioResult, SongResult } from "~/src/DataTypes";
import {
  SearchHit,
  SearchResponse,
  SearchTotalHits,
} from "@elastic/elasticsearch/lib/api/types";
import { useTranslation } from "react-i18next";
import { ResultList } from "./search/ResultList";
import { CompareOverlay } from "./compare/CompareOverlay";
import {
  constructQueryAudio,
  constructQueryXML,
  getAvailableCorpuses,
  getAvailableTimeSignatures,
  searchAudio,
} from "../services/SearchService";
import { CompareList } from "./compare/CompareList";
import { useUpdateQueryStringValueWithoutNavigation } from "~/utils/misc";
import { ResultRowXML } from "~/routes/search/ResultRowXML";
import { SearchFiltersXML } from "~/routes/search/SearchFiltersXML";
import { SearchFiltersAudio } from "~/routes/search/SearchFiltersAudio";
import { ResultRowAudio } from "~/routes/search/ResultRowAudio";

export const handle = {
  i18n: ["search", "compare"],
};

export enum SearchType {
  Audio,
  XML,
}

export const SearchTypeContext = createContext<SearchType>(SearchType.Audio);

export const CompareContext = createContext<{
  xmlHits: SearchHit<SongResult>[];
  audioHits: SearchHit<AudioResult>[];
}>({
  audioHits: [],
  xmlHits: [],
});

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

  // search type
  const searchType = stringToSearchType(params.searchType);

  // Search data fetching
  const xmlHits = await searchAudio(params, page, pageSize);

  const audioHits = await elastic.search<AudioResult>({
    index: "audio",
    from: (page - 1) * pageSize,
    size: pageSize,
    query: constructQueryAudio(params),
  });

  const getTotalHits = (data: SearchResponse<unknown>) =>
    (data.hits.total as SearchTotalHits)?.value;
  const getTotalPages = (data: SearchResponse<unknown>) =>
    Math.ceil(getTotalHits(data) / pageSize) ?? 0;
  const totalPages = getTotalPages(
    searchType == SearchType.XML ? xmlHits : audioHits,
  );
  const totalHits =
    getTotalHits(searchType == SearchType.XML ? xmlHits : audioHits) ?? 0;

  // Compare song fetching
  let compareIds: string[] = [];
  if ("compareIds" in params) {
    compareIds = params.compareIds.split(",");
  }

  let compareData: SearchResponse<unknown>;
  if (searchType == SearchType.Audio) {
    compareData = await elastic.search<AudioResult>({
      index: "audio",
      query: {
        ids: {
          values: compareIds,
        },
      },
    });
  } else {
    compareData = await elastic.search<SongResult>({
      index: "songs",
      query: {
        ids: {
          values: compareIds,
        },
      },
    });
  }

  if ((compareData.hits.total as SearchTotalHits).value !== compareIds.length) {
    throw new Error("Not all ids found");
  }

  return {
    xmlData: {
      hits: xmlHits.hits.hits,
      compareHits: compareData.hits.hits,
      availableTimeSignatures: await getAvailableTimeSignatures(),
    },
    audioData: {
      hits: audioHits.hits.hits,
    },
    params,
    compareData: {
      xmlHits:
        searchType == SearchType.XML
          ? (compareData.hits.hits as unknown as SearchHit<SongResult>[])
          : [],
      audioHits:
        searchType == SearchType.Audio
          ? (compareData.hits.hits as unknown as SearchHit<AudioResult>[])
          : [],
    },
    availableCorpuses: await getAvailableCorpuses(),
    pagination: {
      total: totalPages,
      pageSize: pageSize,
      totalHits: totalHits,
      current: Math.min(page, totalPages),
    },
  };
};

export const CompareCollapseAndList: React.FC<{
  onClickAway: () => void;
  showCompareList: boolean;
  compareRef: React.MutableRefObject<HTMLDivElement | null>;
  onCompareClick: () => void;
  compareData: {
    xmlHits: SearchHit<SongResult>[];
    audioHits: SearchHit<AudioResult>[];
  };
}> = ({
  compareRef,
  compareData,
  onClickAway,
  onCompareClick,
  showCompareList,
}) => {
  const searchType = useContext(SearchTypeContext);
  const dataLength =
    searchType == SearchType.Audio
      ? compareData.audioHits.length
      : compareData.xmlHits.length;
  const showCompare = dataLength > 0 && !showCompareList;

  return (
    <CompareContext.Provider value={compareData}>
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
                  <CompareOverlay onCompareClick={onCompareClick} />
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
                <CompareList />
              </Container>
            </Collapse>
          </Paper>
        </Slide>
      </ClickAwayListener>
    </CompareContext.Provider>
  );
};

const stringToSearchType = (str: string): SearchType => {
  return isNaN(parseInt(str)) ? SearchType.XML : parseInt(str);
};

export default function Search() {
  const {
    audioData,
    xmlData,
    params,
    pagination,
    availableCorpuses,
    compareData,
  } = useLoaderData<typeof loader>();

  const { hits: xmlHits, availableTimeSignatures } = xmlData;

  const { hits: audioHits } = audioData;

  const searchType: SearchType = stringToSearchType(params.searchType);
  const navigate = useNavigate();

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
    if (params.compareIds) formData.set("compareIds", params.compareIds);
    if (params.searchType) formData.set("searchType", params.searchType);
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

  const resetFields = (newSearchType?: SearchType) => {
    localStorage.removeItem("searchParams");
    navigate("/search?searchType=" + (newSearchType ?? searchType));
  };

  const resultRowsXML = xmlHits.map((song) => {
    return (
      <ResultRowXML
        songHit={song}
        key={song._id}
        corpusOptions={availableCorpuses}
      />
    );
  });

  const resultRowsAudio = audioHits.map((song) => {
    return (
      <ResultRowAudio
        audioHit={song}
        key={song._id}
        corpusOptions={availableCorpuses}
      />
    );
  });

  const { t } = useTranslation("search");

  return (
    <SearchTypeContext.Provider value={searchType}>
      <CompareCollapseAndList
        onClickAway={() => {
          setShowCompareList(false);
        }}
        showCompareList={showCompareList}
        compareRef={compareRef}
        compareData={compareData}
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
            {searchType == SearchType.XML ? (
              <SearchFiltersXML
                params={params}
                corpusOptions={availableCorpuses}
                availableTimeSignatures={availableTimeSignatures}
              />
            ) : (
              <SearchFiltersAudio
                params={params}
                corpusOptions={availableCorpuses}
              />
            )}
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
                onClick={() => resetFields()}
              >
                {t("reset")}
              </Button>
              <Stack
                direction="row"
                alignItems="center"
                spacing={0.5}
                sx={{
                  px: 1,
                }}
              >
                <Stack direction="row" alignItems="center" spacing={0.6}>
                  <MusicNote fontSize="small" />
                  <Typography>{t("switchToXML")}</Typography>
                </Stack>
                <Switch
                  checked={searchType == SearchType.Audio}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    console.log(searchType);
                    if (event.target.checked) {
                      resetFields(SearchType.Audio);
                    } else {
                      resetFields(SearchType.XML);
                    }
                  }}
                />
                <Stack direction="row" alignItems="center" spacing={0.6}>
                  <GraphicEqIcon fontSize="small" />
                  <Typography>{t("switchToAudio")}</Typography>
                </Stack>
              </Stack>
            </Stack>
          </Stack>
        </Form>
        <ResultList
          pagination={pagination}
          resultRows={
            searchType == SearchType.XML ? resultRowsXML : resultRowsAudio
          }
        />
      </Box>
    </SearchTypeContext.Provider>
  );
}
