/**
 * JSON file-backed datastore. Mirrors the DynamoDB store's interface so the two
 * can run side-by-side during the dual-write migration.
 *
 * Records are stored as a flat array, one object per show-list snapshot:
 *   { id, date, shows, source_url }
 * which matches the shape DynamoDB returned.
 *
 * Override the file location with JSON_STORE_PATH (handy for tests).
 */
import { readFile, writeFile, rename, mkdir } from 'fs/promises';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const DATA_FILE = process.env.JSON_STORE_PATH ||
  resolve(dirname(fileURLToPath(import.meta.url)), '../../data/shows.json');

async function readAll() {
  try {
    return JSON.parse(await readFile(DATA_FILE, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function writeAll(records) {
  await mkdir(dirname(DATA_FILE), { recursive: true });
  const tmp = `${DATA_FILE}.tmp`;
  await writeFile(tmp, JSON.stringify(records, null, 2), 'utf8');
  await rename(tmp, DATA_FILE); // atomic swap: avoids a half-written file on power loss
}

const createShowList = async ({ url, date, shows }) => {
  const records = await readAll();
  const item = { id: uuidv4(), date, shows, source_url: url };
  records.push(item);
  await writeAll(records);
  return item;
};

const getShowList = async ({ url }) => {
  const records = await readAll();
  return records.find((r) => r.source_url === url);
};

const updateShowList = async ({ id, url, date, shows }) => {
  const records = await readAll();
  let item = records.find((r) => r.id === id);
  if (item) {
    item.date = date;
    item.shows = shows;
    if (url !== undefined) item.source_url = url; // keep lookup key fresh
  } else {
    // DynamoDB's UpdateCommand upserts when the key is absent; mirror that.
    // source_url must be stored or getShowList({ url }) can never find it.
    item = { id: id || uuidv4(), date, shows, source_url: url };
    records.push(item);
  }
  await writeAll(records);
  return { Attributes: item }; // matches DynamoDB ReturnValues: 'ALL_NEW'
};

/**
 * Replace the entire store with the given records. Used by the backfill script
 * to seed the JSON store from a DynamoDB dump.
 */
const replaceAll = async (records) => {
  await writeAll(records);
  return records.length;
};

export { createShowList, getShowList, updateShowList, replaceAll };
