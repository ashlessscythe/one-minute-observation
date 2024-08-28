import React from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { useTheme } from "next-themes";

export function MUIThemeProvider({ children }) {
  const { theme } = useTheme();

  const muiTheme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: theme === "dark" ? "dark" : "light",
        },
      }),
    [theme]
  );

  return <ThemeProvider theme={muiTheme}>{children}</ThemeProvider>;
}
