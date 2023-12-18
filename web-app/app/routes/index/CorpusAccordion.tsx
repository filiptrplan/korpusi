import {
  Accordion,
  AccordionSummary,
  Typography,
  Grid,
  AccordionDetails,
} from "@mui/material";
import ArrowDropDown from "@mui/icons-material/ArrowDropDown";
import { InfoCard } from "~/components/InfoCard";
import { CorpusAggregate } from "../_index";
import { useTranslation } from "react-i18next";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  Colors,
  ChartData,
  BarElement,
  ChartOptions,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { t } from "i18next";
import { MAccordion } from "~/components/MAccordion";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Colors
);

interface CorpusAccordionProps {
  corpus: CorpusAggregate;
}

const getColor = (index: number) => {
  const vibrantColors = [
    "#74c0ff",
    "#ff857c",
    "#a1ffa4",
    "#ffbb56",
    "#ca7aff",
    "#fff172",
  ];
  return vibrantColors[index % vibrantColors.length];
};

export const CorpusAccordion: React.FC<CorpusAccordionProps> = ({ corpus }) => {
  const { t } = useTranslation("index");

  const metrumDatasets: ChartData<"bar"> = {
    datasets: [
      {
        data: corpus.metrumBuckets.map((bucket) => bucket.doc_count),
        backgroundColor: corpus.metrumBuckets.map((_, i) => getColor(i)),
      },
    ],
    labels: corpus.metrumBuckets.map((bucket) => bucket.key),
  };

  const metrumOptions: ChartOptions<"bar"> = {
    plugins: {
      colors: {
        enabled: true,
      },
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        title: {
          display: true,
          text: t("metrumChartYAxis"),
        },
      },
    },
    maintainAspectRatio: false,
  };

  const keyDatasets: ChartData<"bar"> = {
    datasets: [
      {
        data: corpus.keysBuckets.map((bucket) => bucket.doc_count),
        backgroundColor: corpus.keysBuckets.map((_, i) => getColor(i)),
      },
    ],
    labels: corpus.keysBuckets.map((bucket) => bucket.key),
  };

  const keyOptions: ChartOptions<"bar"> = {
    plugins: {
      colors: {
        enabled: true,
      },
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        title: {
          display: true,
          text: t("keyChartYAxis"),
        },
      },
    },
    maintainAspectRatio: false,
  };

  return (
    <MAccordion title={corpus.corpusName}>
      <Grid container spacing={1}>
        <Grid item xs={12}>
          <Typography variant="h6">{t("corpusStatsTitle")}</Typography>
        </Grid>
        <Grid item xs="auto">
          <InfoCard title={t("songsCountCorpus")} value={corpus.songCount} />
        </Grid>
        <Grid item xs="auto">
          <InfoCard
            title={t("composersCountCorpus")}
            value={corpus.composersCount}
          />
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h6">{t("metrumChartTitle")}</Typography>
        </Grid>
        <Grid
          sx={{
            height: 320,
            width: "100%",
          }}
          item
          xs={12}
        >
          <Bar width="100%" data={metrumDatasets} options={metrumOptions} />
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h6">{t("keyChartTitle")}</Typography>
        </Grid>
        <Grid
          sx={{
            height: 320,
            width: "100%",
          }}
          item
          xs={12}
        >
          <Bar width="100%" data={keyDatasets} options={keyOptions} />
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h6">{t("ambitusStatsTitle")}</Typography>
        </Grid>
        <Grid item xs={"auto"}>
          <InfoCard title={t("ambitusMin")} value={corpus.ambitusStats.min} />
        </Grid>
        <Grid item xs={"auto"}>
          <InfoCard title={t("ambitusMax")} value={corpus.ambitusStats.max} />
        </Grid>
        <Grid item xs={"auto"}>
          <InfoCard
            title={t("ambitusAvg")}
            value={corpus.ambitusStats.avg?.toFixed(1)}
          />
        </Grid>
      </Grid>
    </MAccordion>
  );
};
