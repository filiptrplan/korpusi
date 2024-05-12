import {
  AggregationsCardinalityAggregate,
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

export type CorpusAggregateXML = Awaited<ReturnType<typeof aggregateCorpusXML>>;
