import { SearchHit } from "@elastic/elasticsearch/lib/api/types";
import {
  CategoryScale,
  Colors,
  LinearScale,
  Title,
  Tooltip,
  Chart as ChartJS,
  ChartData,
  BarElement,
} from "chart.js";
import { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import { useTranslation } from "react-i18next";
import { SongResult } from "~/src/DataTypes";
import { hexToRGB } from "~/utils/helpers";

ChartJS.register(
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Colors,
  BarElement
);

export interface NGramHistogramGraphProps {
  songs: SearchHit<SongResult>;
  type: "pitch" | "rhythm";
  topN: number;
  colorHex?: string;
}

export const NGramHistogramGraph: React.FC<NGramHistogramGraphProps> = ({
  songs,
  type,
  topN,
  colorHex,
}) => {
  const { t } = useTranslation("components");

  const data: ChartData<"bar"> = useMemo(() => {
    const song = songs._source;
    if (!song) {
      return {
        labels: [],
        datasets: [],
      };
    }
    const ngramData =
      type == "pitch"
        ? song.ngram_pitch.frequency_histogram
        : song.ngram_rhythm.frequency_histogram;
    const filteredNgramData: Record<string, number> = {};
    Object.entries(ngramData)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .forEach(([key, value]) => {
        filteredNgramData[key] = value;
      });

    let color;
    if (colorHex) {
      const colors = hexToRGB(colorHex);
      color = `${colors[0]}, ${colors[1]}, ${colors[2]}`;
    }

    return {
      labels: Object.keys(filteredNgramData),
      datasets: [
        {
          data: Object.values(filteredNgramData),
          borderWidth: 2,
          backgroundColor: color ? `rgba(${color}, 0.5)` : undefined,
          borderColor: color ? `rgba(${color}, 1.0)` : undefined,
        },
      ],
    };
  }, [songs, topN]);

  return (
    <Bar
      data={data}
      options={{
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: t("ngrams.numberOfOccurrences"),
            },
          },
          x: {
            title: {
              display: true,
              text:
                type == "pitch"
                  ? t("ngrams.pitchAxis")
                  : t("ngrams.rhythmAxis"),
            },
          },
        },
      }}
    />
  );
};
