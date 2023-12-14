import { SearchHit } from "@elastic/elasticsearch/lib/api/types";
import {
  Box,
  CardActionArea,
  Divider,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { t } from "i18next";
import React, {
  createContext,
  useContext,
  useMemo,
  useReducer,
  useRef,
} from "react";
import { useTranslation } from "react-i18next";
import { SongResult } from "~/src/DataTypes";
import {
  CompareAmbitus,
  CompareKey,
  CompareTempo,
  CompareTimeSignature,
  CompareTitle,
} from "./BasicCompareRows";
import { CompareSheetMusic } from "./CompareSheetMusic";
import { CompareContour } from "./CompareContour";

export const songsContext = createContext<SearchHit<SongResult>[]>([]);

interface CompareListProps {
  songs: SearchHit<SongResult>[];
}

const CompareRow: React.FC<{
  title: string;
  Component: React.FC<{ song: SearchHit<SongResult> }>;
}> = ({ title, Component }) => {
  const titleWidth = 2;
  const songs = useContext(songsContext);

  const songsComponents = songs.map((song) => {
    return <Component key={song._id} song={song} />;
  });

  const width = Math.max(2, (12 - titleWidth) / songs.length);

  return (
    <Grid
      item
      container
      xs={12}
      direction="row"
      wrap="nowrap"
      alignItems={"center"}
    >
      <Grid
        item
        xs={titleWidth}
        sx={{
          minWidth: "150px",
        }}
      >
        <Typography variant="h6" fontSize="1.05rem">
          {title}
        </Typography>
      </Grid>
      {songsComponents.map((component) => {
        return (
          <Grid
            item
            xs={width}
            key={component.key}
            sx={{
              minWidth: "200px",
            }}
          >
            {component}
          </Grid>
        );
      })}
    </Grid>
  );
};

const CompareRowCustom: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => {
  const titleWidth = 2;
  return (
    <Grid item container xs={12} direction="row" alignItems="flex-start">
      <Grid item xs={titleWidth}>
        <Typography variant="h6" fontSize="1.05rem">
          {title}
        </Typography>
      </Grid>
      <Grid item xs={12 - titleWidth}>
        {children}
      </Grid>
    </Grid>
  );
};

const scrollWidthContext = createContext<number | string>("100%");

const GridDivider: React.FC = () => {
  const scrollWidth = useContext(scrollWidthContext);
  return (
    <Divider
      flexItem
      sx={{
        width: scrollWidth,
        my: 1,
      }}
    />
  );
};

export const CompareList: React.FC<CompareListProps> = ({ songs }) => {
  const { t } = useTranslation("compare");
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollWidth = useMemo(() => {
    if (scrollRef.current) return scrollRef.current.scrollWidth;
    else return "100%";
  }, [scrollRef.current]);
  return (
    <Stack
      sx={{
        px: 1,
        pt: 1,
      }}
    >
      <songsContext.Provider value={songs}>
        <scrollWidthContext.Provider value={scrollWidth}>
          <Box
            ref={scrollRef}
            sx={{
              overflowX: "auto",
            }}
          >
            <Grid
              sx={{
                width: "100%",
              }}
              container
              alignItems={"center"}
            >
              <CompareRow title={t("songTitle")} Component={CompareTitle} />
              <GridDivider />
              <CompareRow title={t("tempo")} Component={CompareTempo} />
              <GridDivider />
              <CompareRow title={t("key")} Component={CompareKey} />
              <GridDivider />
              <CompareRow
                title={t("timeSignature")}
                Component={CompareTimeSignature}
              />
              <GridDivider />
              <CompareRow title={t("ambitus")} Component={CompareAmbitus} />
              <GridDivider />
              <CompareRowCustom title={t("contour")}>
                <CompareContour />
              </CompareRowCustom>
              <GridDivider />
              <CompareRowCustom title={t("sheetMusic")}>
                <CompareSheetMusic />
              </CompareRowCustom>
            </Grid>
          </Box>
        </scrollWidthContext.Provider>
      </songsContext.Provider>
    </Stack>
  );
};
