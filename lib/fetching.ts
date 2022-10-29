type FetchImpl = typeof fetch;

export type FetchingOptions = {
  cache?: Cache;
  /**
   * The origins which are allowed to be fetched. By default all origins
   * are blocked and an error will be thrown.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/URLPattern/URLPattern
   */
  allowedOrigins?: URLPatternInput[];
  log?: (record: FetchLogRecord) => void;
};

export type FetchLogRecord = {
  method: string;
  url: string;
  status: number;
  startTime: number;
  endTime: number;
  cacheMatch?: boolean;
};

const CACHE_HEADER_KEY = "x-fetching-cache";

export function createFetching(options: FetchingOptions = {}) {
  const { cache, log, allowedOrigins = [] } = options;
  const originalFetch = fetch;

  const allowedOriginPatterns = allowedOrigins.map((input) =>
    new URLPattern(input)
  );

  const fetching: FetchImpl = async (input, init) => {
    const startTime = performance.now();
    const method =
      (input instanceof Request
        ? init?.method || input.method
        : init?.method || "GET").toUpperCase();

    const url = input instanceof URL
      ? input
      : input instanceof Request
      ? new URL(input.url)
      : new URL(input);

    const isOriginAllowed = allowedOriginPatterns.some((origin) =>
      origin.test(url)
    );

    if (!isOriginAllowed) {
      throw new Error(
        `${url.origin} did not match an allowed origin.`,
      );
    }

    const isCacheable = method === "GET" && typeof cache !== "undefined";
    const cached = isCacheable ? await cache.match(input) : undefined;

    const logRecord: FetchLogRecord = {
      method,
      url: url.href,
      status: 200,
      startTime,
      endTime: startTime,
      cacheMatch: cached !== undefined,
    };

    if (cached) {
      cached.headers.set(CACHE_HEADER_KEY, "hit");

      logRecord.status = cached.status;
      logRecord.endTime = performance.now();

      log && log(logRecord);

      return cached;
    }

    return originalFetch(input, init).then((response) => {
      if (response.ok && cache) {
        cache.put(input, response.clone());
      }

      logRecord.status = response.status;
      logRecord.endTime = performance.now();

      log && log(logRecord);

      return response;
    });
  };

  return fetching;
}
