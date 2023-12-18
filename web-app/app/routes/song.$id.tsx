import { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { elastic } from "~/services/Elastic";
import { SongResult } from "~/src/DataTypes";
import { MetadataCard } from "./song/MetadataCard";
import { MAccordion } from "~/components/MAccordion";
import { Grid, Stack } from "@mui/material";
import { OutsideLinksCard } from "./song/OutsideLinksCard";
import { BasicDataCard } from "./song/BasicDataCard";
import { createContext } from "react";
import { useTranslation } from "react-i18next";
import { SheetMusic } from "./song/SheetMusic";
import { ContourGraph } from "~/components/ContourGraph";

export const handle = {
  i18n: ["song"],
};

export const loader = async ({ params }: LoaderFunctionArgs) => {
  invariant(params.id, "Missing song ID");
  try {
    const data = await elastic.get<SongResult>({
      index: "songs",
      id: params.id,
    });
    return data;
  } catch (e: any) {
    if (e.meta?.body?.found === false) {
      throw new Response(null, {
        status: 404,
        statusText: "Pesem ni bila najdena.",
      });
    } else {
      throw e;
    }
  }
};

const DataAccordion: React.FC<{
  label: string;
  song: SongResult;
  Component: React.FC<{ song: SongResult }>;
}> = ({ label, song, Component }) => {
  return (
    <MAccordion title={label}>
      <Component song={song} />
    </MAccordion>
  );
};

export const SongContext = createContext<SongResult>({} as SongResult);

export default function Song() {
  const data = useLoaderData<typeof loader>();
  const song = data._source!;
  const { t } = useTranslation("song");

  return (
    <>
      <SongContext.Provider value={song}>
        <Grid container spacing={1}>
          <Grid item xs={12} md={6}>
            <MetadataCard />
          </Grid>
          <Grid item xs={12} md={6}>
            <OutsideLinksCard />
          </Grid>
          <Grid item xs={12}>
            <BasicDataCard />
          </Grid>
          <Grid item xs={12}>
            <Stack direction="column">
              <MAccordion title={t("sheetMusic.title")}>
                <SheetMusic />
              </MAccordion>
              <MAccordion title={t("contourGraph.title")}>
                <ContourGraph songs={data} maxHeight={"500px"} useMeasures />
              </MAccordion>
            </Stack>
          </Grid>
        </Grid>
      </SongContext.Provider>
    </>
  );
}
