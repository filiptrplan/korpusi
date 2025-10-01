import { Grid, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useLoaderData } from "@remix-run/react";
import { MarkdownLinkRenderer } from "~/components/MarkdownLinkRenderer";
import { InfoCard } from "~/components/InfoCard";
import { LoaderFunction } from "@remix-run/server-runtime";
import { elastic } from "~/services/Elastic";
import { CorpusAccordionXML } from "./index/CorpusAccordionXML";
import { MAccordion } from "~/components/MAccordion";
import {
  Corpus,
  CorpusAggregateAudio,
  CorpusAggregateXML,
  aggregateCorpusAudio,
  aggregateCorpusXML,
  getCorpusIdsFromIndex,
} from "~/services/IndexService";
import { CorpusAccordionAudio } from "~/routes/index/CorpusAccordionAudio";
import { SearchHit } from "@elastic/elasticsearch/lib/api/types";

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

  const corpusesXML = elastic.search<Corpus>({
    index: "corpuses",
    body: {
      query: {
        ids: {
          values: songCorpusIds,
        },
      },
    },
  });

  const corpusesAudio = elastic.search<Corpus>({
    index: "corpuses",
    body: {
      query: {
        ids: {
          values: audioCorpusIds,
        },
      },
    },
  });

  return {
    allSongsCount: allDocumentsCount,
    allCorpusesCount: allCorpusesCount.count,
    corpusAggregatesXML,
    corpusAggregatesAudio,
    corpusesXML: (await corpusesXML).hits.hits,
    corpusesAudio: (await corpusesAudio).hits.hits,
  };
};

export default function Index() {
  const {
    allSongsCount,
    allCorpusesCount,
    corpusAggregatesXML,
    corpusAggregatesAudio,
    corpusesXML,
    corpusesAudio,
  } = useLoaderData<typeof loader>();
  const { t } = useTranslation("index");

  const xmlAggregates = corpusAggregatesXML.map(
    (corpus: CorpusAggregateXML) => (
      <CorpusAccordionXML
        key={corpus.corpusId}
        corpusAgg={corpus}
        corpusInfo={corpusesXML.find(
          (x: SearchHit<Corpus>) => x._id == corpus.corpusId,
        )}
      />
    ),
  );

  const audioAggregates = corpusAggregatesAudio.map(
    (corpus: CorpusAggregateAudio) => (
      <CorpusAccordionAudio
        key={corpus.corpusId}
        corpus={corpus}
        corpusInfo={corpusesAudio.find(
          (x: SearchHit<Corpus>) => x._id == corpus.corpusId,
        )}
      />
    ),
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
        <MarkdownLinkRenderer text={t("projectDescription")} />
      </Typography>
      {/* <MAccordion title={t("allStatsTitle")}> */}
      {/*   <Grid container spacing={1}> */}
      {/*     <Grid item xs="auto"> */}
      {/*       <InfoCard title={t("totalSongs")} value={allSongsCount} /> */}
      {/*     </Grid> */}
      {/*     <Grid item xs="auto"> */}
      {/*       <InfoCard title={t("totalCorpuses")} value={allCorpusesCount} /> */}
      {/*     </Grid> */}
      {/*   </Grid> */}
      {/* </MAccordion> */}
      <Stack>
        {xmlAggregates}
        {audioAggregates}
      </Stack>
    </>
  );
}

