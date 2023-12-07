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
  ShouldRevalidateFunction,
  useLoaderData,
  useLocation,
  useNavigate,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import { LoaderFunctionArgs } from "@remix-run/server-runtime";
import { FormEvent, createContext, useEffect, useState } from "react";
import { elastic } from "~/services/Elastic";
import { SongResult } from "~/src/DataTypes";
import { useDebounceSubmit } from "~/src/useDebounceSubmit";
import { ResultRow } from "./search/ResultRow";
import { sklanjaj } from "~/src/helpers";
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
import notes from "./search/notes.json";
import { CorpusSelect } from "./search/CorpusSelect";
import { FilterGroupCollapse } from "./search/FilterGroupCollapse";
import { ResultList } from "./search/ResultList";
import { CompareOverlay } from "./search/CompareOverlay";

export let handle = {
  i18n: "search",
};

const constructQuery = (
  params: Record<string, string>
): QueryDslQueryContainer => {
  let queries: QueryDslQueryContainer[] = [];

  // CORPUS QUERY
  if ("corpus" in params) {
    queries.push({
      terms: {
        corpus_id: params.corpus.split(","),
      },
    });
  }
  // METADATA QUERY
  if ("metadataQuery" in params) {
    let metadataFields: string[] = [];
    if ("metadataFields" in params) {
      metadataFields = params.metadataFields.split(",");
    }
    queries.push({
      query_string: {
        query: `*${params.metadataQuery}*`,
        fields:
          metadataFields.length > 0
            ? metadataFields.map((x) => `metadata.${x}`)
            : ["metadata.*"],
      },
    });
  }

  // KEY QUERY
  if ("key" in params && params.key !== "none") {
    if ("alternativeKeys" in params && params.alternativeKeys === "on") {
      queries.push({
        bool: {
          should: [
            {
              term: {
                "key.most_certain_key": params.key,
              },
            },
            {
              match: {
                "key.alternate_keys": params.key,
              },
            },
          ],
        },
      });
    } else {
      queries.push({
        term: {
          "key.most_certain_key": params.key,
        },
      });
    }
  }

  // TIME SIGNATURE QUERY
  if ("timeSignature" in params && params.timeSignature !== "none") {
    queries.push({
      term: {
        time_signature: params.timeSignature,
      },
    });
  }

  // TEMPO QUERY
  if ("useTempo" in params && params.useTempo === "on") {
    if ("tempoFrom" in params && "tempoTo" in params) {
      const tempoFrom = parseInt(params.tempoFrom);
      const tempoTo = parseInt(params.tempoTo);
      queries.push({
        range: {
          tempo: {
            gte: tempoFrom,
            lte: tempoTo,
          },
        },
      });
    }
  }

  // HIGHEST NOTE QUERY
  if ("noteHighestFrom" in params && "noteHighestTo" in params) {
    const noteHighestFrom = parseInt(params.noteHighestFrom);
    const noteHighestTo = parseInt(params.noteHighestTo);
    queries.push({
      range: {
        "ambitus.max_note": {
          gte: noteHighestFrom,
          lte: noteHighestTo,
        },
      },
    });
  }

  // LOWEST NOTE QUERY
  if ("noteLowestFrom" in params && "noteLowestTo" in params) {
    const noteLowestFrom = parseInt(params.noteLowestFrom);
    const noteLowestTo = parseInt(params.noteLowestTo);
    queries.push({
      range: {
        "ambitus.min_note": {
          gte: noteLowestFrom,
          lte: noteLowestTo,
        },
      },
    });
  }

  // AMBITUS QUERY
  if ("ambitusFrom" in params && "ambitusTo" in params) {
    const ambitusFrom = parseInt(params.ambitusFrom);
    const ambitusTo = parseInt(params.ambitusTo);
    queries.push({
      range: {
        "ambitus.ambitus_semitones": {
          gte: ambitusFrom,
          lte: ambitusTo,
        },
      },
    });
  }

  // RHYTHM NGRAM QUERY
  if ("rhythmNgram" in params) {
    queries.push({
      match_phrase: {
        "rhythm.rhythm_string": params.rhythmNgram,
      },
    });
  }

  // MELODIC NGRAM QUERY
  if ("melodicNgram" in params) {
    // convert text to midi numbers
    const stringArr = params.melodicNgram.split(" ");
    const expandedNotes: any = { ...notes };
    Object.keys(notes).forEach((key) => {
      // here we expand the notes object to include flat keys with the regular letter b
      if (key.includes("♭")) {
        expandedNotes[key.replace("♭", "b")] = notes[key as keyof typeof notes];
      }
    });
    const midiNumbers = stringArr.map((x) => {
      const note = x.replace("♭", "b");
      return expandedNotes[note as keyof typeof expandedNotes];
    });
    const midiNumbersRelative = [];
    for (let i = 1; i < midiNumbers.length; i++) {
      midiNumbersRelative.push(midiNumbers[i] - midiNumbers[i - 1]); // we leave out the first note as we have no idea what the starting note is
    }
    if (
      "melodicNgramRelative" in params &&
      params.melodicNgramRelative === "on"
    ) {
      queries.push({
        match_phrase: {
          "contour.melodic_contour_string_relative":
            midiNumbersRelative.join(" "),
        },
      });
    } else {
      queries.push({
        match_phrase: {
          "contour.melodic_contour_string_absolute": midiNumbers.join(" "),
        },
      });
    }
  }

  return {
    bool: {
      must: queries,
    },
  };
};

const getAvailableTimeSignatures = async () => {
  const data = await elastic.search({
    index: "songs",
    aggs: {
      time_signatures: {
        terms: {
          field: "time_signature",
        },
      },
    },
  });
  if (!data.aggregations) {
    return [];
  }
  const timeSignatures = data.aggregations
    .time_signatures as AggregationsStringTermsAggregate;
  if (Array.isArray(timeSignatures.buckets)) {
    return timeSignatures.buckets.map((x) => x.key);
  } else {
    return [];
  }
};

const getAvailableCorpuses = async () => {
  const data = await elastic.search<{ corpus_name: string }>({
    index: "corpuses",
  });

  return data.hits.hits.map((x) => {
    return {
      value: x._id,
      label: x._source!.corpus_name,
    };
  });
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
              <Stack direction="row" spacing={1}>
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
              <Stack
                spacing={1.5}
                direction={{
                  md: "column",
                  lg: "row",
                }}
              >
                <KeySelect
                  keyValue={params.key}
                  alternativeKeys={params.alternativeKeys}
                />
                <TimeSignatureSelect
                  availableTimeSignatures={availableTimeSignatures}
                  timeSignature={params.timeSignature}
                />
                <TempoSlider
                  tempoFrom={params.tempoFrom}
                  tempoTo={params.tempoTo}
                  useTempo={params.useTempo}
                />
              </Stack>
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
              <Stack direction="row" spacing={1}>
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
