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
      <Typography variant="h5" sx={{ mt: 4 }}>
        {t("sections.musicxml.heading")}
      </Typography>
      <Typography variant="body1">{t("sections.musicxml.text")}</Typography>

      <Typography variant="h5" sx={{ mt: 4 }}>
        {t("sections.rhythm.heading")}
      </Typography>
      <Typography variant="body1">{t("sections.rhythm.text")}</Typography>

      <Typography variant="h5" sx={{ mt: 4 }}>
        {t("sections.audio.heading")}
      </Typography>
      <Typography variant="body1">{t("sections.audio.text")}</Typography>

      <Typography variant="h5" sx={{ mt: 4 }}>
        {t("sections.metadata.heading")}
      </Typography>
      <Typography variant="body1">{t("sections.metadata.text")}</Typography>
    </Container>
  );
}
