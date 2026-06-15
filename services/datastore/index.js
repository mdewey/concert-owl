/**
 * Datastore facade — orchestrates a dual-write migration from DynamoDB to a
 * local JSON file. Callers (getShowList / updateShowList / createShowList) are
 * unchanged; behaviour is selected by the DATASTORE_MODE env var:
 *
 *   dynamo-only             read + write DynamoDB only (pre-migration baseline)
 *   dual-write-read-dynamo  write BOTH, read DynamoDB  (Phase 1 — default)
 *   dual-write-read-json    write BOTH, read JSON       (Phase 3 — after backfill)
 *   json-only               read + write JSON only      (Phase 4 — migration done)
 *
 * In the dual modes, writes go to the primary (source of truth) first and its
 * result is returned; the secondary is written best-effort. Reads come from the
 * primary, and a shadow read of the secondary runs in the background to log any
 * drift — that comparison is the whole point of practicing the migration.
 */
import { v4 as uuidv4 } from 'uuid';
import * as dynamo from './dynamo-store.js';
import * as json from './json-store.js';

const MODES = {
  'dynamo-only': { primary: dynamo, secondary: null },
  'dual-write-read-dynamo': { primary: dynamo, secondary: json },
  'dual-write-read-json': { primary: json, secondary: dynamo },
  'json-only': { primary: json, secondary: null },
};

const MODE = process.env.DATASTORE_MODE || 'dual-write-read-dynamo';
const { primary, secondary } = MODES[MODE] || MODES['dual-write-read-dynamo'];

if (!MODES[MODE]) {
  console.warn(
    `[datastore] unknown DATASTORE_MODE "${MODE}", ` +
    `falling back to dual-write-read-dynamo`);
} else {
  console.log(`[datastore] mode: ${MODE}`);
}

const primaryName = primary === dynamo ? 'dynamo' : 'json';
const secondaryName = secondary === dynamo ? 'dynamo' : 'json';

/** Run a write against the primary (returned) then the secondary (best-effort). */
async function dualWrite(method, args) {
  // On a brand-new record there's no id yet. Pin one here (rather than letting
  // each store invent its own) so DynamoDB gets a valid Key AND both stores
  // create the record under the same id — no drift in the shadow-read compare.
  if (method === 'updateShowList' && !args.id) {
    args = { ...args, id: uuidv4() };
  }
  const result = await primary[method](args);
  if (secondary) {
    try {
      await secondary[method](args);
    } catch (err) {
      console.error(
        `[datastore] secondary (${secondaryName}) ${method} failed, ` +
        `continuing on primary (${primaryName}):`, err.message);
    }
  }
  return result;
}

/** Compare a primary record against the secondary's and log any drift. */
function compareReads(primaryRv, secondaryRv) {
  const norm = (r) => r ? JSON.stringify({ id: r.id, date: r.date, shows: r.shows }) : null;
  if (norm(primaryRv) === norm(secondaryRv)) {
    console.log(`[datastore] shadow read OK (${primaryName} == ${secondaryName})`);
  } else {
    console.warn(
      `[datastore] shadow read DRIFT (${primaryName} != ${secondaryName})`,
      { primary: primaryRv, secondary: secondaryRv });
  }
}

const createShowList = (args) => dualWrite('createShowList', args);
const updateShowList = (args) => dualWrite('updateShowList', args);

const getShowList = async (args) => {
  const result = await primary.getShowList(args);
  if (secondary) {
    // Fire-and-forget so a slow/failing secondary never blocks the real read.
    secondary.getShowList(args)
      .then((other) => compareReads(result, other))
      .catch((err) => console.error(
        `[datastore] shadow read (${secondaryName}) failed:`, err.message));
  }
  return result;
};

export { createShowList, getShowList, updateShowList };
