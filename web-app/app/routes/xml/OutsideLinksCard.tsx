import { Card, CardContent, CardHeader } from "@mui/material";
import { useTranslation } from "react-i18next";

export const OutsideLinksCard: React.FC = () => {
  const { t } = useTranslation("xml");
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
