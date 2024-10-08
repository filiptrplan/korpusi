import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
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
  LogarithmicScale,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { chartColorsRGB, secondsToString } from "~/utils/helpers";
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
import { midiData } from "~/routes/audio/MidiData";

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
  Decimation,
  LogarithmicScale
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

const calculateMovingMedian = (
  data: number[],
  windowSize: number
): number[] => {
  let index = windowSize - 1;
  const length = data.length + 1;
  const results = [];

  while (index < length) {
    index = index + 1;
    const intervalSlice = data.slice(index - windowSize, index);
    intervalSlice.sort((a, b) => a - b);
    const middle = Math.floor(intervalSlice.length / 2);

    let median;
    if (intervalSlice.length % 2 === 0) {
      median = (intervalSlice[middle - 1] + intervalSlice[middle]) / 2;
    } else {
      median = intervalSlice[middle];
    }

    results.push(median);
  }

  return results;
};

const calculateMovingAverage = (
  data: number[],
  windowSize: number
): number[] => {
  let index = windowSize - 1;
  const length = data.length + 1;
  const results = [];

  while (index < length) {
    index = index + 1;
    const intervalSlice = data.slice(index - windowSize, index);
    const sum = intervalSlice.reduce((prev, curr) => prev + curr, 0);
    results.push(sum / windowSize);
  }

  return results;
};

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

  const [smoothing, setSmoothing] = useState(0);

  const totalVoiceRMS = useMemo(() => {
    const loudness = audioResults.map((audio) => {
      return audio.loudness.rms.loudness_vocals;
    });
    const lengths = loudness.map((loud) => loud.length);
    const squares = loudness.map((loud) => loud.map((val) => val ** 2));
    const rms = squares.map((square, i) => {
      const sum = square.reduce((prev, curr) => prev + curr, 0);
      return Math.sqrt(sum / lengths[i]);
    });
    return rms;
  }, [audioResults]);

  const totalInstrumentalRMS = useMemo(() => {
    const loudness = audioResults.map((audio) => {
      return audio.loudness.rms.loudness_instrumental;
    });
    const lengths = loudness.map((loud) => loud.length);
    const squares = loudness.map((loud) => loud.map((val) => val ** 2));
    const rms = squares.map((square, i) => {
      const sum = square.reduce((prev, curr) => prev + curr, 0);
      return Math.sqrt(sum / lengths[i]);
    });
    return rms;
  }, [audioResults]);

  console.log(totalVoiceRMS, totalInstrumentalRMS);

  const makePitchContourData = (audio: AudioResult, voiceRms: number, instrumentalRms: number) => {
    const cullingRMSThreshold = 0.3;
    const pesto = audio.pitch_contour.pesto;
    const timestep = pesto.time_step_ms;

    const makePitchContourDataset = (
      datapoints: number[],
      title: string,
      type: "instrumental" | "voice"
    ): ChartDataset<"line"> => {
      const datapointsSmoothed = calculateMovingMedian(
        datapoints,
        smoothing + 1
      );
      const dataPointsWithTime = datapointsSmoothed.map((val, i) => {
        return {
          x: i * (timestep / 1000),
          y: val,
        };
      });
      const datapointFilteredRMS = dataPointsWithTime.map((data, i) => {
        // Find the closest RMS value of the datapoint
        const rms = audio.loudness.rms;
        const rmsIndex = Math.round(data.x / rms.timestep_seconds);
        const rmsValue =
          type == "voice"
            ? rms.loudness_vocals[rmsIndex]
            : rms.loudness_instrumental[rmsIndex];
        return {
          x: data.x,
          y: rmsValue > cullingRMSThreshold * (type == "voice" ? voiceRms : instrumentalRms) ? data.y : Number.NaN,
        };
      });
      return {
        label: title,
        data: datapointFilteredRMS,
      };
    };

    return [
      makePitchContourDataset(
        pesto.pitch_contour_hz_voice,
        t("graphAudio.voiceContour"),
        "voice"
      ),
      makePitchContourDataset(
        pesto.pitch_contour_hz_instrumental,
        t("graphAudio.instrumentalContour"),
        "instrumental"
      ),
    ];
  };

  const makeLoudnessData = (audio: AudioResult): ChartDataset<"line">[] => {
    const rms = audio.loudness.rms;

    const makeLoudnessDataset = (
      data: number[],
      title: string
    ): ChartDataset<"line"> => {
      return {
        label: title,
        hidden: true,
        yAxisID: "y2",
        data: data.map((val, i) => {
          return {
            y: val,
            x: i * rms.timestep_seconds,
          };
        }),
      };
    };

    return [
      makeLoudnessDataset(rms.loudness_total, t("graphAudio.loudnessTotal")),
      makeLoudnessDataset(rms.loudness_vocals, t("graphAudio.loudnessVocals")),
      makeLoudnessDataset(
        rms.loudness_instrumental,
        t("graphAudio.loudnessInstrumental")
      ),
    ];
  };

  const [enableBeatTicks, setEnableBeatTicks] = useState(false);
  const [enableChords, setEnableChords] = useState(false);
  const [enableMidiAxis, setEnableMidiAxis] = useState(false);

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
    [audioResults, xRange]
  );

  const datasets = useMemo(
    () =>
      audioResults.map((audio, i) => {
        return [...makePitchContourData(audio, totalVoiceRMS[i], totalInstrumentalRMS[i]), ...makeLoudnessData(audio)];
      }),
    [audioResults, smoothing]
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
            datasets: datasets[ind],
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
                algorithm: "min-max",
                threshold: 100,
              },
            },
            elements: {
              line: {
                spanGaps: 0.1,
              },
            },
            indexAxis: "x",
            scales: {
              y: {
                title: {
                  display: true,
                  text: enableMidiAxis
                    ? t("graphAudio.midiLabel")
                    : t("graphAudio.hzLabel"),
                },
                ticks: {
                  display: true,
                  callback: (value) => {
                    if (!enableMidiAxis) return value;
                    const note = midiData.find(
                      (midi) => midi.frequency == value
                    );
                    if (note) {
                      return note.note;
                    } else {
                      return value;
                    }
                  },
                },
                afterBuildTicks: (scale) => {
                  if (!enableMidiAxis) return;
                  scale.ticks = midiData
                    .filter((midi) => midi.frequency > 100)
                    .map((midi) => {
                      return {
                        value: midi.frequency,
                        label: midi.note,
                      };
                    });
                },
              },
              y2: {
                title: {
                  display: true,
                  text: t("graphAudio.RMSlabel"),
                },
                ticks: {
                  callback: (value) => {
                    if (typeof value == "string") {
                      return value;
                    } else {
                      return `${Math.round((value - 1) * 60)} dB`;
                    }
                  },
                },
                position: "right",
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
    enableMidiAxis,
    enableChords,
    selectedResultIndexes,
    xRange,
    setXRange,
    chordAnnotations,
    beatTickAnnotations,
    datasets,
    smoothing,
  ]);

  return (
    <>
      {audioResults.length > 1 && (
        <Stack direction="row" alignItems="center">
          <Typography>{t("graphAudio.selectedSongs")}</Typography>
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
        <FormControlLabel
          label={t("graphAudio.useMidiAxis")}
          control={
            <Checkbox
              value={enableMidiAxis}
              onChange={(e) => {
                setEnableMidiAxis(e.target.checked);
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
            setXRange([min, Math.max(max, min + 5)]);
          }}
          valueLabelDisplay="auto"
          aria-labelledby="span-seconds"
          min={0}
          max={duration}
        />
      </Stack>
      <Stack direction="row" spacing={3} alignItems="center">
        <Typography id="smoothing" noWrap flexShrink={0}>
          {t("graphAudio.smoothing")}
        </Typography>
        <Slider
          value={smoothing}
          onChange={(_, v) => {
            setSmoothing(v as number);
          }}
          valueLabelDisplay="auto"
          aria-labelledby="smoothing"
          min={0}
          max={100}
        />
      </Stack>
      {charts}
    </>
  );
};
