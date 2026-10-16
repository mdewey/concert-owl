import * as ConcertOwl from '../index.js';

// Debug mode: fetch and group the tracks but print instead of posting to
// Slack. Enable with `--dry-run` (or `-d`).
const dryRun = process.argv.includes('--dry-run') || process.argv.includes('-d');

console.log('release radar', new Date(), dryRun ? '(dry run)' : '');

ConcertOwl.pushReleaseRadar({ dryRun }).then((data) => {
  console.log('done', new Date(), data);
}).catch((err) => {
  console.log('error', err);
  // Non-zero exit so systemd's OnFailure= alert fires.
  process.exitCode = 1;
});
