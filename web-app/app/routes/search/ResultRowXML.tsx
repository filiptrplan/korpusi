import { SongResult } from "~/src/DataTypes";
import { SearchHit } from "@elastic/elasticsearch/lib/api/types";
import { InfoCard } from "~/components/InfoCard";
import { useTranslation } from "react-i18next";
import { midiToNote, useKeyTranslate } from "~/utils/notes";
import { SearchType } from "~/routes/search";
import { ResultRow } from "~/routes/search/ResultRow";

export interface ResultRowXMLProps {
  songHit: SearchHit<SongResult>;
  corpusOptions?: { value: string; label: string }[];
}

export const ResultRowXML: React.FC<ResultRowXMLProps> = ({
  songHit,
  corpusOptions,
}) => {
  const song = songHit._source!;

  const { t } = useTranslation("search");
  const tKeys = useKeyTranslate();

  return (
    <ResultRow
      title={song.metadata.title}
      subtitle={song.metadata.composer}
      titleMissingMessage={t("noTitle")}
      subtitleMissingMessage={t("noComposer")}
      searchHit={songHit}
      type={SearchType.XML}
      corpusOptions={corpusOptions}
    >
      <InfoCard
        sx={{
          display: {
            xs: "none",
            sm: "block",
          },
        }}
        title={t("key")}
        value={tKeys(song.key.most_certain_key)}
      />
      <InfoCard
        sx={{
          display: {
            xs: "none",
            sm: "block",
          },
        }}
        title={t("timeSignature")}
        value={song.time_signature}
      />
      <InfoCard
        title={t("tempoBPM")}
        value={song.tempo}
        sx={{
          display: {
            xs: "none",
            lg: "block",
          },
        }}
      />
      <InfoCard
        sx={{
          display: {
            xs: "none",
            md: "block",
          },
        }}
        title={t("highestNote")}
        value={midiToNote(song.ambitus.max_note)}
      />
      <InfoCard
        sx={{
          display: {
            xs: "none",
            md: "block",
          },
        }}
        title={t("lowestNote")}
        value={midiToNote(song.ambitus.min_note)}
      />
    </ResultRow>
  );
};
