import { useContext, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AudioContext } from "~/routes/audio.$id";
import annotationPlugin, { AnnotationOptions } from "chartjs-plugin-annotation";
import {
  CategoryScale,
  Chart,
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
import {
  Checkbox,
  FormControlLabel,
  FormGroup,
  MenuItem,
  Select,
  Slider,
  Stack,
  Typography,
} from "@mui/material";
import { AudioResult } from "~/src/DataTypes";

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

const getRGB = (i: number) => chartColorsRGB[i % chartColorsRGB.length];

interface GraphAudioProps {
  audioResults: AudioResult[];
}
export const GraphAudio: React.FC<GraphAudioProps> = ({ audioResults }) => {
  // get longest duration
  const duration = audioResults
    .map((x) => x.sample_rate.file_info.duration)
    .reduce((prev, curr) => Math.max(prev, curr));

  const { t } = useTranslation("audio");
  const [xRange, setXRange] = useState([0, duration]);

  const makeBeatTickAnnotations = (audio: AudioResult): AnnotationOptions[] => {
    const beatTicks = audio.bpm.essentia_multifeature.beat_ticks;
    return beatTicks.map((tick) => {
      return {
        type: "line",
        xMin: tick,
        xMax: tick,
        borderColor: "rgba(255, 0, 0, 0.2)",
        borderWidth: 2,
      };
    });
  };

  const makeChordAnnotations = (audio: AudioResult): AnnotationOptions[] => {
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
          content:
            chord.name == "N" ? t("graphAudio.unknownChord") : chord.name,
          display:
            // Display the label if the chord is big enough depending on the zoom
            (chord.end - chord.start) / (xRange[1] - xRange[0]) >= 0.03
              ? true
              : false,
          position: "start",
        },
      };
    });
  };

  const makePitchContourData = (audio: AudioResult) => {
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
        `${audio.metadata.title} - ${t("graphAudio.voiceContour")}`
      ),
      makePitchContourDataset(
        pesto.pitch_contour_hz_instrumental,
        `${audio.metadata.title} - ${t("graphAudio.instrumentalContour")}`
      ),
    ];
  };

  const [enableBeatTicks, setEnableBeatTicks] = useState(false);
  const [enableChords, setEnableChords] = useState(false);

  const [selectedResultIndexes, setSelectedResultIndexes] = useState<number[]>(
    Array.from({ length: audioResults.length }).map((_, i) => i)
  );

  const toggleIndex = (i: number, checked: boolean) => {
    if (checked) {
      setSelectedResultIndexes((prev) => [...prev, i]);
    } else {
      setSelectedResultIndexes((prev) => {
        const newSet = [...new Set(prev)];
        newSet.splice(newSet.indexOf(i), 1);
        return newSet;
      });
    }
  };

  const beatTickAnnotations = useMemo(
    () => audioResults.map(makeBeatTickAnnotations),
    [audioResults]
  );

  const chordAnnotations = useMemo(
    () => audioResults.map(makeChordAnnotations),
    [audioResults]
  );

  const pitchContour = useMemo(
    () => audioResults.map(makePitchContourData),
    [audioResults]
  );

  const charts = useMemo(() => {
    return selectedResultIndexes.map((ind) => {
      const annotations: AnnotationOptions[] = [];

      if (enableBeatTicks) {
        annotations.push(...beatTickAnnotations[ind]);
      }
      if (enableChords) {
        annotations.push(...chordAnnotations[ind]);
      }

      return (
        <Line
          key={ind}
          data={{
            datasets: pitchContour[ind],
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
                annotations: annotations,
              },
              decimation: {
                enabled: true,
                algorithm: "lttb",
                threshold: 500,
                samples: 500,
              },
            },
            indexAxis: "x",
            scales: {
              y: {
                title: {
                  display: true,
                  text: t("graphAudio.hzLabel"),
                },
              },
              x: {
                title: {
                  display: true,
                  text: t("graphAudio.timeLabel"),
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
      );
    });
  }, [
    enableBeatTicks,
    enableChords,
    selectedResultIndexes,
    xRange,
    setXRange,
    chordAnnotations,
    beatTickAnnotations,
    pitchContour,
  ]);

  return (
    <>
      {audioResults.length > 1 && (
        <Stack direction="row" alignItems="center">
          <Typography>Prikazane pesmi:</Typography>
          <FormGroup row>
            {audioResults.map((result, i) => {
              return (
                <FormControlLabel
                  key={i}
                  label={result.metadata.title}
                  control={
                    <Checkbox
                      defaultChecked={true}
                      value={i in selectedResultIndexes}
                      onChange={(e) => toggleIndex(i, e.target.checked)}
                    />
                  }
                />
              );
            })}
          </FormGroup>
        </Stack>
      )}
      <FormGroup row>
        <FormControlLabel
          label={t("graphAudio.displayBeatTicks")}
          control={
            <Checkbox
              value={enableBeatTicks}
              onChange={(e) => {
                setEnableBeatTicks(e.target.checked);
              }}
            />
          }
        />
        <FormControlLabel
          label={t("graphAudio.displayChords")}
          control={
            <Checkbox
              value={enableChords}
              onChange={(e) => {
                setEnableChords(e.target.checked);
              }}
            />
          }
        />
      </FormGroup>
      <Stack direction="row" spacing={3} alignItems="center">
        <Typography id="span-seconds" noWrap flexShrink={0}>
          {t("graphAudio.spanInSeconds")}
        </Typography>
        <Slider
          value={xRange}
          onChange={(_, v) => {
            const min = (v as number[])[0];
            const max = (v as number[])[1];
            setXRange([min, Math.max(max, min+5)])
          }}
          valueLabelDisplay="auto"
          aria-labelledby="span-seconds"
          min={0}
          max={duration}
        />
      </Stack>
      {charts}
    </>
  );
};
