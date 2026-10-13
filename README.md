# Concert Owl

Concert Owl scrapes upcoming concerts for the Pittsburgh area, enriches each
show with a genre via the Gemini API, and posts daily and weekly summaries to
Slack. It runs as a set of scheduled scripts (e.g. via cron or a systemd timer)
and persists show history to a local JSON file.

## Features

- Scrapes concert listings from a public events calendar
- Enriches shows with genre classification using the Gemini API
- Posts new-show alerts and weekly summaries to Slack
- Recommends shows matching your Spotify listening vibe
- Stores show history in a local JSON file (see [Datastore](#datastore))

## Requirements

- Node.js 18 or later (uses the built-in `--env-file` flag)
- npm
- A Slack incoming webhook URL
- A Gemini API key

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the sample environment file and fill in your values:

   ```bash
   cp .env.sample .env
   ```

The environment variables are:

| Variable                     | Required          | Description                                             |
| ---------------------------- | ----------------- | ------------------------------------------------------- |
| `SLACK_URL`                  | Yes               | Slack webhook for new-show alerts                       |
| `WEEKLY_SLACK_URL`           | Yes               | Slack webhook for the weekly summary                    |
| `GEMINI_API_KEY`             | Yes               | API key for genre enrichment                            |
| `RECOMMENDATIONS_SLACK_URL`  | For `recommend`   | Slack webhook for vibe recommendations                  |
| `SPOTIFY_CLIENT_ID`          | For `recommend`   | Spotify app client ID (client-credentials flow)         |
| `SPOTIFY_CLIENT_SECRET`      | For `recommend`   | Spotify app client secret                               |
| `SPOTIFY_PLAYLIST_ID`        | For `recommend`   | Public playlist representing your vibe (id or URL)      |
| `ERROR_SLACK_URL`            | For systemd units | Slack webhook the `OnFailure=` alert posts to           |
| `JSON_STORE_PATH`            | No                | Path to the JSON store; defaults to `./data/shows.json` |

## Usage

| Command                 | Description                                        |
| ----------------------- | -------------------------------------------------- |
| `npm run upcoming:v2`   | Post shows discovered since the last run to Slack  |
| `npm run weekly:v2`     | Post a summary of this week's shows to Slack       |
| `npm run recommend:v2`  | Post shows matching your Spotify vibe to Slack     |
| `npm test`              | Run the Jest test suite                            |
| `npm run test-coverage` | Run the test suite with coverage reporting         |
| `npm run lint`          | Lint the codebase with ESLint                      |

Each script loads variables from `.env` via Node's `--env-file` flag. To run on
a schedule, invoke `npm run upcoming:v2` and `npm run weekly:v2` from cron or a
systemd timer at the desired cadence.

## Datastore

Show history lives in a single JSON file (`data/shows.json`, overridable with
`JSON_STORE_PATH`), reached through one facade
([`services/datastore/index.js`](services/datastore/index.js)) so the backing
store can change again without touching callers.

Records are a flat array, one object per show-list snapshot, keyed for lookup by
`source_url`:

```json
[{ "id": "uuid", "date": "2026-08-11", "shows": ["..."], "source_url": "https://..." }]
```

Writes go through a temp file and an atomic rename, so a power loss mid-write
can't leave a half-written store.

This replaced a DynamoDB table; the phased dual-write migration that got us here
was removed once the JSON store became the source of truth.

### Backups

The JSON file is the **sole copy** of your show history, and `data/` is
git-ignored — so it is not version controlled. Back it up (a scheduled `rsync`
to another disk, or committing the file to a private repository) to protect
against storage failure.

## Project structure

```text
index.js                     Entry points (postNewShows, pushWeeklySummaryV2,
                             pushVibeRecommendations)
services/
  shows/                     Scraping, parsing, and date-range filtering
  ai/                        Gemini genre enrichment
  slack/                     Slack posting
  spotify/                   Vibe profile and artist matching
  datastore/                 Datastore facade + JSON file store
scripts/                     Scheduled-run entry points
deploy/                      systemd units and installer for the Raspberry Pi
```

## Notes

- The project uses ES modules (`import`/`export`).
