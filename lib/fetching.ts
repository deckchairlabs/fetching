import { bold, sprintf, yellow } from "./deps.ts";

type FetchImpl = typeof fetch;

export type FetchingOptions = {
  cache?: Cache;
  /**
   * The origins which are allowed to be fetched.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/URLPattern/URLPattern
   */
  allowedOrigins?: URLPatternInput[];
  log?: (record: FetchLogRecord) => void;
};

export type FetchLogRecord = {
  method: string;
  url: string;
  status: number;
  measure: PerformanceMeasure;
  cacheMatch: boolean;
};

const CACHE_HEADER_KEY = "x-fetching-cache";
const FETCH_START = "fetch-start";
const FETCH_END = "fetch-end";

export function createFetching(options: FetchingOptions = {}) {
  const { cache, log, allowedOrigins = [] } = options;
  const originalFetch = fetch;

  const allowedOriginPatterns = allowedOrigins.map((input) =>
    new URLPattern(input)
  );

  const randomDomain = getRandomDomain();

  Deno.permissions.query({
    name: "net",
    host: randomDomain,
  }).then((status) => {
    if (status.state === "granted") {
      console.warn(
        sprintf(
          "[fetching] %s - A randomly generated domain (%s) is granted net permission.",
          bold(yellow("WARNING")),
          randomDomain,
        ),
      );
    }
  });

  const fetching: FetchImpl = async (input, init) => {
    performance.mark(FETCH_START);

    const method =
      (input instanceof Request
        ? init?.method || input.method
        : init?.method || "GET").toUpperCase();

    const url = input instanceof URL
      ? input
      : input instanceof Request
      ? new URL(input.url)
      : new URL(input);

    const isRemoteOrigin = url.protocol !== "file:";
    const isAllowedOrigin = await isOriginAllowed(url, allowedOriginPatterns);

    if (!isAllowedOrigin) {
      throw new Error(
        `${url} did not match an allowed origin.`,
      );
    }

    const isCacheable = isRemoteOrigin && method === "GET" &&
      typeof cache !== "undefined";
    const cached = isCacheable ? await cache.match(input) : undefined;

    function measure(status: number) {
      performance.mark(FETCH_END);
      return performance.measure("fetch", {
        start: FETCH_START,
        end: FETCH_END,
        detail: {
          url: url.toString(),
          method,
          status,
          cached: cached !== undefined,
        },
      });
    }

    function logResponse(response: Response) {
      log && log({
        method,
        url: url.href,
        status: response.status,
        measure: measure(response.status),
        cacheMatch: cached !== undefined,
      });
    }

    if (cached) {
      cached.headers.set(CACHE_HEADER_KEY, "hit");
      logResponse(cached);

      return cached;
    }

    return originalFetch(input, init).then((response) => {
      if (response.ok && isCacheable && cache) {
        cache.put(input, response.clone());
      }

      logResponse(response);

      return response;
    });
  };

  return fetching;
}

function getRandomDomain(length = 16) {
  let hostname = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    hostname += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return `${hostname}.com`;
}

export async function isOriginAllowed(url: URL, allowedOrigins: URLPattern[]) {
  const isRemoteOrigin = url.protocol !== "file:";

  const isPermissionGranted = isRemoteOrigin
    ? await Deno.permissions.query({
      name: "net",
      host: url.host,
    }).then((status) => status.state === "granted")
    : await Deno.permissions.query({
      name: "read",
      path: url,
    });

  return (isPermissionGranted && allowedOrigins.length === 0) ||
    isPermissionGranted &&
      allowedOrigins.some((origin) => origin.test(url));
}
