import { Button, Paper, Slide, Stack, Typography } from "@mui/material";
import { useSearchParams } from "@remix-run/react";
import { t } from "i18next";
import { useContext } from "react";
import { useTranslation } from "react-i18next";
import { CompareContext } from "../search";

export const CompareOverlay: React.FC = ({}) => {
  const { compareIds, setCompareIds } = useContext(CompareContext);
  const { t } = useTranslation("search");

  const onRemoveAll = () => {
    setCompareIds([]);
  };

  const shouldShow = compareIds.length > 0;

  return (
    <Slide direction="up" in={shouldShow}>
      <Paper
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          m: 2.5,
          px: 3,
          py: 1.5,
          // bgcolor: "text.disabled",
          // color: "background.paper",
          // borderRadius: 0,
        }}
        // variant="outlined"
        elevation={3}
      >
        <Stack
          direction={"row"}
          justifyContent={"space-between"}
          alignItems={"center"}
        >
          <Typography variant="body1" fontSize={"1.05rem"}>
            {t("youHaveAddedNItemsToCompare", { count: compareIds.length })}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="contained">{t("compare")}</Button>
            <Button variant="text" onClick={onRemoveAll}>
              {t("removeAll")}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Slide>
  );
};
