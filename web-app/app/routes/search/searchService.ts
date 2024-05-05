import {
  QueryDslQueryContainer,
  AggregationsStringTermsAggregate,
} from "@elastic/elasticsearch/lib/api/types";
import { elastic } from "~/services/Elastic";
import { noteToMidi } from "~/utils/notes";

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
        query: `*${params.metadataQuery}*`,
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

  const metadataQuery = constructMetadataQuery(params);
  if (metadataQuery) queries.push(metadataQuery);

  const corpusQuery = constructCorpusQuery(params);
  if (corpusQuery) queries.push(corpusQuery);

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
