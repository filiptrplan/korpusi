import { AppBar, Button, Stack, Toolbar, Typography } from "@mui/material";
import { Link } from "@remix-run/react";

export default function Navigation() {
  return (
    <AppBar position="sticky" elevation={0} variant="outlined">
      <Toolbar>
        <Stack direction={"row"} gap={1}>
          {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
          {/* @ts-expect-error */}
          <Button LinkComponent={Link} color="inherit" to="/">
            Mladinska glasba
          </Button>
          {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
          {/* @ts-ignore */}
          <Button LinkComponent={Link} color="inherit" to="/search">
            Iskanje
          </Button>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
