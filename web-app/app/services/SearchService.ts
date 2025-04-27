import {
  QueryDslQueryContainer,
  AggregationsStringTermsAggregate,
  SearchHit,
  SearchResponse,
  AggregationsAggregate,
  SearchTotalHits,
} from "@elastic/elasticsearch/lib/api/types";
import { elastic } from "~/services/Elastic";
import { SongResult } from "~/src/DataTypes";
import { noteToMidi } from "~/utils/notes";

export const searchAudio = async (
  params: Record<string, string>,
  page: number,
  pageSize: number,
): Promise<
  SearchResponse<SongResult, Record<string, AggregationsAggregate>>
> => {
  const xmlHits = await elastic.search<SongResult>({
    index: "songs",
    from: (page - 1) * pageSize,
    size: pageSize,
    query: constructQueryXML(params),
  });
  xmlHits.hits.hits = filterWithEducationalQuery(params, xmlHits.hits.hits);
  return xmlHits;
};

export const filterEducationalHit = (
  eduFilter: string,
  xmlHit: SearchHit<SongResult>,
): boolean => {
  switch (eduFilter) {
    case "IF1": {
      // IF1: Intervals allowed: m2, M2, m3, M3, P1 (abs values: 0, 1, 2, 3, 4)
      // Excludes consecutive m2 (abs value 1)
      if (!xmlHit._source?.contour?.melodic_contour_string_relative) {
        console.log(
          "Cannot apply filter IF1 because contour.melodic_contour_string_relative is missing",
        );
        return false; // Cannot apply filter if data is missing
      }
      const intervals = xmlHit._source.contour.melodic_contour_string_relative
        .split(" ")
        .map(Number);

      const allowedIntervalsAbs = new Set([0, 1, 2, 3, 4]);
      let previousIntervalAbs: number | null = null;

      for (const interval of intervals) {
        const intervalAbs = Math.abs(interval);

        // Check if interval is allowed
        if (!allowedIntervalsAbs.has(intervalAbs)) {
          return false; // Found a disallowed interval
        }

        // Check for consecutive minor seconds (m2)
        if (intervalAbs === 1 && previousIntervalAbs === 1) {
          return false; // Found consecutive m2
        }

        previousIntervalAbs = intervalAbs;
      }

      return true; // Passed all checks
    }
    case "VR1":
    case "VR2":
    case "IF2":
    case "RF1":
    case "RF2":
    case "RF3":
    case "RF4":
      // Placeholder for other filters - currently defaults to passing
      return true;
    default:
      return true; // If filter type is unknown or not applicable, pass the hit
  }
};

export const filterWithEducationalQuery = (
  params: Record<string, string>,
  xmlHits: SearchHit<SongResult>[],
): SearchHit<SongResult>[] => {
  if (params.edu === "none" || !params.edu) return xmlHits;
  const eduFilters = params.edu.split(",");
  for (const eduFilter of eduFilters) {
    console.log("Filtering hits with educational filter:", eduFilter);
    console.log("Hits before filtering:", xmlHits.length);
    xmlHits = xmlHits.filter((x) => filterEducationalHit(eduFilter, x));
    console.log("Hits after filtering:", xmlHits.length);
  }
  return xmlHits;
};

export const constructQueryXML = (
  params: Record<string, string>,
): QueryDslQueryContainer => {
  const queries: QueryDslQueryContainer[] = [];

  const metadataQuery = constructMetadataQuery(params);
  if (metadataQuery) queries.push(metadataQuery);

  const corpusQuery = constructCorpusQuery(params);
  if (corpusQuery) queries.push(corpusQuery);

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
    const midiNumbers = stringArr.map((x) => {
      const note = x.replace("b", "♭");
      return noteToMidi(note);
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

const constructMetadataQuery = (params: Record<string, string>) => {
  if ("metadataQuery" in params) {
    let metadataFields: string[] = [];
    if ("metadataFields" in params) {
      metadataFields = params.metadataFields.split(",");
    }
    return {
      query_string: {
        query: `"${params.metadataQuery}"~`,
        fields:
          metadataFields.length > 0
            ? metadataFields.map((x) => `metadata.${x}`)
            : ["metadata.*"],
      },
    };
  }
  return null;
};

const constructCorpusQuery = (params: Record<string, string>) => {
  if ("corpus" in params) {
    return {
      terms: {
        corpus_id: params.corpus.split(","),
      },
    };
  }
  return null;
};

export const constructQueryAudio = (
  params: Record<string, string>,
): QueryDslQueryContainer => {
  const queries: QueryDslQueryContainer[] = [];

  // METADATA
  const metadataQuery = constructMetadataQuery(params);
  if (metadataQuery) queries.push(metadataQuery);

  // CORPUS
  const corpusQuery = constructCorpusQuery(params);
  if (corpusQuery) queries.push(corpusQuery);

  /*
  Note: in these queries we must use the query_string query because we may add new algorithms
  in the future and want to match ALL the possible subkeys without changing the code
   */
  // TEMPO
  if ("useTempo" in params && params.useTempo === "on") {
    if ("tempoFrom" in params && "tempoTo" in params) {
      const tempoFrom = parseInt(params.tempoFrom);
      const tempoTo = parseInt(params.tempoTo);
      queries.push({
        query_string: {
          query: `bpm.\\*.bpm:(>=${tempoFrom} AND <=${tempoTo})`,
        },
      });
    }
  }

  // DURATION
  if ("useDuration" in params && params.useDuration === "on") {
    if ("durationFrom" in params && "durationTo" in params) {
      const durationFrom = parseInt(params.durationFrom);
      const durationTo = parseInt(params.durationTo);
      queries.push({
        query_string: {
          query: `sample_rate.\\*.duration:(>=${durationFrom} AND <=${durationTo})`,
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

export const getAvailableTimeSignatures = async () => {
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

export const getAvailableCorpuses = async () => {
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
