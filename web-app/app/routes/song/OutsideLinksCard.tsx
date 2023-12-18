import { Card, CardContent, CardHeader } from "@mui/material";
import { useTranslation } from "react-i18next";
import { SongResult } from "~/src/DataTypes";

export const OutsideLinksCard: React.FC = () => {
  const { t } = useTranslation("song");
  return (
    <Card
      sx={{
        height: "100%",
      }}
    >
      <CardHeader title={t("outsideLinks")} />
      <CardContent>Ni zunanjih povezav.</CardContent>
    </Card>
  );
};
