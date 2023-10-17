import { Typography, useScrollTrigger } from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  OpenSheetMusicDisplay,
  Cursor,
  VoiceEntry,
  Note,
  StemDirectionType,
} from "opensheetmusicdisplay";
import OSMD from "~/components/OSMD";

export default function Test() {
  const [xml, setXml] = useState("");

  useEffect(() => {
    fetch("/sample.xml").then(async (response) => {
      const text = await response.text();
      setXml(text);
    });
    // osmd.load(sample).then(() =>
  }, []);

  return (
    <>
      <OSMD xml={xml} />
    </>
  );
}
