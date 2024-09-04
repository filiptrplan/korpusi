import { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { elastic } from "~/services/Elastic";
import { SongResult } from "~/src/DataTypes";
import { MetadataCardXML } from "./xml/MetadataCardXML";
import { MAccordion } from "~/components/MAccordion";
import { Grid, Stack } from "@mui/material";
import { OutsideLinksCardXML } from "./xml/OutsideLinksCardXML";
import { BasicDataCardXML } from "./xml/BasicDataCardXML";
import { createContext } from "react";
import { useTranslation } from "react-i18next";
import { SheetMusic } from "./xml/SheetMusic";
import { ContourGraph } from "~/components/ContourGraph";

export const handle = {
  i18n: ["xml"],
};

export const loader = async ({ params }: LoaderFunctionArgs) => {
  invariant(params.id, "Missing song ID");
  try {
    const data = await elastic.get<SongResult>({
      index: "songs",
      id: params.id,
    });
    return data;
    // eslint-disable-next-line
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

export const SongContext = createContext<SongResult>({} as SongResult);

export default function Song() {
  const data = useLoaderData<typeof loader>();
  const song = data._source!;
  const { t } = useTranslation("xml");

  return (
    <>
      <SongContext.Provider value={song}>
        <Grid container spacing={1}>
          <Grid item xs={12} md={6}>
            <MetadataCardXML />
          </Grid>
          <Grid item xs={12} md={6}>
            <OutsideLinksCardXML />
          </Grid>
          <Grid item xs={12}>
            <BasicDataCardXML />
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
