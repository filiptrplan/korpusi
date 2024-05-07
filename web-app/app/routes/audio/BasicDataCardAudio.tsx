import { Card, CardContent, CardHeader, Grid } from "@mui/material";
import { useContext } from "react";
import { useTranslation } from "react-i18next";
import { InfoCard } from "~/components/InfoCard";
import { AudioContext } from "~/routes/audio.$id";
import { secondsToString } from "~/src/helpers";

export const BasicDataCardAudio: React.FC = () => {
  const audio = useContext(AudioContext);
  const { t } = useTranslation("audio");
  return (
    <Card
      sx={{
        height: "100%",
      }}
    >
      <CardHeader title={t("basicDataCard.title")} />
      <CardContent>
        <Grid container spacing={1}>
          <Grid item>
            <InfoCard
              title={t("basicDataCard.duration")}
              value={secondsToString(audio.sample_rate.file_info.duration)}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};
