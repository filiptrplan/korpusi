import { useContext, useMemo, useState } from "react";
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
  ChartDataset,
  Colors,
  Decimation,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { chartColorsRGB, secondsToString } from "~/src/helpers";
import { Checkbox, Slider, Stack, Typography } from "@mui/material";
import { CheckBox } from "@mui/icons-material";

Chart.register(annotationPlugin);
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Colors,
  Decimation
);

const colorFromChordName = (chordName: string, opacity: number) => {
  if (chordName == "N") {
    return `rgba(0,0,0,${opacity}`;
  }
  const hashCode = (str: string) => {
    let hash = 0;
    if (str.length === 0) {
      return hash;
    }
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  };

  const intHash = hashCode(chordName);
  const r = (intHash & 0xff0000) >> 16;
  const g = (intHash & 0x00ff00) >> 8;
  const b = intHash & 0x0000ff;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export const GraphAudio: React.FC = () => {
  const audio = useContext(AudioContext);
  const duration = audio.sample_rate.file_info.duration;
  const { t } = useTranslation("audio");
  const [xRange, setXRange] = useState([0, duration]);

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

  const chordAnnotations = useMemo<AnnotationOptions[]>(() => {
    const chords = audio.chords.autochord.chord_start.map((start, i) => {
      return {
        start,
        end: audio.chords.autochord.chord_end[i],
        name: audio.chords.autochord.chord_name[i],
      };
    });
    return chords.map((chord) => {
      return {
        type: "box",
        xMin: chord.start,
        xMax: chord.end,
        backgroundColor: colorFromChordName(chord.name, 0.15),
        label: {
          content: chord.name == "N" ? t("unknownChord") : chord.name,
          display:
            // Display the label if the chord is big enough depending on the zoom
            (chord.end - chord.start) / (xRange[1] - xRange[0]) >= 0.03
              ? true
              : false,
          position: "start",
        },
      };
    });
  }, [audio.chords.autochord, xRange, t]);

  const pitchContourData = useMemo<ChartDataset<"line">[]>(() => {
    const pesto = audio.pitch_contour.pesto;
    const timestep = pesto.time_step_ms;
    const makePitchContourDataset = (
      datapoints: number[],
      title: string
    ): ChartDataset<"line"> => {
      return {
        label: title,
        data: datapoints.map((val, i) => {
          return {
            x: i * (timestep / 1000),
            y: val,
          };
        }),
      };
    };
    return [
      makePitchContourDataset(
        pesto.pitch_contour_hz_voice,
        `${audio.metadata.title} - ${t("voiceContour")}`
      ),
      makePitchContourDataset(
        pesto.pitch_contour_hz_instrumental,
        `${audio.metadata.title} - ${t("instrumentalContour")}`
      ),
    ];
  }, [audio.pitch_contour.pesto, t]);

  const [enableBeatTicks, setEnableBeatTicks] = useState(false);
  const [enableChords, setEnableChords] = useState(false);

  const makeAnnotations = () => {
    const annotations = [];
    if(enableBeatTicks) annotations.push(...beatTickAnnotations);
    if(enableChords) annotations.push(...chordAnnotations);
    return annotations;
  }

  return (
    <>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Stack direction="row" alignItems="center" spacing={0}>
          <Typography>{t("displayBeatTicks")}</Typography>
          <Checkbox value={enableBeatTicks} onChange={(e) => {
            setEnableBeatTicks(e.target.checked)
          }}/>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0}>
          <Typography>{t("displayChords")}</Typography>
          <Checkbox value={enableChords} onChange={(e) => {
            setEnableChords(e.target.checked)
          }}/>
        </Stack>
      </Stack>
      <Stack direction="row" spacing={3} alignItems="center">
        <Typography noWrap flexShrink={0}>
          {t("spanInSeconds")}
        </Typography>
        <Slider
          value={xRange}
          onChange={(_, v) => setXRange(v as number[])}
          valueLabelDisplay="auto"
          min={0}
          max={duration}
        />
      </Stack>
      <Line
        data={{
          datasets: [...pitchContourData],
        }}
        options={{
          parsing: false,
          plugins: {
            legend: {
              position: "top" as const,
            },
            colors: {
              enabled: true,
            },
            annotation: {
              annotations: makeAnnotations()
            },
            decimation: {
              enabled: true,
              algorithm: "lttb",
              threshold: 500,
            },
          },
          scales: {
            y: {
              title: {
                display: true,
                text: t("hzLabel"),
              },
            },
            x: {
              title: {
                display: true,
                text: t("timeLabel"),
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
              min: xRange[0],
              max: xRange[1],
            },
          },
        }}
      />
    </>
  );
};
