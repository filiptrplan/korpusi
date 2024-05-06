import { Card, CardContent, CardHeader, Stack } from "@mui/material";
import { useContext } from "react";
import { useTranslation } from "react-i18next";
import { InfoCard } from "~/components/InfoCard";
import { useKeyTranslate } from "~/utils/notes";
import { SongContext } from "../xml.$id";

export const BasicDataCard: React.FC = () => {
  const song = useContext(SongContext);
  const { t } = useTranslation("xml");
  const key = useKeyTranslate();
  return (
    <Card
      sx={{
        height: "100%",
      }}
    >
      <CardHeader title={t("basicData.title")} />
      <CardContent>
        <Stack direction="row">
          <InfoCard
            title={t("basicData.key")}
            value={key(song.key.most_certain_key)}
          />
          <InfoCard title={t("basicData.metrum")} value={song.time_signature} />
          <InfoCard title={t("basicData.tempo")} value={song.tempo} />
          <InfoCard
            title={t("basicData.ambitus")}
            value={song.ambitus.ambitus_semitones}
          />
          <InfoCard
            title={t("basicData.durationMeasures")}
            value={song.duration.measures}
          />
        </Stack>
      </CardContent>
    </Card>
  );
};
