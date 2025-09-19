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
import { getEnabledCorpusIds } from "./IndexService";

export const searchXML = async (
  params: Record<string, string>,
  page: number,
  pageSize: number,
): Promise<
  SearchResponse<SongResult, Record<string, AggregationsAggregate>>
> => {
  return elastic.search<SongResult>({
    index: "songs",
    from: (page - 1) * pageSize,
    size: pageSize,
    query: await constructQueryXML(params),
  });
};

export const constructQueryXML = async (
  params: Record<string, string>,
): Promise<QueryDslQueryContainer> => {
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

  // EDUCATIONAL FILTERS
  const educationalQuery = constructEducationalQuery(params);
  if (educationalQuery) queries.push(educationalQuery);

  // RHYTHM NGRAM QUERY
  if ("rhythmNgram" in params && params.rhythmNgram.trim() !== "") {
    queries.push({
      match_phrase: {
        "rhythm.rhythm_string": params.rhythmNgram,
      },
    });
  }

  // MELODIC NGRAM QUERY
  if ("melodicNgram" in params && params.melodicNgram.trim() !== "") {
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

  queries.push(await constructEnabledQuery());
  return {
    bool: {
      must: queries,
    },
  };
};

const constructEnabledQuery = async (): Promise<QueryDslQueryContainer> => {
  return {
    terms: {
      corpus_id: await getEnabledCorpusIds(),
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
  if ("corpus" in params && params.corpus !== "none") {
    return {
      terms: {
        corpus_id: params.corpus.split(","),
      },
    };
  }
  return null;
};

const constructEducationalQuery = (params: Record<string, string>) => {
  if (!("edu" in params) || params.edu === "none") {
    return null;
  }

  const eduFilters = params.edu.split(",");
  const filterQueries: QueryDslQueryContainer[] = [];

  for (const filter of eduFilters) {
    switch (filter) {
      case "IF1":
        filterQueries.push({
          bool: {
            must: [
              {
                regexp: {
                  "contour.melodic_contour_string_relative.keyword":
                    "(-?(0|1|2|3|4))( +-?(0|1|2|3|4))*",
                },
              },
            ],
            must_not: [
              {
                regexp: {
                  "contour.melodic_contour_string_relative.keyword": ".*1 1.*",
                },
              },
              {
                regexp: {
                  "contour.melodic_contour_string_relative.keyword":
                    ".*-1 -1.*",
                },
              },
            ],
          },
        });
        break;
      case "IF2":
        filterQueries.push({
          bool: {
            must: [
              {
                regexp: {
                  "contour.melodic_contour_string_relative.keyword":
                    "(-?(0|1|2|3|4|5|7))(\\s+-?(0|1|2|3|4|5|7))*",
                },
              },
            ],
            must_not: [
              {
                regexp: {
                  "contour.melodic_contour_string_relative.keyword": ".*1 1.*",
                },
              },
              {
                regexp: {
                  "contour.melodic_contour_string_relative.keyword":
                    ".*-1 -1.*",
                },
              },
            ],
          },
        });
        break;
      case "VR1":
        // VRF1: Vocal Range C4 (MIDI 60) to A4 (MIDI 69)
        filterQueries.push({
          bool: {
            must: [
              {
                range: {
                  "ambitus.min_note": {
                    gte: 60, // C4 (changed from 62/D4)
                  },
                },
              },
              {
                range: {
                  "ambitus.max_note": {
                    lte: 69, // A4
                  },
                },
              },
              {
                script: {
                  script: {
                    source: `doc['ambitus.max_note'].value - doc['ambitus.min_note'].value <= 12`,
                  },
                },
              },
            ],
          },
        });
        break;

      case "VR2":
        // VRF2: Vocal Range A3 (MIDI 57) to C5 (MIDI 72)
        filterQueries.push({
          bool: {
            must: [
              {
                range: {
                  "ambitus.min_note": {
                    gte: 57, // A3
                  },
                },
              },
              {
                range: {
                  "ambitus.max_note": {
                    lte: 72, // C5
                  },
                },
              },
              {
                script: {
                  script: {
                    source: `doc['ambitus.max_note'].value - doc['ambitus.min_note'].value <= 12`,
                  },
                },
              },
            ],
          },
        });
        break;
      case "RF1":
        // RF1: Simple Rhythm Filter
        filterQueries.push({
          bool: {
            must: [
              // 1. Time Signature must be 2/4, 4/4, or 2/2
              {
                script: {
                  script: {
                    source: `
                 def allowed = ['2/4', '4/4', '2/2'];
                for (value in doc['time_signature']) {
                  if (!allowed.contains(value)) {
                    return false;
                  }
                }
                return true;
                    `,
                  },
                },
              },
              // 2. At least 80% eighth (0.5) or quarter (1.0) notes
              {
                script: {
                  script: {
                    lang: "painless",
                    // Access _source directly to avoid fielddata issues on text fields
                    source: `
                      String rhythmString = doc['rhythm.rhythm_string_no_rests.keyword'].value;
                      if (rhythmString.isEmpty()) {
                          return false; // Empty string doesn't meet criteria
                      }

                      String[] values = rhythmString.splitOnToken(' ');
                      int totalCount = values.length;
                      int eighthQuarterCount = 0;

                      if (totalCount == 0) {
                        return false; // No notes means it doesn't meet the criteria
                      }

                      for (String val : values) {
                        // Check for quarter notes ("1/1") and eighth notes ("1/2")
                        if (val.equals("1/1") || val.equals("1/2")) {
                          eighthQuarterCount++;
                        }
                      }

                      // Calculate percentage and compare
                      return (double)eighthQuarterCount / totalCount >= 0.9;
                    `,
                  },
                },
              },
              // 3. No Rests
              {
                term: {
                  "rhythm.num_rests": 0,
                },
              },
            ],
          },
        });
        break;
      case "RF2":
        // RF2: Slightly More Complex Rhythm Filter
        filterQueries.push({
          bool: {
            must: [
              // 1. Time Signature must be 2/4, 4/4, or 2/2
              {
                script: {
                  script: {
                    source: `
                 def allowed = ['2/4', '4/4', '2/2'];
                for (value in doc['time_signature']) {
                  if (!allowed.contains(value)) {
                    return false;
                  }
                }
                return true;
                    `,
                  },
                },
              },
              // 2. At least 70% eighth ("1/2"), quarter ("1/1"), or half ("2/1") notes
              {
                script: {
                  script: {
                    lang: "painless",
                    // Access _source directly to avoid fielddata issues on text fields
                    source: `
                      String rhythmString = doc['rhythm.rhythm_string_no_rests.keyword'].value;
                      if (rhythmString.isEmpty()) {
                          return false; // Empty string doesn't meet criteria
                      }

                      String[] values = rhythmString.splitOnToken(' ');
                      int totalCount = values.length;
                      int targetNoteCount = 0;

                      if (totalCount == 0) {
                        return false; // No notes means it doesn't meet the criteria
                      }

                      for (String val : values) {
                        // Check for eighth ("1/2"), quarter ("1/1"), or half ("2/1") notes
                        if (val.equals("1/2") || val.equals("1/1") || val.equals("2/1")) {
                          targetNoteCount++;
                        }
                      }

                      // Calculate percentage and compare
                      return (double)targetNoteCount / totalCount >= 0.7;
                    `,
                  },
                },
              },
              // 3. No Rests
              {
                term: {
                  "rhythm.num_rests": 0,
                },
              },
            ],
          },
        });
        break;
      case "RF3":
        // RF3: Complex Rhythm Filter with Limited Rests
        filterQueries.push({
          bool: {
            must: [
              // 1. Time Signature must be 2/4, 4/4, or 2/2
              {
                script: {
                  script: {
                    source: `
                 def allowed = ['2/4', '4/4', '2/2'];
                for (value in doc['time_signature']) {
                  if (!allowed.contains(value)) {
                    return false;
                  }
                }
                return true;
                    `,
                  },
                },
              },
              // 2. At least 70% eighth ("1/2"), quarter ("1/1"), or half ("2/1") notes
              {
                script: {
                  script: {
                    lang: "painless",
                    // Access _source directly to avoid fielddata issues on text fields
                    source: `
                      String rhythmString = doc['rhythm.rhythm_string_no_rests.keyword'].value;
                      if (rhythmString.isEmpty()) {
                          return false; // Empty string doesn't meet criteria
                      }

                      String[] values = rhythmString.splitOnToken(' ');
                      int totalCount = values.length;
                      int targetNoteCount = 0;

                      if (totalCount == 0) {
                        return false; // No notes means it doesn't meet the criteria
                      }

                      for (String val : values) {
                        // Check for eighth ("1/2"), quarter ("1/1"), or half ("2/1") notes
                        if (val.equals("1/2") || val.equals("1/1") || val.equals("2/1")) {
                          targetNoteCount++;
                        }
                      }

                      // Calculate percentage and compare
                      return (double)targetNoteCount / totalCount >= 0.7;
                    `,
                  },
                },
              },
              // 3. Maximum 2 Rests
              {
                range: {
                  "rhythm.num_rests": {
                    lte: 2,
                  },
                },
              },
            ],
          },
        });
        break;
      case "RF4":
        // RF4: Complex Rhythm Filter with More Rests Allowed
        filterQueries.push({
          bool: {
            must: [
              // 1. Must have a single time signature (any type)
              // We check for existence, assuming the field stores a single value if present.
              {
                script: {
                  script: {
                    source: "doc['time_signature'].length == 1",
                  },
                },
              },
              // 2. At least 70% eighth ("1/2"), quarter ("1/1"), or half ("2/1") notes
              {
                script: {
                  script: {
                    lang: "painless",
                    source: `
                      String rhythmString = doc['rhythm.rhythm_string_no_rests.keyword'].value;
                      if (rhythmString.isEmpty()) {
                          return false; // Empty string doesn't meet criteria
                      }

                      String[] values = rhythmString.splitOnToken(' ');
                      int totalCount = values.length;
                      int targetNoteCount = 0;

                      if (totalCount == 0) {
                        return false; // No notes means it doesn't meet the criteria
                      }

                      for (String val : values) {
                        // Check for eighth ("1/2"), quarter ("1/1"), or half ("2/1") notes
                        if (val.equals("1/2") || val.equals("1/1") || val.equals("2/1")) {
                          targetNoteCount++;
                        }
                      }

                      // Calculate percentage and compare
                      return (double)targetNoteCount / totalCount >= 0.8;
                    `,
                  },
                },
              },
              // 3. Maximum 4 Rests
              {
                range: {
                  "rhythm.num_rests": {
                    lte: 4,
                  },
                },
              },
            ],
          },
        });
        break;
      default:
        // Optionally log or handle unknown filters
        console.warn(`Unknown educational filter requested: ${filter}`);
        break;
    }
  }

  if (filterQueries.length > 0) {
    // Combine all filter scripts under a single 'must' clause
    return {
      bool: {
        must: filterQueries,
      },
    };
  }

  return null;
};

export const constructQueryAudio = async (
  params: Record<string, string>,
): Promise<QueryDslQueryContainer> => {
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

  queries.push(await constructEnabledQuery());
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
    query: {
      bool: {
        must_not: {
          term: {
            enabled: false,
          },
        },
      },
    },
  });

  return data.hits.hits.map((x) => {
    return {
      value: x._id,
      label: x._source!.corpus_name,
    };
  });
};
