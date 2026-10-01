# laya-service

Laya (open-source decision model) on Railway, tested on its own: no calendar, no Claude.
Not connected to find-time-agent unless the test scores well.

- `Dockerfile`: installs the `laya` package, English checkpoint only, CPU. ~2 GB RAM.
- `index.html` + `server.py`: playground at `/` (edit tools, try messages, run the test set). `server.py` wraps laya-serve so the page and API share one origin.
- `cases.json`: tools, instructions and 41 labelled messages (9 real ones from find-time), used by the page and `test.ts`.
- `test.ts`: the same test from the terminal.

Deploy: `railway login`, then `railway init` and `railway up` in this folder, then `railway domain` for a URL.
Test: `LAYA_URL=https://<app>.up.railway.app node test.ts`
Delete the Railway service after testing (no auth; anyone with the URL can use it).
