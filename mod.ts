type FetchImpl = typeof fetch;

type UltraFetchOptions = {
  cache?: Cache;
  allowedOrigins?: URLPatternInput[];
  log?: (record: FetchLogRecord) => void;
};

type FetchLogRecord = {
  method: string;
  url: string;
  status: number;
  startTime: number;
  endTime: number;
  cacheMatch?: boolean;
};

const CACHE_HEADER_KEY = "x-ultra-cache";

export function createUltraFetch(options: UltraFetchOptions = {}) {
  const { cache, log, allowedOrigins = [] } = options;
  const originalFetch = fetch;

  const allowedOriginPatterns = allowedOrigins.map((input) =>
    new URLPattern(input)
  );

  const ultraFetch: FetchImpl = async (input, init) => {
    const startTime = performance.now();
    const method = input instanceof Request
      ? init?.method || input.method
      : init?.method || "GET";

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

    const cached = cache && await cache.match(input);

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

  return ultraFetch;
}
