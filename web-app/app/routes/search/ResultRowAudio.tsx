
import { AudioResult, } from "~/src/DataTypes";
import { SearchHit } from "@elastic/elasticsearch/lib/api/types";
import { InfoCard } from "~/components/InfoCard";
import { useTranslation } from "react-i18next";
import { SearchType } from "~/routes/search";
import { ResultRow } from "~/routes/search/ResultRow";

export interface ResultRowAudioProps {
  audioHit: SearchHit<AudioResult>;
  corpusOptions?: { value: string; label: string }[];
}

export const ResultRowAudio: React.FC<ResultRowAudioProps> = ({
  audioHit,
  corpusOptions,
}) => {
  const song = audioHit._source!;

  const { t } = useTranslation("search");

  return (
    <ResultRow
      title={song.metadata.title}
      titleMissingMessage={t("noTitle")}
      subtitleMissingMessage={""}
      searchHit={audioHit}
      type={SearchType.Audio}
      corpusOptions={corpusOptions}
    >
      <InfoCard
        title={t("tempoBPM")}
        value={song.bpm.essentia_multifeature.bpm}
        sx={{
          display: {
            xs: "none",
            lg: "block",
          },
        }}
      />
    </ResultRow>
  );
};
