import {
  Card,
  CardContent,
  InputLabel,
  Slider,
  Stack,
  TextField,
} from "@mui/material";
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

  return (
    <>
      <Stack spacing={2}>
        <Card variant="outlined">
          <CardContent>
            <FormControl>
              <InputLabel htmlFor="first-n-notes">
                Prikaži prvih N not
              </InputLabel>
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                id="first-n-notes"
              >
                <TextField
                  variant="standard"
                  size="small"
                  sx={{
                    width: "3rem",
                  }}
                  type="number"
                  value={firstNNotes}
                  onChange={(e) => {
                    setFirstNNotes(parseInt(e.target.value));
                  }}
                />
                <Slider
                  min={3}
                  max={20}
                  value={firstNNotes ?? 0}
                  marks={true}
                  step={1}
                  onChange={(e, num) => {
                    setFirstNNotes(num as number);
                  }}
                />
              </Stack>
            </FormControl>
            <OSMD xml={xml} displayFirstNNotes={firstNNotes} />
          </CardContent>
        </Card>
        <Card variant="outlined">
          <CardContent>
            <FormControl>
              <InputLabel htmlFor="last-n-notes">
                Prikaži zadnjih N not
              </InputLabel>
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                id="last-n-notes"
              >
                <TextField
                  variant="standard"
                  size="small"
                  sx={{
                    width: "3rem",
                  }}
                  type="number"
                  value={lastNNotes}
                  onChange={(e) => {
                    setLastNNotes(parseInt(e.target.value));
                  }}
                />
                <Slider
                  min={3}
                  max={20}
                  value={lastNNotes ?? 0}
                  marks={true}
                  step={1}
                  onChange={(e, num) => {
                    setLastNNotes(num as number);
                  }}
                />
              </Stack>
            </FormControl>
            <OSMD xml={xml} displayLastNNotes={lastNNotes} />
          </CardContent>
        </Card>
      </Stack>
    </>
  );
}
