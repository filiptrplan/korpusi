import License from "@elastic/elasticsearch/lib/api/api/license";
import {
  AggregationsCardinalityAggregate,
  AggregationsHistogramAggregate,
  AggregationsHistogramBucket,
  AggregationsStatsAggregate,
  AggregationsStringTermsAggregate,
  AggregationsStringTermsBucket,
} from "@elastic/elasticsearch/lib/api/types";
import { elastic } from "~/services/Elastic";

const getCorpusCount = async (corpusId: string, index: "audio" | "songs") => {
  return await elastic.count({
    index: index,
    query: {
      term: {
        corpus_id: corpusId,
      },
    },
  });
};

const getCorpusName = async (corpusId: string): Promise<string> => {
  const corpusNameHits = (
    await elastic.search<{ corpus_name: string }>({
      index: "corpuses",
      query: {
        term: {
          _id: corpusId,
        },
      },
    })
  ).hits.hits[0];

  const corpusName = corpusNameHits._source?.corpus_name;
  return corpusName ?? "";
};

export const getEnabledCorpusIds = async () => {
  const enabledCorpuses = await elastic.search({
    index: "corpuses",
    size: 10000,
    query: {
      bool: {
        must_not: [
          {
            term: {
              enabled: false,
            },
          },
        ],
      },
    },
    _source: false,
  });

  const enabledCorpusIds = enabledCorpuses.hits.hits.map(
    (hit) => hit._id as string,
  );

  return enabledCorpusIds;
};

export const getCorpusIdsFromIndex = async (index: "audio" | "songs") => {
  const corpusesInIndex = await elastic.search({
    index: index,
    size: 0,
    aggs: {
      per_corpus: {
        terms: {
          field: "corpus_id",
          size: 10000,
        },
      },
    },
  });

  const aggregates = (
    corpusesInIndex.aggregations?.per_corpus as AggregationsStringTermsAggregate
  ).buckets as AggregationsStringTermsBucket[];

  const allCorpusIds = aggregates.map((x) => x.key as string);
  const enabledIds = await getEnabledCorpusIds();
  return allCorpusIds.filter((x) => enabledIds.contains(x));
};

export const aggregateCorpusXML = async (corpusId: string) => {
  const corpusCount = await getCorpusCount(corpusId, "songs");

  const corpus = elastic.search({
    index: "songs",
    size: 0,
    query: {
      term: {
        corpus_id: corpusId,
      },
    },
    aggs: {
      composersCount: {
        cardinality: {
          field: "metadata.composer.keyword",
        },
      },
      metrumBuckets: {
        terms: {
          field: "time_signature",
        },
      },

      keysBuckets: {
        terms: {
          field: "key.most_certain_key",
        },
      },
      ambitus: {
        stats: {
          field: "ambitus.ambitus_semitones",
        },
      },
    },
  });

  const aggregations = (await corpus).aggregations;

  return {
    corpusName: await getCorpusName(corpusId),
    corpusId,
    songCount: corpusCount.count,
    composersCount: (
      aggregations?.composersCount as AggregationsCardinalityAggregate
    ).value,
    metrumBuckets: (
      aggregations?.metrumBuckets as AggregationsStringTermsAggregate
    ).buckets as AggregationsStringTermsBucket[],
    keysBuckets: (aggregations?.keysBuckets as AggregationsStringTermsAggregate)
      .buckets as AggregationsStringTermsBucket[],
    ambitusStats: aggregations?.ambitus as AggregationsStatsAggregate,
  };
};

export const aggregateCorpusAudio = async (corpusId: string) => {
  const corpus = await elastic.search({
    index: "audio",
    size: 0,
    aggs: {
      tempo_buckets: {
        histogram: {
          field: "bpm.essentia_multifeature.bpm",
          interval: 5,
          min_doc_count: 5,
          extended_bounds: {
            min: 50,
            max: 200,
          },
        },
      },
    },
  });

  return {
    corpusId,
    corpusName: await getCorpusName(corpusId),
    songCount: (await getCorpusCount(corpusId, "audio")).count,
    tempoBuckets: (
      corpus.aggregations?.tempo_buckets as AggregationsHistogramAggregate
    ).buckets as AggregationsHistogramBucket[],
  };
};

export type CorpusAggregateXML = Awaited<ReturnType<typeof aggregateCorpusXML>>;
export type CorpusAggregateAudio = Awaited<
  ReturnType<typeof aggregateCorpusAudio>
>;
export interface Corpus {
  corpus_name: string;
  enabled?: boolean;
  license?: {
    url: string;
    description?: string;
    description_translations?: Record<string, string>;
  };
  description?: string;
  description_translations?: Record<string, string>;
}

export const getLicenseDescriptionFromCorpus = (
  corpus: Corpus,
  language: string,
): string | undefined => {
  if (!corpus.license) return undefined;
  if (!corpus.license.description_translations)
    return corpus.license.description;
  return (
    corpus.license.description_translations[language] ??
    corpus.license.description
  );
};

export const getDescriptionFromCorpus = (
  corpus: Corpus,
  language: string,
): string | undefined => {
  if (!corpus.description_translations) return corpus.description;
  return corpus.description_translations[language] ?? corpus.description;
};
