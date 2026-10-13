/**
 * Datastore facade. Show history lives in a local JSON file; this module is the
 * single seam callers import through, so the backing store can change again
 * without touching them.
 *
 * Override the file location with JSON_STORE_PATH (defaults to
 * ./data/shows.json). That file is the only copy of the history — keep it
 * backed up.
 */
export { createShowList, getShowList, updateShowList } from './json-store.js';
