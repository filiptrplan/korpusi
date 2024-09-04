import { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { elastic } from "~/services/Elastic";
import { AudioResult } from "~/src/DataTypes";
import { MAccordion } from "~/components/MAccordion";
import { Grid } from "@mui/material";
import { createContext } from "react";
import { useTranslation } from "react-i18next";
import { MetadataCardAudio } from "~/routes/audio/MetadataCardAudio";
import { BasicDataCardAudio } from "~/routes/audio/BasicDataCardAudio";
import { GraphAudio } from "~/routes/audio/GraphAudio";

export const handle = {
  i18n: ["audio"],
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
  const audio = data._source!;
  const { t } = useTranslation("audio");

  return (
    <>
      <AudioContext.Provider value={audio}>
        <Grid container spacing={1}>
          <Grid item xs={12} md={6}>
            <MetadataCardAudio />
          </Grid>
          <Grid item xs={12} md={6}>
            <BasicDataCardAudio />
          </Grid>
          <Grid item xs={12}>
            <MAccordion title={t("graphAudio.title")}>
              <GraphAudio audioResults={[audio]}/>
            </MAccordion>
          </Grid>
        </Grid>
      </AudioContext.Provider>
    </>
  );
}
