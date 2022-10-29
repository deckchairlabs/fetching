import { sprintf } from "https://deno.land/std@0.161.0/fmt/printf.ts";
import {
  brightBlue,
  brightGreen,
  brightYellow,
  gray,
  magenta,
} from "https://deno.land/std@0.161.0/fmt/colors.ts";
import { createUltraFetch } from "./mod.ts";

const ultraFetch = createUltraFetch({
  cache: await caches.open("v3"),
  allowedOrigins: [{
    hostname: "jsonplaceholder.typicode.com",
  }],
  log(record) {
    const prefix = magenta("[fetch]");

    const isSuccessfulResponse = record.status >= 200 && record.status < 400;
    const status = isSuccessfulResponse
      ? brightGreen(`[${record.status}]`)
      : brightYellow(`[${record.status}]`);

    const message = sprintf(
      "%s %s %s: %s %s%s",
      prefix,
      brightBlue(record.method),
      status,
      record.url,
      gray((record.endTime - record.startTime).toFixed(2) + "ms"),
      record.cacheMatch ? gray(" [cached]") : "",
    );

    console.log(message);
  },
});

globalThis.fetch = ultraFetch;

let count = 1;

const fetchInterval = setInterval(() => {
  fetch(`https://jsonplaceholder.typicode.com/todos/${count}`);
  if (count === 10) {
    clearInterval(fetchInterval);
  }
  count++;
});
