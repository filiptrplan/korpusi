import { useTranslation } from "react-i18next";
import { FilterGroupCollapse } from "~/routes/search/FilterGroupCollapse";
import { Grid, Stack } from "@mui/material";
import { MetadataSelect } from "~/routes/search/MetadataSelect";
import { CorpusSelect } from "~/routes/search/CorpusSelect";
import { KeySelect } from "~/routes/search/KeySelect";
import { TimeSignatureSelect } from "~/routes/search/TimeSignatureSelect";
import { TempoSlider } from "~/routes/search/TempoSlider";
import { NoteRangeSlider } from "~/routes/search/NoteRangeSlider";
import { AmbitusSlider } from "~/routes/search/AmbitusSlider";
import { RhythmNgramSearch } from "~/routes/search/RhythmNgramSearch";
import { MelodicNgramSearch } from "~/routes/search/MelodicNgramSearch";

interface SearchFiltersXMLProps {
  params: Record<string, string>;
  corpusOptions: { value: string; label: string }[] | undefined;
  availableTimeSignatures: string[] | undefined;
}

export const SearchFiltersXML: React.FC<SearchFiltersXMLProps> = ({
  availableTimeSignatures,
  corpusOptions,
  params,
}) => {
  const { t } = useTranslation("search");
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
          />
          <CorpusSelect corpus={params.corpus} corpusOptions={corpusOptions} />
        </Stack>
      </FilterGroupCollapse>
      <FilterGroupCollapse title={t("basicFilters")}>
        <Grid container spacing={1}>
          <Grid item xs="auto">
            <KeySelect
              keyValue={params.key}
              alternativeKeys={params.alternativeKeys}
            />
          </Grid>
          <Grid item xs={12} sm="auto">
            <TimeSignatureSelect
              availableTimeSignatures={availableTimeSignatures}
              timeSignature={params.timeSignature}
            />
          </Grid>
          <Grid item xs="auto" md={12}>
            <TempoSlider
              tempoFrom={params.tempoFrom}
              tempoTo={params.tempoTo}
              useTempo={params.useTempo}
            />
          </Grid>
        </Grid>
      </FilterGroupCollapse>
      <FilterGroupCollapse title={t("ambitusFilters")}>
        <Stack direction="column" spacing={1}>
          <NoteRangeSlider
            noteFrom={params.noteHighestFrom}
            noteTo={params.noteHighestTo}
            label={t("highestNote")}
            nameFrom="noteHighestFrom"
            nameTo="noteHighestTo"
          />
          <NoteRangeSlider
            noteFrom={params.noteLowestFrom}
            noteTo={params.noteLowestTo}
            label={t("lowestNote")}
            nameFrom="noteLowestFrom"
            nameTo="noteLowestTo"
          />
          <AmbitusSlider
            ambitusFrom={params.ambitusFrom}
            ambitusTo={params.ambitusTo}
          />
        </Stack>
      </FilterGroupCollapse>
      <FilterGroupCollapse title={t("patternFilters")}>
        <Stack
          direction={{
            xs: "column",
            md: "row",
          }}
          spacing={1}
        >
          <RhythmNgramSearch rhythmNgram={params.rhythmNgram} />
          <MelodicNgramSearch
            melodicNgram={params.melodicNgram}
            melodicNgramRelative={params.melodicNgramRelative}
          />
        </Stack>
      </FilterGroupCollapse>
    </>
  );
};
