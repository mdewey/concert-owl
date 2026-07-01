/**
 * Posts a failure alert to Slack. Invoked by the systemd `concert-owl-alert@`
 * template unit via `OnFailure=`, with the failed unit name as its argument.
 *
 *   node --env-file=.env scripts/alert.js concert-owl-weekly
 *
 * Uses ALERT_SLACK_URL if set, otherwise falls back to SLACK_URL.
 */
import { postMessage } from '../services/slack/index.js';

const unit = process.argv[2] || 'a concert-owl job';
const slackUrl = process.env.ALERT_SLACK_URL || process.env.SLACK_URL;

postMessage({
  slackUrl,
  text:
    `:warning: *${unit}* failed on the Raspberry Pi.\n` +
    `Check logs with \`journalctl -u ${unit} -n 50\`.`,
}).then(() => {
  console.log('alert sent for', unit);
}).catch((err) => {
  console.error('failed to send alert:', err.message);
  process.exit(1);
});
