import { Card, CardContent, CardHeader, Typography } from "@mui/material";
import { useContext, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { AudioResult } from "~/src/DataTypes";
import { AudioContext } from "~/routes/audio.$id";

export const MetadataCardAudio: React.FC = () => {
  const audio = useContext(AudioContext);
  const { metadata } = audio;
  const { t } = useTranslation("audio");

  // The values are the translation keys
  const metadataLabels: Partial<Record<keyof AudioResult["metadata"], string>> =
    {
      title: t("metadataCard.titleSong"),
      URL: t("metadataCard.URL"),
    };

  const metadataList = useMemo(() => {
    const filteredMetadata = Object.entries(metadataLabels).filter(
      ([key, _value]) => {
        return (
          Object.keys(metadataLabels).includes(key) &&
          typeof metadata[key as keyof AudioResult["metadata"]] !== "undefined"
        );
      }
    );
    return filteredMetadata.map(([key, title], i) => {
      const value = metadata[key as keyof AudioResult["metadata"]];
      const inner = key === "URL" ? <a href={value}>{value}</a> : value;
      return (
        <Typography
          key={key}
          sx={{
            mb: i === filteredMetadata.length - 1 ? -1 : 0,
          }}
        >
          <strong>{title}</strong>: {inner}
        </Typography>
      );
    });
  }, [metadata, metadataLabels]);

  return (
    <Card
      sx={{
        height: "100%",
      }}
    >
      <CardHeader title={t("metadataCard.title")} />
      <CardContent>{metadataList}</CardContent>
    </Card>
  );
};
