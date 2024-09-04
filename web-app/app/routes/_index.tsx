import { Grid, Link, Stack, Typography } from "@mui/material";
import { Trans, useTranslation } from "react-i18next";
import { useLoaderData } from "@remix-run/react";
import { InfoCard } from "~/components/InfoCard";
import { LoaderFunction } from "@remix-run/server-runtime";
import { elastic } from "~/services/Elastic";
import { CorpusAccordionXML } from "./index/CorpusAccordionXML";
import { MAccordion } from "~/components/MAccordion";
import {
  CorpusAggregateAudio,
  CorpusAggregateXML,
  aggregateCorpusAudio,
  aggregateCorpusXML,
  getCorpusIdsFromIndex,
} from "~/services/IndexService";
import { CorpusAccordionAudio } from "~/routes/index/CorpusAccordionAudio";

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

  const songCorpusIds = await getCorpusIdsFromIndex("songs");
  const audioCorpusIds = await getCorpusIdsFromIndex("audio");

  const corpusAggregatesXML = await Promise.all<
    ReturnType<typeof aggregateCorpusXML>
  >(songCorpusIds.map((corpusId) => aggregateCorpusXML(corpusId)));

  const corpusAggregatesAudio = await Promise.all<
    ReturnType<typeof aggregateCorpusAudio>
  >(audioCorpusIds.map((corpusId) => aggregateCorpusAudio(corpusId)));

  return {
    allSongsCount: allDocumentsCount,
    allCorpusesCount: allCorpusesCount.count,
    corpusAggregatesXML,
    corpusAggregatesAudio,
  };
};

export default function Index() {
  const {
    allSongsCount,
    allCorpusesCount,
    corpusAggregatesXML,
    corpusAggregatesAudio,
  } = useLoaderData<typeof loader>();
  const { t } = useTranslation("index");

  const xmlAggregates = corpusAggregatesXML.map(
    (corpus: CorpusAggregateXML) => (
      <CorpusAccordionXML key={corpus.corpusId} corpus={corpus} />
    )
  );

  const audioAggregates = corpusAggregatesAudio.map(
    (corpus: CorpusAggregateAudio) => (
      <CorpusAccordionAudio key={corpus.corpusId} corpus={corpus} />
    )
  );

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
      <Stack>
        {xmlAggregates}
        {audioAggregates}
      </Stack>
    </>
  );
}
