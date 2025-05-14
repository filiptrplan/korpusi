import { Grid, Typography } from "@mui/material";
import { SearchHit } from "@elastic/elasticsearch/lib/api/types";
import {
  BarElement,
  CategoryScale,
  Chart,
  ChartData,
  ChartDataset,
  Colors,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from "chart.js";
import { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import { useTranslation } from "react-i18next";
import { InfoCard } from "~/components/InfoCard";
import { MAccordion } from "~/components/MAccordion";
import { Corpus, CorpusAggregateAudio } from "~/services/IndexService";
import { getColorHex } from "~/utils/helpers";

interface CorpusAccordionAudioProps {
  corpus: CorpusAggregateAudio;
  corpusInfo: SearchHit<Corpus>;
}

Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Colors
);

const colorArrayFromLength = (n: number): string[] => {
  const colors = [];
  for (let i = 0; i < n; i++) {
    colors.push(getColorHex(i));
  }
  return colors;
};

export const CorpusAccordionAudio: React.FC<CorpusAccordionAudioProps> = ({
  corpus,
  corpusInfo,
}) => {
  const corpusInfoSource = corpusInfo._source!;
  const { t } = useTranslation("index");

  const tempoHistogramData: ChartData<"bar"> = useMemo(() => {
    const tempoHistogramLabels = corpus.tempoBuckets.map((x) =>
      x.key.toString()
    );
    const tempoHistogramDatapoints = corpus.tempoBuckets.map(
      (x) => x.doc_count
    );
    return {
      labels: tempoHistogramLabels,
      datasets: [
        {
          data: tempoHistogramDatapoints,
          backgroundColor: colorArrayFromLength(
            tempoHistogramDatapoints.length
          ),
        },
      ],
    };
  }, [corpus.tempoBuckets]);

  return (
    <MAccordion title={corpusInfoSource.corpus_name ?? t("unknownName")}>
      <Grid container spacing={1}>
        {corpusInfoSource.license && (
          <>
            <Grid item xs={12}>
              <Typography variant="h6">{t("license")}</Typography>
              <Typography variant="body1"><strong>{t("licenseURL")}: </strong>
                <a href={corpusInfoSource.license.url}>{corpusInfoSource.license.url}</a>
              </Typography>
              <Typography variant="body1"><div dangerouslySetInnerHTML={{ __html: corpusInfoSource.license.description }} /></Typography>
            </Grid>
          </>
        )}
        {corpusInfoSource.description && (
          <>
            <Grid item xs={12}>
              <Typography variant="h6">{t("description")}</Typography>
              <Typography variant="body1"><div dangerouslySetInnerHTML={{ __html: corpusInfoSource.description}} /></Typography>
            </Grid>
          </>
        )}
        <Grid item xs={12}>
          <Typography variant="h6">{t("corpusStatsTitle")}</Typography>
        </Grid>
        <Grid item xs="auto">
          <InfoCard title={t("songsCountCorpus")} value={corpus.songCount} />
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h6">{t("histogramTempoTitle")}</Typography>
        </Grid>
        <Grid item xs={12}>
          <Bar
            data={tempoHistogramData}
            options={{
              plugins: {
                legend: {
                  display: false,
                },
              },
              scales: {
                y: {
                  title: {
                    text: t("numberOfWorks"),
                    display: true
                  },
                },
                x: {
                  title: {
                    text: t("tempoXLabel"),
                    display: true
                  }
                }
              },
            }}
          />
        </Grid>
      </Grid>
    </MAccordion>
  );
};
