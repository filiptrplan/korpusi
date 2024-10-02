import { AppBar, Button, Stack, Toolbar } from "@mui/material";
import { Link } from "@remix-run/react";
import { useContext } from "react";
import { useTranslation } from "react-i18next";
import { localeCookieContext } from "~/root";

export default function Navigation() {
  const locale = useContext(localeCookieContext);
  const switchLocale = async () => {
    const newLocale = locale === "en" ? "sl" : "en";
    await fetch(`/set-locale/${newLocale}`, { method: "POST" });
    window.location.reload();
  };

  const { t } = useTranslation("common");

  return (
    <AppBar position="sticky" elevation={0} variant="outlined">
      <Toolbar>
        <Stack
          direction={"row"}
          width={"100%"}
          justifyContent={"space-between"}
        >
          <Stack direction="row" gap={1}>
            {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
            {/* @ts-expect-error */}
            <Button LinkComponent={Link} color="inherit" to="/">
              {t("navigation.home")}
            </Button>
            {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
            {/* @ts-ignore */}
            <Button LinkComponent={Link} color="inherit" to="/search">
              {t("navigation.search")}
            </Button>
          </Stack>
          <Button color="inherit" onClick={switchLocale}>
            {locale}
          </Button>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
