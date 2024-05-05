import { useTranslation } from "react-i18next";
import { FilterGroupCollapse } from "~/routes/search/FilterGroupCollapse";
import { Stack } from "@mui/material";
import { MetadataSelect } from "~/routes/search/MetadataSelect";
import { CorpusSelect } from "~/routes/search/CorpusSelect";
import { useMemo } from "react";

interface SearchFiltersAudioProps {
  params: Record<string, string>;
  corpusOptions: { value: string; label: string }[] | undefined;
}

export const SearchFiltersAudio: React.FC<SearchFiltersAudioProps> = ({
  params,
  corpusOptions,
}) => {
  const { t } = useTranslation("search");
  const metadataOptions = useMemo(() => {
    return [
      {
        value: "title",
        label: t("metadataTitle"),
      },
      {
        value: "URL",
        label: t("metadataURL")
      }
    ];
  }, [t]);
  return (
    <>
      <FilterGroupCollapse
        title={t("metadataFilters")}
        defaultCollapsed={false}
      >
        <Stack
          direction={{
            sm: "column",
            md: "row",
          }}
        >
          <MetadataSelect
            metadataFields={params.metadataFields}
            metadataQuery={params.metadataQuery}
            metadataOptions={metadataOptions}
          />
          <CorpusSelect corpus={params.corpus} corpusOptions={corpusOptions} />
        </Stack>
      </FilterGroupCollapse>
    </>
  );
};
