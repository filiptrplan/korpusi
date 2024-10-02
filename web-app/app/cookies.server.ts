import { createCookie } from "@remix-run/node";

export const localeCookie = createCookie("locale", {
  httpOnly: false,
  path: "/",
  maxAge: 365 * 24 * 60 * 60,
});