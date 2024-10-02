import { ActionFunction, json } from "@remix-run/server-runtime";
import { localeCookie } from "~/cookies.server";

export const action: ActionFunction = async ({ params }) => {
  const locale = params.locale;
  console.log("Setting locale to", locale);
  return json({}, {
    headers: {
      "Set-Cookie": await localeCookie.serialize(locale)
    }
  });
};