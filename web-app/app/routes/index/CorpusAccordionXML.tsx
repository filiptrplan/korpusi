import { Typography, Grid } from "@mui/material";
import { InfoCard } from "~/components/InfoCard";
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
import { MAccordion } from "~/components/MAccordion";
import { useKeyTranslate } from "~/utils/notes";
import { getColorHex } from "~/utils/helpers";
import { Corpus, CorpusAggregateXML } from "~/services/IndexService";
import { SearchHit } from "@elastic/elasticsearch/lib/api/types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Colors,
);

interface CorpusAccordionXMLProps {
  corpusAgg: CorpusAggregateXML;
  corpusInfo: SearchHit<Corpus>;
}

export const CorpusAccordionXML: React.FC<CorpusAccordionXMLProps> = ({
  corpusAgg,
  corpusInfo
}) => {
  const { t } = useTranslation("index");
  const corpusInfoSource = corpusInfo._source!;

  const metrumDatasets: ChartData<"bar"> = {
    datasets: [
      {
        data: corpusAgg.metrumBuckets.map((bucket) => bucket.doc_count),
        backgroundColor: corpusAgg.metrumBuckets.map((_, i) => getColorHex(i)),
      },
    ],
    labels: corpusAgg.metrumBuckets.map((bucket) => bucket.key),
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

  const tKeys = useKeyTranslate();
  const keyDatasets: ChartData<"bar"> = {
    datasets: [
      {
        data: corpusAgg.keysBuckets.map((bucket) => bucket.doc_count),
        backgroundColor: corpusAgg.keysBuckets.map((_, i) => getColorHex(i)),
      },
    ],
    labels: corpusAgg.keysBuckets.map((bucket) => tKeys(bucket.key)),
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
          <InfoCard title={t("songsCountCorpus")} value={corpusAgg.songCount} />
        </Grid>
        <Grid item xs="auto">
          <InfoCard
            title={t("composersCountCorpus")}
            value={corpusAgg.composersCount}
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
          <InfoCard title={t("ambitusMin")} value={corpusAgg.ambitusStats.min} />
        </Grid>
        <Grid item xs={"auto"}>
          <InfoCard title={t("ambitusMax")} value={corpusAgg.ambitusStats.max} />
        </Grid>
        <Grid item xs={"auto"}>
          <InfoCard
            title={t("ambitusAvg")}
            value={corpusAgg.ambitusStats.avg?.toFixed(1)}
          />
        </Grid>
      </Grid>
    </MAccordion>
  );
};
