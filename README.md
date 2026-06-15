# Concert Owl

Concert Owl scrapes upcoming concerts for the Pittsburgh area, enriches each
show with a genre via the Gemini API, and posts daily and weekly summaries to
Slack. It runs as a set of scheduled scripts (e.g. via cron or a systemd timer)
and persists show history to a configurable datastore.

## Features

- Scrapes concert listings from a public events calendar
- Enriches shows with genre classification using the Gemini API
- Posts new-show alerts and weekly summaries to Slack
- Pluggable datastore with a dual-write migration path from AWS DynamoDB to
  local JSON storage (see [Datastore & migration](#datastore--migration))

## Requirements

- Node.js 18 or later (uses the built-in `--env-file` flag)
- npm
- A Slack incoming webhook URL
- A Gemini API key
- AWS credentials with DynamoDB access — only while DynamoDB is part of the
  active datastore mode

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

| Variable           | Required            | Description                                                      |
| ------------------ | ------------------- | ---------------------------------------------------------------- |
| `SLACK_URL`        | Yes                 | Slack webhook for new-show alerts                                |
| `WEEKLY_SLACK_URL` | Yes                 | Slack webhook for the weekly summary                             |
| `GEMINI_API_KEY`   | Yes                 | API key for genre enrichment                                     |
| `DATASTORE_MODE`   | No                  | Datastore mode (see below); defaults to `dual-write-read-dynamo` |
| `JSON_STORE_PATH`  | No                  | Path to the JSON store; defaults to `./data/shows.json`          |
| `REGION`           | When using DynamoDB | AWS region; defaults to `us-east-1`                              |
| `TABLE_NAME`       | When using DynamoDB | DynamoDB table name                                              |
| `ACCESS_KEY`       | When using DynamoDB | AWS access key ID                                                |
| `SECRET_KEY`       | When using DynamoDB | AWS secret access key                                            |

## Usage

| Command                 | Description                                        |
| ----------------------- | -------------------------------------------------- |
| `npm run upcoming:v2`   | Post shows discovered since the last run to Slack  |
| `npm run weekly:v2`     | Post a summary of this week's shows to Slack       |
| `npm run backfill`      | Copy existing DynamoDB records into the JSON store |
| `npm test`              | Run the Jest test suite                            |
| `npm run test-coverage` | Run the test suite with coverage reporting         |
| `npm run lint`          | Lint the codebase with ESLint                      |

Each script loads variables from `.env` via Node's `--env-file` flag. To run on
a schedule, invoke `npm run upcoming:v2` and `npm run weekly:v2` from cron or a
systemd timer at the desired cadence.

## Datastore & migration

The datastore is accessed through a single facade
([`services/datastore/index.js`](services/datastore/index.js)) that supports a
phased, dual-write migration from DynamoDB to a local JSON file. The active
behavior is selected by the `DATASTORE_MODE` environment variable:

| `DATASTORE_MODE`         | Behavior                                   | Phase                  |
| ------------------------ | ------------------------------------------ | ---------------------- |
| `dynamo-only`            | Read and write DynamoDB only               | Baseline               |
| `dual-write-read-dynamo` | Write both stores, read DynamoDB (default) | 1 - start              |
| `dual-write-read-json`   | Write both stores, read JSON               | 3 - after backfill     |
| `json-only`              | Read and write JSON only                   | 4 - migration complete |

In the dual modes, writes go to the primary (source of truth) first and to the
secondary best-effort; reads come from the primary while a background **shadow
read** of the secondary logs any drift between the two stores.

### Recommended migration sequence

1. Deploy with `DATASTORE_MODE=dual-write-read-dynamo` and confirm the logs
   report `shadow read OK`.
2. Run `npm run backfill` to seed the JSON store from DynamoDB.
3. Switch to `DATASTORE_MODE=dual-write-read-json` and continue monitoring for
   drift, with DynamoDB still written as a safety net.
4. Switch to `DATASTORE_MODE=json-only`, then remove the AWS SDK dependencies
   (`aws-sdk`, `@aws-sdk/*`) and the AWS environment variables.

### Backups

In `json-only` mode the JSON file is the sole copy of your show history. Note
that `data/` is git-ignored by default, so it is **not** version controlled —
back it up (for example, a scheduled `rsync` to another disk, or committing the
file to a private repository) to protect against storage failure.

## Project structure

```text
index.js                     Entry points (postNewShows, pushWeeklySummaryV2)
services/
  shows/                     Scraping, parsing, and date-range filtering
  ai/                        Gemini genre enrichment
  slack/                     Slack posting
  datastore/                 Datastore facade + DynamoDB and JSON implementations
scripts/                     Scheduled-run and backfill entry points
```

## Notes

- The project uses ES modules (`import`/`export`).
- Ensure your AWS and Slack credentials have the necessary permissions.
