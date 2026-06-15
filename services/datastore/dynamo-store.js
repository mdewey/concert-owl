/**
 * DynamoDB-backed datastore (the original implementation).
 *
 * Kept alongside json-store.js during the migration so both can be written to
 * and compared. See ./index.js for the dual-write orchestration.
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { convertToObjects } from './shared.js';

const REGION = process.env.REGION || 'us-east-1';
const TABLE_NAME = process.env.TABLE_NAME || 'owl-dev';

const marshallOptions = {
  convertEmptyValues: false, // false, by default.
  removeUndefinedValues: true, // false, by default.
  convertClassInstanceToMap: false, // false, by default.
};

const unmarshallOptions = {
  wrapNumbers: false, // false, by default.
};

const ddbClient = new DynamoDBClient({
  region: REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_KEY,
  },
});

const ddbDocClient = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions,
  unmarshallOptions,
});

const createShowList = async ({ url, date, shows }) => {
  const params = {
    TableName: TABLE_NAME,
    Item: {
      date,
      shows,
      id: uuidv4(),
      source_url: url,
    },
  };

  const data = await ddbDocClient.send(new PutCommand(params));
  return data;
};

const getShowList = async ({ url, convertToObject = false }) => {
  const params = {
    KeyConditionExpression: 'source_url  = :s',
    ExpressionAttributeValues: {
      ':s': url,
    },
    IndexName: 'source_url-index',
    TableName: TABLE_NAME,
  };

  const data = await ddbDocClient.send(new QueryCommand(params));
  const rv = data.Items[0];
  if (!convertToObject) {
    return rv;
  }
  return convertToObjects(rv);
};

const updateShowList = async ({ id, url, date, shows }) => {
  // UpdateCommand upserts when the key is absent, so a freshly generated id
  // creates the record. Persist source_url too (only when provided, to keep the
  // expression valid) so getShowList({ url }) can find it next run.
  const names = { '#D': 'date' };
  const values = { ':d': date, ':s': shows };
  let updateExpression = 'SET shows = :s, #D = :d';
  if (url !== undefined) {
    names['#U'] = 'source_url';
    values[':u'] = url;
    updateExpression += ', #U = :u';
  }

  const params = {
    'TableName': TABLE_NAME,
    'ReturnValues': 'ALL_NEW',
    'ExpressionAttributeValues': values,
    'ExpressionAttributeNames': names,
    'Key': {
      'id': id,
    },
    'UpdateExpression': updateExpression,
  };

  const data = await ddbDocClient.send(new UpdateCommand(params));
  return data;
};

/**
 * Read every item in the table (paginating through Scan). Used by the backfill
 * script to seed the JSON store from existing DynamoDB data.
 */
const scanAll = async () => {
  const items = [];
  let ExclusiveStartKey;
  do {
    const data = await ddbDocClient.send(new ScanCommand({
      TableName: TABLE_NAME,
      ExclusiveStartKey,
    }));
    items.push(...(data.Items || []));
    ExclusiveStartKey = data.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return items;
};

export { createShowList, getShowList, updateShowList, scanAll };
