import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useControlledState } from "../../utils/useControlledState";

interface MetadataSelectProps {
  /**
   * Current fields that should be searched
   */
  metadataFields?: string;
  /**
   * The text query
   */
  metadataQuery?: string;
  /**
   * Available fields
   */
  metadataOptions?: { value: string; label: string }[];
}

export const MetadataSelect: React.FC<MetadataSelectProps> = ({
  metadataQuery,
  metadataFields,
  metadataOptions,
}) => {
  const { t } = useTranslation("search");
  const [metadataQueryState, setMetadataQueryState] = useControlledState(
    metadataQuery || "",
  );
  const [metadataFieldsState, setMetadataFieldsState] = useControlledState(
    metadataFields?.split(",") ?? metadataOptions?.map((x) => x.value) ?? [],
  );

  const menuItems = metadataOptions?.map((x) => (
    <MenuItem key={x.value} value={x.value}>
      {x.label}
    </MenuItem>
  ));

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
          {menuItems}
        </Select>
      </FormControl>
    </Stack>
  );
};
