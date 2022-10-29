# 🦚 fetching

![GitHub Workflow Status](https://github.com/deckchairlabs/fetching/actions/workflows/ci.yml/badge.svg)
[![Deno module](https://shield.deno.dev/x/fetching)](https://deno.land/x/fetching)
![Deno compatibility](https://shield.deno.dev/deno/^1.20.0)

An enhanced `fetch` for Deno.

## Usage

```ts
import { createFetching } from "https://deno.land/x/fetching@v0.0.2/mod.ts";
import { prettyLog } from "https://deno.land/x/fetching@v0.0.2/lib/prettyLog.ts";

const fetching = createFetching({
  // The Cache API is supported
  cache: await caches.open("v1"),
  log: prettyLog,
  allowedOrigins: [{
    hostname: "httpbin.org",
  }],
});

// You can do this, or not
globalThis.fetch = fetching;

// This request will succeed!
await fetch("https://httpbin.org/get");

// This request will fail since we have not configured it as an allowedOrigin
await fetch("https://jsonplaceholder.typicode.com/todos/1");
```
