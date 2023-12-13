import { Button, Paper, Slide, Stack, Typography } from "@mui/material";
import { useNavigate, useSearchParams } from "@remix-run/react";
import { useContext } from "react";
import { useTranslation } from "react-i18next";

interface CompareOverlayProps {
  onCompareClick: () => void;
}

export const CompareOverlay: React.FC<CompareOverlayProps> = ({
  onCompareClick,
}) => {
  const { t } = useTranslation("search");
  const [params, setParams] = useSearchParams();
  const compareIds = params.get("compareIds")?.split(",") || [];

  const onRemoveAll = () => {
    setParams((params) => {
      params.delete("compareIds");
      return params;
    });
  };

  return (
    <Stack
      direction={"row"}
      justifyContent={"space-between"}
      alignItems={"center"}
    >
      <Typography variant="body1" fontSize={"1.05rem"}>
        {t("youHaveAddedNItemsToCompare", { count: compareIds.length })}
      </Typography>
      <Stack direction="row" spacing={1}>
        <Button variant="contained" onClick={onCompareClick}>
          {t("compare")}
        </Button>
        <Button variant="text" onClick={onRemoveAll}>
          {t("removeAll")}
        </Button>
      </Stack>
    </Stack>
  );
};
