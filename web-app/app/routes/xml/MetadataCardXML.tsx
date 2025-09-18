import { Card, CardContent, CardHeader, Typography } from "@mui/material";
import { useContext, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { SongResult } from "~/src/DataTypes";
import { SongContext } from "../xml.$id";

export const MetadataCardXML: React.FC = () => {
  const song = useContext(SongContext);
  const { metadata } = song;
  const { t } = useTranslation("xml");

  // The values are the translations
  const metadataLabels: Partial<Record<keyof SongResult["metadata"], string>> =
    {
      composer: t("composer"),
      lyricist: t("lyricist"),
      title: t("titleSong"),
      year: t("year"),
      collector: t("collector"),
      piece_title: t("piece_title"),
      title_en: t("title_en"),
      publication: t("publication"),
      publication_year: t("publication_year"),
      publication_number: t("publication_number"),
      page: t("page"),
      year_issued: t("year_issued"),

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
