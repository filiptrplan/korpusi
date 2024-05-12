import { Grid, Typography } from "@mui/material";
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
import { CorpusAggregateAudio } from "~/services/IndexService";
import { getColorHex } from "~/utils/helpers";

interface CorpusAccordionAudioProps {
  corpus: CorpusAggregateAudio;
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
}) => {
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
    <MAccordion title={corpus.corpusName}>
      <Grid container spacing={1}>
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
                x: {
                  title: {
                    text: t("numberOfWorks"),
                    display: true
                  },
                },
                y: {
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
