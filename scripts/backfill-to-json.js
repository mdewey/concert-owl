/**
 * Phase 2 of the migration: copy every existing DynamoDB record into the JSON
 * store. Safe to re-run — it replaces the JSON file with a fresh dump.
 *
 *   npm run backfill
 */
import * as dynamo from '../services/datastore/dynamo-store.js';
import * as json from '../services/datastore/json-store.js';

const run = async () => {
  console.log('Scanning DynamoDB...');
  const items = await dynamo.scanAll();
  console.log(`Fetched ${items.length} record(s). Writing JSON store...`);
  const count = await json.replaceAll(items);
  console.log(`Backfill complete: ${count} record(s) written.`);
};

run().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
