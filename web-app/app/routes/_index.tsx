import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Grid,
  Link,
  Typography,
} from "@mui/material";
import { Trans, useTranslation } from "react-i18next";
import { MetaFunction, useLoaderData } from "@remix-run/react";
import { InfoCard } from "~/components/InfoCard";
import { LoaderFunction, LoaderFunctionArgs } from "@remix-run/server-runtime";
import { elastic } from "~/services/Elastic";
import {
  AggregationsStringTermsAggregate,
  AggregationsTermsAggregation,
} from "@elastic/elasticsearch/lib/api/typesWithBodyKey";
import {
  AggregationsCardinalityAggregate,
  AggregationsStatsAggregate,
  AggregationsStringTermsBucket,
} from "@elastic/elasticsearch/lib/api/types";
import { CorpusAccordion } from "./index/CorpusAccordion";
import ArrowDropDown from "@mui/icons-material/ArrowDropDown";

export const handle = {
  i18n: "index",
};

const aggregateCorpus = async (corpusId: string) => {
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

  const corpusName = (
    await elastic.search<{ corpus_name: string }>({
      index: "corpuses",
      query: {
        term: {
          _id: corpusId,
        },
      },
    })
  ).hits.hits[0]._source!.corpus_name;
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

export type CorpusAggregate = Awaited<ReturnType<typeof aggregateCorpus>>;

export const loader: LoaderFunction = async ({
  request,
}: LoaderFunctionArgs) => {
  const allDocumentsCount = await elastic.count({
    index: "songs",
  });

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
    ReturnType<typeof aggregateCorpus>
  >(allCorpusIds.map((corpusId) => aggregateCorpus(corpusId)));

  return {
    allSongsCount: allDocumentsCount.count,
    allCorpusesCount: allCorpusesCount.count,
    perCorpusCount: perCorpusAggregate,
    corpusAggregates,
  };
};

export default function Index() {
  const { allSongsCount, allCorpusesCount, perCorpusCount, corpusAggregates } =
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
      <Accordion
        variant="outlined"
        disableGutters
        defaultExpanded={true}
        sx={{
          overflow: "hidden",
          borderRadius: 1,
          my: 1,
        }}
      >
        <AccordionSummary expandIcon={<ArrowDropDown />}>
          <Typography variant="h5">{t("allStatsTitle")}</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={1}>
            <Grid item xs="auto">
              <InfoCard title={t("totalSongs")} value={allSongsCount} />
            </Grid>
            <Grid item xs="auto">
              <InfoCard title={t("totalCorpuses")} value={allCorpusesCount} />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
      {corpusAggregates.map((corpus: CorpusAggregate) => (
        <CorpusAccordion corpus={corpus} />
      ))}
    </>
  );
}
