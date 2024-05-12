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

export const getCorpusIdsFromIndex = async (index: "audio" | "songs") => {
  const corpuses = await elastic.search({
    index: index,
    aggs: {
      per_corpus: {
        terms: {
          field: "corpus_id",
        },
      },
    },
  });

  const aggregates = (
    corpuses.aggregations?.per_corpus as AggregationsStringTermsAggregate
  ).buckets as AggregationsStringTermsBucket[];

  return aggregates.map((x) => x.key);
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
    ).buckets as AggregationsHistogramBucket[]
  };
};

export type CorpusAggregateXML = Awaited<ReturnType<typeof aggregateCorpusXML>>;
export type CorpusAggregateAudio = Awaited<
  ReturnType<typeof aggregateCorpusAudio>
>;
