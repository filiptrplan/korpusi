import { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { elastic } from "~/services/Elastic";
import { AudioResult, SongResult } from "~/src/DataTypes";
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
    const data = await elastic.get<AudioResult>({
      index: "audio",
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

export const AudioContext = createContext<AudioResult>({} as AudioResult);

export default function Song() {
  const data = useLoaderData<typeof loader>();
  const song = data._source!;
  const { t } = useTranslation("xml");

  return (
    <>
      <AudioContext.Provider value={song}>
        <Grid container spacing={1}>
          <Grid item xs={12} md={6}>
          </Grid>
        </Grid>
      </AudioContext.Provider>
    </>
  );
}
