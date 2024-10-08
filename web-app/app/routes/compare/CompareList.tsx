import { SearchHit } from "@elastic/elasticsearch/lib/api/types";
import { Box, Divider, Grid, Stack, Typography } from "@mui/material";
import React, {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { AudioResult, SongResult } from "~/src/DataTypes";
import {
  CompareAmbitusXML,
  CompareKeyXML,
  CompareTempoXML,
  CompareTimeSignatureXML,
  CompareTitleXML,
} from "./BasicCompareRowsXML";
import { CompareSheetMusic } from "./CompareSheetMusic";
import { CompareContour } from "./CompareContour";
import { CompareContext, SearchType, SearchTypeContext } from "~/routes/search";
import {
  CompareDurationAudio,
  CompareKeyAudio,
  CompareTempoAudio,
  CompareTitleAudio,
} from "~/routes/compare/BasicCompareRowsAudio";
import { CompareAudioGraph } from "~/routes/compare/CompareAudioGraph";
import { NGramHistogram } from "~/components/NGramHistogram";
import { CompareNGramHistogram } from "~/routes/compare/CompareNGramHistorgram";

const CompareRowXML: React.FC<{
  title: string;
  Component: React.FC<{ song: SearchHit<SongResult> }>;
}> = ({ title, Component }) => {
  const { xmlHits } = useContext(CompareContext);

  const songsComponents = xmlHits.map((song) => {
    return <Component key={song._id} song={song} />;
  });

  return (
    <CompareRow title={title} hitLength={xmlHits.length}>
      {songsComponents}
    </CompareRow>
  );
};

const CompareRowAudio: React.FC<{
  title: string;
  Component: React.FC<{ audio: SearchHit<AudioResult> }>;
}> = ({ title, Component }) => {
  const { audioHits } = useContext(CompareContext);

  const songsComponents = audioHits.map((song) => {
    return <Component key={song._id} audio={song} />;
  });

  return (
    <CompareRow title={title} hitLength={audioHits.length}>
      {songsComponents}
    </CompareRow>
  );
};

const CompareRow: React.FC<{
  title: string;
  children: JSX.Element[];
  hitLength: number;
}> = ({ title, hitLength, children }) => {
  const titleWidth = 2;
  const width = Math.max(2, (12 - titleWidth) / hitLength);

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
      {children.map((component) => {
        if (!component) return;
        return (
          <Grid
            item
            xs={width}
            key={component.key ?? "1"}
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
    <Grid
      minWidth={400}
      item
      container
      xs={12}
      direction="row"
      alignItems="flex-start"
    >
      <Grid item xs={12} md={titleWidth}>
        <Typography variant="h6" fontSize="1.05rem">
          {title}
        </Typography>
      </Grid>
      <Grid item xs={12} md={12 - titleWidth}>
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

const CompareRowListXML: React.FC = () => {
  const { t } = useTranslation("compare");
  return (
    <>
      <CompareRowXML title={t("songTitle")} Component={CompareTitleXML} />
      <GridDivider />
      <CompareRowXML title={t("tempo")} Component={CompareTempoXML} />
      <GridDivider />
      <CompareRowXML title={t("key")} Component={CompareKeyXML} />
      <GridDivider />
      <CompareRowXML
        title={t("timeSignature")}
        Component={CompareTimeSignatureXML}
      />
      <GridDivider />
      <CompareRowXML title={t("ambitus")} Component={CompareAmbitusXML} />
      <GridDivider />
      <CompareRowCustom title={t("contour")}>
        <CompareContour />
      </CompareRowCustom>
      <GridDivider />
      <CompareRowCustom title={t("sheetMusic")}>
        <CompareSheetMusic />
      </CompareRowCustom>
      <CompareRowCustom title={t("ngramsPitch")}>
        <CompareNGramHistogram type="pitch" />
      </CompareRowCustom>
      <CompareRowCustom title={t("ngramsRhythm")}>
        <CompareNGramHistogram type="rhythm" />
      </CompareRowCustom>
    </>
  );
};

const CompareRowListAudio: React.FC = () => {
  const { t } = useTranslation("compare");
  return (
    <>
      <CompareRowAudio title={t("songTitle")} Component={CompareTitleAudio} />
      <GridDivider />
      <CompareRowAudio title={t("tempo")} Component={CompareTempoAudio} />
      <GridDivider />
      <CompareRowAudio title={t("duration")} Component={CompareDurationAudio} />
      <GridDivider />
      <CompareRowAudio title={t("key")} Component={CompareKeyAudio} />
      <GridDivider />
      <CompareRowCustom title={t("graphs")}>
        <CompareAudioGraph />
      </CompareRowCustom>
    </>
  );
};

export const CompareList: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollWidth, setScrollWidth] = useState<number | string>("100%");
  const searchType = useContext(SearchTypeContext);

  // These are here so the divider resize properly on resize of the window
  useEffect(() => {
    setScrollWidth(scrollRef.current?.scrollWidth || "100%");
  }, [scrollRef.current]);

  useLayoutEffect(() => {
    const onResize = () => {
      setScrollWidth(scrollRef.current?.scrollWidth || "100%");
    };
    if (window) window.addEventListener("resize", onResize);
    return () => {
      if (window) window.removeEventListener("resize", onResize);
    };
  });

  return (
    <Stack
      sx={{
        px: 1,
        pt: 1,
      }}
    >
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
            {searchType == SearchType.Audio ? (
              <CompareRowListAudio />
            ) : (
              <CompareRowListXML />
            )}
          </Grid>
        </Box>
      </scrollWidthContext.Provider>
    </Stack>
  );
};
