import * as React from "react";
import type { MetaFunction } from "@remix-run/node";
import { Link as RemixLink } from "@remix-run/react";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";

export const meta: MetaFunction = () => [{ title: "Mladinska glasba" }];

export default function Index() {
  return (
    <>
      <Typography variant="h4" component="h1" gutterBottom>
        Pozdravljeni na spletni strani Mladinske glasbe!
      </Typography>
    </>
  );
}
