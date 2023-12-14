import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import InputLabel from "@mui/material/InputLabel";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { useEffect, useState } from "react";
import { OSMD } from "~/components/OSMD";
import { FormControl } from "@mui/base";

export default function Index() {
  const [xml, setXml] = useState("");

  const [firstNNotes, setFirstNNotes] = useState(8);
  const [lastNNotes, setLastNNotes] = useState(8);

  useEffect(() => {
    fetch("/sample.xml").then(async (response) => {
      const text = await response.text();
      setXml(text);
    });
  }, []);

  return <></>;
}
