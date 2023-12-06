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
  useLocation,
  useNavigate,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import { LoaderFunctionArgs } from "@remix-run/server-runtime";
import { FormEvent, useEffect, useState } from "react";
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

export let handle = {
  i18n: "search",
};

const constructQuery = (
  params: Record<string, string>
): QueryDslQueryContainer => {
  let queries: QueryDslQueryContainer[] = [];

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
    pagination: {
      total: totalPages,
      pageSize: pageSize,
      totalHits: (data.hits.total as SearchTotalHits)?.value ?? 0,
      current: Math.min(page, totalPages),
    },
  };
};

export default function Search() {
  const { data, params, pagination, availableTimeSignatures } =
    useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const { t } = useTranslation("search");
  const resultComponents = data.map((song) => {
    return <ResultRow songHit={song} key={song._id} />;
  });

  const searching = navigation.state !== "idle";
  const submit = useSubmit();

  const resetFields = () => {
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

  return (
    <div>
      <Form onSubmit={onSubmit}>
        <Stack spacing={1.6} alignItems={"flex-start"} direction={"column"}>
          <MetadataSelect
            metadataFields={params.metadataFields}
            metadataQuery={params.metadataQuery}
          />
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
          <Stack direction="row" spacing={1}>
            <RhythmNgramSearch rhythmNgram={params.rhythmNgram} />
            <MelodicNgramSearch
              melodicNgram={params.melodicNgram}
              melodicNgramRelative={params.melodicNgramRelative}
            />
          </Stack>
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
