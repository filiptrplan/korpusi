import { Grid, Link, Typography } from "@mui/material";
import { Trans, useTranslation } from "react-i18next";
import { useLoaderData } from "@remix-run/react";
import { InfoCard } from "~/components/InfoCard";
import { LoaderFunction } from "@remix-run/server-runtime";
import { elastic } from "~/services/Elastic";
import { AggregationsStringTermsAggregate } from "@elastic/elasticsearch/lib/api/typesWithBodyKey";
import {
  AggregationsCardinalityAggregate,
  AggregationsStatsAggregate,
  AggregationsStringTermsBucket,
} from "@elastic/elasticsearch/lib/api/types";
import { CorpusAccordionXML } from "./index/CorpusAccordionXML";
import { MAccordion } from "~/components/MAccordion";

export const handle = {
  i18n: "index",
};

const aggregateCorpusXML = async (corpusId: string) => {
  const corpusCount = elastic.count({
    index: "songs",
    query: {
      term: {
        corpus_id: corpusId,
      },
    },
  });
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
  const aggregations = (await corpus).aggregations;
  const corpusCountValue = (await corpusCount).count;

  return {
    corpusName,
    corpusId,
    songCount: corpusCountValue,
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

export const loader: LoaderFunction = async () => {
  const xmlCount = await elastic.count({
    index: "songs",
  });
  const audioCount = await elastic.count({
    index: "audio",
  });

  const allDocumentsCount = xmlCount.count + audioCount.count;

  const allCorpusesCount = await elastic.count({
    index: "corpuses",
  });

  const perCorpusCount = await elastic.search({
    index: "songs",
    aggs: {
      per_corpus: {
        terms: {
          field: "corpus_id",
        },
      },
    },
  });

  const perCorpusAggregate = (
    perCorpusCount.aggregations?.per_corpus as AggregationsStringTermsAggregate
  ).buckets as AggregationsStringTermsBucket[];

  const allCorpusIds = perCorpusAggregate.map((x) => x.key);
  const corpusAggregates = await Promise.all<
    ReturnType<typeof aggregateCorpusXML>
  >(allCorpusIds.map((corpusId) => aggregateCorpusXML(corpusId)));

  return {
    allSongsCount: allDocumentsCount,
    allCorpusesCount: allCorpusesCount.count,
    perCorpusCount: perCorpusAggregate,
    corpusAggregates,
  };
};

export default function Index() {
  const { allSongsCount, allCorpusesCount, corpusAggregates } =
    useLoaderData<typeof loader>();
  const { t } = useTranslation("index");

  return (
    <>
      <Typography
        variant="h3"
        textAlign="center"
        fontWeight="600"
        lineHeight="6rem"
      >
        {t("heroTitle")}
      </Typography>
      <Typography variant="h4">{t("projectDescriptionTitle")}</Typography>
      <Typography
        variant="body1"
        sx={{
          mb: 1,
        }}
      >
        <Trans t={t} i18nKey="projectDescription">
          Opis
          <Link href="http://muzikologijaff.si/gmgm/"></Link>
        </Trans>
      </Typography>
      <MAccordion title={t("allStatsTitle")}>
        <Grid container spacing={1}>
          <Grid item xs="auto">
            <InfoCard title={t("totalSongs")} value={allSongsCount} />
          </Grid>
          <Grid item xs="auto">
            <InfoCard title={t("totalCorpuses")} value={allCorpusesCount} />
          </Grid>
        </Grid>
      </MAccordion>
      {corpusAggregates.map((corpus: CorpusAggregateXML) => (
        <CorpusAccordionXML key={corpus.corpusId} corpus={corpus} />
      ))}
    </>
  );
}
