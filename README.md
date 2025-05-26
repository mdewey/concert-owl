# Concert Owl

Concert Owl is a Node.js application that scrapes, processes, and posts information about upcoming concerts in the Pittsburgh area. It integrates with Slack and AWS DynamoDB to provide automated updates and summaries of new and upcoming shows.

## Features

- Scrapes concert data from a public events calendar
- Stores and updates show data in AWS DynamoDB
- Posts new and weekly show summaries to Slack
- Includes utility scripts for daily and weekly automation

## Prerequisites

- Node.js (v18 or later recommended)
- npm
- AWS credentials (for DynamoDB access)
- Slack webhook URL (for posting updates)

## Setup Instructions

1. **Clone the repository:**

   ```powershell
   git clone <your-repo-url>
   cd concert-owl
   ```

2. **Install dependencies:**

   ```powershell
   npm install
   ```

3. **Configure environment variables:**

   Create a `.env` file in the project root with the following content:

   ```env
   GEMINI_API_KEY=your_gemini_api_key
   SLACK_URL=your_slack_webhook_url
   WEEKLY_SLACK_URL=your_weekly_slack_webhook_url
   REGION=your_aws_region
   TABLE_NAME=your_dynamodb_table_name
   ACCESS_KEY=your_aws_access_key
   SECRET_KEY=your_aws_secret_key
   ```

## How to Run

Below are the available npm scripts defined in `package.json`:

- **run:weekly**: Runs the weekly summary script with environment variables from `.env`.

  ```powershell
  npm run run:weekly
  # or
  node --env-file=.env scripts/weekly.js
  ```

  Posts a summary of upcoming shows for the week to Slack.

- **run:upcoming:v1**: Runs the original daily summary script with environment variables from `.env`.

  ```powershell
  npm run run:upcoming:v1
  # or
  node --env-file=.env scripts/upcoming.js
  ```

  Posts new shows found since the last run to Slack (original version).

- **run:upcoming:v2**: Runs an updated version of the daily summary script with environment variables from `.env`.

  ```powershell
  npm run run:upcoming:v2
  # or
  node --env-file=.env scripts/upcoming.v2.js
  ```

  Posts new shows found since the last run to Slack (v2 version).

- **test**: Runs the test suite using Jest.

  ```powershell
  npm test
  ```

- **test-coverage**: Runs the test suite with coverage reporting.

  ```powershell
  npm run test-coverage
  ```

- **lint**: Lints the codebase using ESLint.

  ```powershell
  npm run lint
  ```

## Project Structure

- `index.js` - Main entry point and Lambda handler functions
- `services/` - Core logic for scraping, data storage, and Slack integration
- `scripts/` - Automation scripts for daily and weekly tasks

## Notes

- Make sure your AWS and Slack credentials are valid and have the necessary permissions.
- The project uses ES modules (`import`/`export` syntax).
- For local development, ensure your `.env` file is set up correctly.

---

Feel free to customize this README for your deployment or team needs.
