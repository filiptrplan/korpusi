import { Container, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

export default function AboutPage() {
  const { t } = useTranslation("about");

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        {t("title")}
      </Typography>
      <Typography variant="body1">
        {t("description")}
      </Typography>
    </Container>
  );
}
