import { Grid, Link, Typography } from "@mui/material";
import { Trans, useTranslation } from "react-i18next";
import { useLoaderData } from "@remix-run/react";
import { InfoCard } from "~/components/InfoCard";
import { LoaderFunction } from "@remix-run/server-runtime";
import { elastic } from "~/services/Elastic";
import { AggregationsStringTermsAggregate } from "@elastic/elasticsearch/lib/api/typesWithBodyKey";
import { AggregationsStringTermsBucket } from "@elastic/elasticsearch/lib/api/types";
import { CorpusAccordionXML } from "./index/CorpusAccordionXML";
import { MAccordion } from "~/components/MAccordion";
import {
  CorpusAggregateXML,
  aggregateCorpusXML,
} from "~/services/IndexService";

export const handle = {
  i18n: "index",
};

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

  const xmlAggregates = corpusAggregates.map((corpus: CorpusAggregateXML) => (
    <CorpusAccordionXML key={corpus.corpusId} corpus={corpus} />
  ));

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
      {xmlAggregates}
    </>
  );
}
