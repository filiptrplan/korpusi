import { createTheme } from "@mui/material/styles";
import { red } from "@mui/material/colors";

// Create a theme instance.
const theme = createTheme({
  palette: {
    primary: {
      main: "#556cd6",
    },
    secondary: {
      main: "#19857b",
    },
    error: {
      main: red.A400,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCard: {
      defaultProps: {
        variant: "outlined",
      },
    },
    MuiStack: {
      defaultProps: {
        spacing: 1,
      },
    },
    MuiTextField: {
      defaultProps: {
        sx: {
          width: "15rem",
        },
      },
    },
    MuiSelect: {
      defaultProps: {
        sx: {
          width: "15rem",
        },
      },
    },
  },
});

export default theme;
