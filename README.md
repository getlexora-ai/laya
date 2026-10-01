# laya-service

Laya (open-source decision model) on Railway, tested on its own: no calendar, no Claude.
Not connected to find-time-agent unless the test scores well.

- `Dockerfile`: installs the `laya` package, English checkpoint only, CPU. ~2 GB RAM.
- `test.ts`: 34 messages (9 real ones from find-time) → Laya picks one of find-time's 6 chat tools → accuracy, mix-ups, latency.

Deploy: `railway login`, then `railway init` and `railway up` in this folder, then `railway domain` for a URL.
Test: `LAYA_URL=https://<app>.up.railway.app node test.ts`
Delete the Railway service after testing (no auth; anyone with the URL can use it).
