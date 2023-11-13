import { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { elastic } from "~/services/Elastic";
import { SongResult } from "~/src/DataTypes";
import { MetadataCard } from "./song/MetadataCard";

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

export default function Song() {
  const data = useLoaderData<typeof loader>();

  return (
    <>
      <MetadataCard song={data._source!} />
    </>
  );
}
