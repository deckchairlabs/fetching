import { sprintf } from "https://deno.land/std@0.161.0/fmt/printf.ts";
import {
  blue,
  brightGreen,
  brightYellow,
  cyan,
  gray,
  green,
  magenta,
  red,
  yellow,
} from "https://deno.land/std@0.161.0/fmt/colors.ts";
import { FetchLogRecord } from "./fetching.ts";

export function prettyLog(logRecord: FetchLogRecord) {
  const prefix = magenta("[fetching]");

  const isSuccessfulResponse = logRecord.status >= 200 &&
    logRecord.status < 400;
  const status = isSuccessfulResponse
    ? brightGreen(`[${logRecord.status}]`)
    : brightYellow(`[${logRecord.status}]`);

  const methodColor = getMethodColor(logRecord.method);
  const cached = logRecord.cacheMatch ? green(" [cached]") : "";

  const message = sprintf(
    "%s %s %s: %s %s%s",
    prefix,
    methodColor(logRecord.method),
    status,
    logRecord.url,
    gray((logRecord.endTime - logRecord.startTime).toFixed(2) + "ms"),
    cached,
  );

  console.log(message);
}

function getMethodColor(method: string) {
  switch (method) {
    default:
    case "GET":
      return blue;
    case "PATCH":
      return cyan;
    case "POST":
      return green;
    case "PUT":
      return yellow;
    case "DELETE":
      return red;
  }
}
