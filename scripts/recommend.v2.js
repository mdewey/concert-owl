import * as ConcertOwl from '../index.js';

// Debug mode: run the full match + AI pipeline but print results instead of
// posting to Slack. Enable with `--dry-run` (or `-d`).
const dryRun = process.argv.includes('--dry-run') || process.argv.includes('-d');

console.log('vibe check', new Date(), dryRun ? '(dry run)' : '');

ConcertOwl.pushVibeRecommendations({ dryRun }).then((data) => {
  console.log('done', new Date(), data);
}).catch((err) => {
  console.log('error', err);
});
