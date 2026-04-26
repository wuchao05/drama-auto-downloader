# AGENTS.md

## Runtime And Setup
- This is a Node.js ESM service (`"type": "module"`) with entrypoint `src/index.js`; keep imports as explicit relative `.js` paths.
- Use pnpm; `pnpm-lock.yaml` is present and `.npmrc` sets `node-linker=hoisted` for Windows compatibility.
- Node >= 18 is expected by the docs and current dependencies.
- The code uses Playwright (`chromium`), not Puppeteer. If the browser is missing, prefer `pnpm exec playwright install chromium` over the older README Puppeteer command.
- `.env`, `browser-data/`, and `logs/*.log` are gitignored. Do not commit local cookies, browser state, or generated logs.

## Commands
- Install dependencies: `pnpm install`.
- Start the service directly: `pnpm start` or `node src/index.js`.
- macOS/Linux launch script: `./start.sh`; it first checks `https://www.cxyy.top`, then runs `node src/index.js`.
- Windows launch scripts: `start.bat` or `start.ps1`; both require pnpm and run `pnpm start`.
- Browser smoke test: `pnpm run test:browser`; it opens a visible Chromium window, loads Baidu, waits 3 seconds, then closes.
- Data-fetch smoke test: `pnpm run test:data`; it calls live Changdu/main-project endpoints and can fail without valid network, remote default config, or cookie fallback values.
- Extra API probe: `node test-api.js`; this is not wired into `package.json` scripts and uses live `https://www.cxyy.top/api` endpoints.
- There are no configured lint, formatter, typecheck, or unit-test scripts in `package.json`.

## Service Flow
- `src/index.js` creates `Scheduler`, starts it, and handles `SIGINT`/`SIGTERM` for graceful browser shutdown.
- `Scheduler.start()` launches a persistent Playwright context, checks/manual-waits for Changdu login, immediately runs one task, then schedules future runs with `node-cron`.
- `Scheduler.executeTask()` skips overlapping runs via `isRunning`, queries Feishu `待提交` records first, fills any remaining `BATCH_SIZE` slots from the normal Changdu flow, then processes IDs sequentially in the browser.
- Feishu tasks come from `src/services/feishuFetcher.js`; every scheduler run refreshes `tenant_access_token` using `FEISHU_APP_ID` and `FEISHU_APP_SECRET`, then searches `FEISHU_APP_TOKEN` status tables.
- After a Feishu-sourced drama is submitted successfully, its Feishu record `当前状态` is updated from `待提交` to `待下载`; failed browser submissions keep the record as `待提交` for the next run.
- Browser login state is stored in `browser-data/`; deleting it forces manual Changdu login again.

## Data And API Gotchas
- `src/config/index.js` loads `.env` with `dotenv` and first tries `${MAIN_PROJECT_API}/public/download-center/default` for Changdu/download-center headers.
- Feishu requires local `.env` values `FEISHU_APP_ID`, `FEISHU_APP_SECRET`, and `FEISHU_APP_TOKEN`; never commit the app secret.
- The Feishu status table IDs are currently hard-coded in `src/config/index.js`: `tblDOyi2Lzs80sv0`, `tbl2kpgxsb9i9tkC`, `tblYdtIXzH61XNIk`, `tbllfhvbuh475X9K`, `tblg78rCpr7h3IRD`.
- Local `.env` header fields (`APPID`, `APPTYPE`, `DISTRIBUTORID`, `ADUSERID`, `ROOT_ADUSERID`, `DEFAULT_COOKIE`) are only fallback when the remote default config fails and the required local values are present.
- Drama list requests must use the main project `a_bogus` service response as-is: `request_path + encoded_a_bogus`. Do not locally reserialize params or recompute the final URL unless intentionally changing this fragile integration.
- Drama list fetch currently requests Changdu pages `1` and `2`, `100` rows each, then filters `dy_audit_status === 3`, `episode_amount >= 40`, and publish dates for today/tomorrow/day-after-tomorrow in `Asia/Shanghai`.
- Download task matching is by trimmed drama name, not ID. Existing successful (`2`) or processing (`1`) tasks suppress re-download; missing, failed (`3`), or pending (`0`) tasks are eligible.

## Operational Notes
- Default config in code is `CRON_SCHEDULE=*/10 * * * *`, while `.env.example` documents `*/30`; trust the code/default env actually in use when debugging behavior.
- `HEADLESS=false` is useful for first login and debugging; `HEADLESS=true` requires already-saved `browser-data/` or valid session state.
- `BATCH_SIZE` limits how many sorted drama IDs are processed per scheduler run.
- Browser automation finds buttons by Chinese text (`批量下载`, `确认`) and uses fixed waits; selector or timing changes in Changdu pages are likely failure points.
- Logs are written to console plus `logs/combined.log` and `logs/error.log` with 5 MB rotation.
