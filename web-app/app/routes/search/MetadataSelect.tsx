import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useControlledState } from "./useControlledState";

interface MetadataSelectProps {
  metadataFields?: string;
  metadataQuery?: string;
}

export const MetadataSelect: React.FC<MetadataSelectProps> = ({
  metadataQuery,
  metadataFields,
}) => {
  const { t } = useTranslation("search");
  const [metadataQueryState, setMetadataQueryState] = useControlledState(
    metadataQuery || "",
  );
  const [metadataFieldsState, setMetadataFieldsState] = useControlledState(
    metadataFields?.split(",") ?? ["title", "composer", "lyricist"],
  );
  return (
    <Stack
      spacing={1}
      direction={{
        xs: "column",
        sm: "row",
      }}
    >
      <TextField
        name="metadataQuery"
        label={t("searchByMetadata")}
        variant="outlined"
        id="metadata-query"
        value={metadataQueryState}
        sx={{
          width: "15rem",
        }}
        onChange={(e) => {
          setMetadataQueryState(e.target.value);
        }}
      />
      <FormControl
        sx={{
          width: "15rem",
        }}
      >
        <InputLabel id="metadata-field-label">
          {t("chooseMetadataFields")}
        </InputLabel>
        <Select
          label={t("chooseMetadataFields")}
          labelId="metadata-field-label"
          id="metadata-fields"
          name="metadataFields"
          value={metadataFieldsState}
          onChange={(e) => {
            setMetadataFieldsState(e.target.value as string[]);
          }}
          multiple
        >
          <MenuItem value="title">{t("metadataTitle")}</MenuItem>
          <MenuItem value="composer">{t("metadataComposer")}</MenuItem>
          <MenuItem value="lyricist">{t("metadataLyricist")}</MenuItem>
        </Select>
      </FormControl>
    </Stack>
  );
};
