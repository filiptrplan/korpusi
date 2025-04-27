import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useControlledState } from "../../utils/useControlledState";
import { useMemo } from "react";

interface EducationalSelectProps {
  eduFilters?: string;
}
export const EducationalSelect: React.FC<EducationalSelectProps> = ({
  eduFilters,
}) => {
  const { t } = useTranslation("search");
  const [eduFilterState, setEduFiltersState] = useControlledState(
    eduFilters?.split(",") || [],
  );

  const eduFilterOptions = useMemo(
    () => [
      {
        value: "VR1",
        label: t("VR1"),
      },
      {
        value: "VR2",
        label: t("VR2"),
      },
      {
        value: "IF1",
        label: t("IF1"),
      },
      {
        value: "IF2",
        label: t("IF2"),
      },
      {
        value: "RF1",
        label: t("RF1"),
      },
      {
        value: "RF2",
        label: t("RF2"),
      },
      {
        value: "RF3",
        label: t("RF3"),
      },
      {
        value: "RF4",
        label: t("RF4"),
      },
    ],
    [t],
  );

  return (
    <>
      <FormControl>
        <InputLabel id="edu-label">{t("educational")}</InputLabel>
        <Select
          labelId="edu-label"
          label={t("educational")}
          name="edu"
          value={eduFilterState}
          sx={{
            minWidth: "10rem",
          }}
          onChange={(e) => {
            setEduFiltersState(e.target.value as string[]);
          }}
          multiple
        >
          {eduFilterOptions?.map((filter) => (
            <MenuItem key={filter.value} value={filter.value}>
              {filter.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </>
  );
};
