import {
  AppBar,
  Button,
  IconButton,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { Box } from "@mui/system";
import MenuIcon from "@mui/icons-material/Menu";
import { Link } from "@remix-run/react";

export default function Navigation() {
  return (
    <AppBar position="sticky" elevation={0} variant="outlined">
      <Toolbar>
        <Stack direction={"row"} gap={1}>
          <Typography
            variant="h6"
            component="div"
            sx={{
              mr: 2,
            }}
          >
            Mladinska glasba
          </Typography>
          {/* @ts-ignore */}
          <Button LinkComponent={Link} color="inherit" to="/">
            Domov
          </Button>
          {/* @ts-ignore */}
          <Button LinkComponent={Link} color="inherit" to="/search">
            Iskanje
          </Button>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
