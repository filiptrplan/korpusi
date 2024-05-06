import { Card, CardContent, CardHeader, Typography } from "@mui/material";
import { useContext, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { SongResult } from "~/src/DataTypes";
import { SongContext } from "../xml.$id";

export const MetadataCard: React.FC = () => {
  const song = useContext(SongContext);
  const { metadata } = song;
  const { t } = useTranslation("xml");

  // The values are the translation keys
  const metadataLabels: Partial<Record<keyof SongResult["metadata"], string>> =
    {
      composer: t("composer"),
      lyricist: t("lyricist"),
      title: t("titleSong"),
    };

  const metadataList = useMemo(() => {
    const filteredMetadata = Object.entries(metadataLabels).filter(
      ([key, _value]) => {
        return (
          Object.keys(metadataLabels).includes(key) &&
          typeof metadata[key as keyof SongResult["metadata"]] !== "undefined"
        );
      },
    );
    return filteredMetadata.map(([key, value], i) => {
      return (
        <Typography
          key={key}
          sx={{
            mb: i === filteredMetadata.length - 1 ? -1 : 0,
          }}
        >
          <strong>{value}</strong>:{" "}
          {metadata[key as keyof SongResult["metadata"]]}
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
      <CardHeader title={t("metadataCardTitle")} />
      <CardContent>{metadataList}</CardContent>
    </Card>
  );
};
