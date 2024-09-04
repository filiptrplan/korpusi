import * as React from "react";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Navigation from "./Navigation";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navigation />
      <Container maxWidth="xl">
        <Box sx={{ my: 2 }}>{children}</Box>
      </Container>
    </>
  );
}
