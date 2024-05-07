import { useContext, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { AudioContext } from "~/routes/audio.$id";
import annotationPlugin, {
  AnnotationOptions,
  AnnotationPluginOptions,
} from "chartjs-plugin-annotation";
import {
  CategoryScale,
  Chart,
  ChartData,
  Colors,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  TimeScale,
  Title,
  Tooltip,
} from "chart.js";
import { songsContext } from "~/routes/compare/CompareList";
import { Line } from "react-chartjs-2";
import { secondsToString } from "~/src/helpers";

// const calculateMovingAverage = (
//   data: number[],
//   windowSize: number
// ): number[] => {
//   const movingAverages: number[] = [];
//   for (let i = 0; i < data.length; i++) {
//     let sum = 0;
//     let count = 0;
//     for (
//       let j = i - Math.floor(windowSize / 2);
//       j <= i + Math.floor(windowSize / 2);
//       j++
//     ) {
//       if (j >= 0 && j < data.length) {
//         sum += data[j];
//         count++;
//       }
//     }
//     movingAverages.push(sum / count);
//   }
//   return movingAverages;
// };

Chart.register(annotationPlugin);
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Colors
);

export const GraphAudio: React.FC = () => {
  const audio = useContext(AudioContext);
  const duration = audio.sample_rate.file_info.duration;
  const t = useTranslation("audio");
  // const fakeData = () => {
  //   const initial = Array.from({ length: duration * 10 }, (_, i) => {
  //     return { y: Math.random(), x: i / 10 };
  //   });
  //   const arr = initial.map(({ y }) => y);
  //   const mean = calculateMovingAverage(arr, 100);
  //   return initial.map(({ x }, i) => {
  //     return { x, y: mean[i] };
  //   });
  // };

  const data: ChartData<"line"> = {
    datasets: [
      // {
      //   data: fakeData(),
      // },
    ],
  };

  const beatTickAnnotations = useMemo<AnnotationOptions[]>(() => {
    const beatTicks = audio.bpm.essentia_multifeature.beat_ticks;
    return beatTicks.map((tick) => {
      return {
        type: "line",
        xMin: tick,
        xMax: tick,
        borderColor: "rgba(255,0,0,0.3)",
        borderWidth: 1,
      };
    });
  }, [audio.bpm.essentia_multifeature.beat_ticks]);

  return (
    <>
      <Line
        data={data}
        options={{
          plugins: {
            legend: {
              position: "top" as const,
            },
            colors: {
              enabled: true,
            },
            annotation: {
              annotations: [...beatTickAnnotations],
            },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Čas",
              },
              ticks: {
                maxTicksLimit: 20,
                autoSkip: true,
                callback: (x) => {
                  if (typeof x === "string") {
                    return x;
                  } else {
                    return secondsToString(x);
                  }
                },
              },
              type: "linear",
              min: 0,
              max: duration,
            },
          },
        }}
      />
    </>
  );
};
