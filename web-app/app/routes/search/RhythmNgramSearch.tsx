import { Box, Button, ButtonGroup, Paper, TextField } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useControlledState } from "../../utils/useControlledState";
import { useState } from "react";

interface RhythmNgramSearchProps {
  rhythmNgram?: string;
}

export const RhythmNgramSearch: React.FC<RhythmNgramSearchProps> = ({
  rhythmNgram,
}) => {
  const { t } = useTranslation("search");
  const [rhythmNgramState, setRhythmNgramState] = useControlledState(
    rhythmNgram ?? ""
  );

  const addNoteValue = (i: number) => {
    setRhythmNgramState((prev) => {
      return `${prev} 1/${i}`;
    });
  };

  const [helperOpacity, setHelperOpacity] = useState("0.0");

  return (
    <>
      <div
        onMouseEnter={() => {
          setHelperOpacity("1.0");
        }}
        onMouseLeave={() => {
          setHelperOpacity("0.0");
        }}
      >
        <TextField
          sx={{
            width: "20rem",
          }}
          name="rhythmNgram"
          label={t("rhythmNgram")}
          value={rhythmNgramState}
          onChange={(e) => {
            setRhythmNgramState(e.target.value);
          }}
        />
        <Box
          sx={{
            visibility: helperOpacity === "1.0" ? "visible" : "hidden",
            position: "absolute",
            padding: "0.5rem",
            zIndex: 100,
            transition: "visibility 0.2s",
          }}
        >
          <Paper
            sx={{
              opacity: helperOpacity,
              transition: "opacity 0.2s",
            }}
            elevation={3}
          >
            <ButtonGroup variant="text">
              {[...Array(7).keys()].map((i) => {
                const n = 2 ** i;
                return (
                  <Button
                    key={n}
                    onClick={() => {
                      addNoteValue(n);
                    }}
                  >
                    1&frasl;{n}
                  </Button>
                );
              })}
            </ButtonGroup>
          </Paper>
        </Box>
      </div>
    </>
  );
};
