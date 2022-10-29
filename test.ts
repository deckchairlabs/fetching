import { createFetching } from "./mod.ts";
import { prettyLog } from "./lib/prettyLog.ts";

const fetching = createFetching({
  cache: await caches.open("v3"),
  log: prettyLog,
  allowedOrigins: [{
    hostname: "httpbin.org",
  }, {
    protocol: "file:",
  }],
});

globalThis.fetch = fetching;

await fetch(new URL("./README.md", import.meta.url));

await fetch("https://httpbin.org/delete", {
  method: "DELETE",
  headers: new Headers({
    "content-type": "application/json",
  }),
  body: JSON.stringify({ foo: "bar" }),
});

await fetch("https://httpbin.org/get", {
  method: "GET",
  headers: new Headers({
    "content-type": "application/json",
  }),
});

await fetch("https://httpbin.org/patch", {
  method: "PATCH",
  headers: new Headers({
    "content-type": "application/json",
  }),
  body: JSON.stringify({ foo: "bar" }),
});

await fetch("https://httpbin.org/post", {
  method: "POST",
  headers: new Headers({
    "content-type": "application/json",
  }),
  body: JSON.stringify({ foo: "bar" }),
});

await fetch("https://httpbin.org/put", {
  method: "PUT",
  headers: new Headers({
    "content-type": "application/json",
  }),
  body: JSON.stringify({ foo: "bar" }),
});
