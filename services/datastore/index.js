const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} = require('@aws-sdk/lib-dynamodb');

const { v4: uuidv4 } = require('uuid');

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

const createShowList = async ({ url, date, shows }) => {
  const ddbDocClient = DynamoDBDocumentClient.from(ddbClient, {
    marshallOptions,
    unmarshallOptions,
  });

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
  const ddbDocClient = DynamoDBDocumentClient.from(ddbClient, {
    marshallOptions,
    unmarshallOptions,
  });

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
  } else {
    const parsed = {
      ...rv,
      shows: rv.shows.map((show) => {
        const [date, ...theRest] = show.split(':');
        const details = theRest.join(':');
        const [artist, venue] = details.split(' at ');
        if (!date || !details || !artist || !venue) {
          console.log('error parsing show', show);
        }
        return {
          date: date?.trim(),
          artist: artist?.trim(),
          venue: venue?.trim(),
        };
      }),
    };
    return parsed;
  }
};

const updateShowList = async ({ id, date, shows }) => {
  const ddbDocClient = DynamoDBDocumentClient.from(ddbClient, {
    marshallOptions,
    unmarshallOptions,
  });


  const params = {
    'TableName': TABLE_NAME,
    'ReturnValues': 'ALL_NEW',
    'ExpressionAttributeValues': {
      ':d': date,
      ':s': shows,
    },
    'ExpressionAttributeNames': {
      '#D': 'date',
    },
    'Key': {
      'id': id,
    },
    'UpdateExpression': 'SET shows = :s, #D = :d',

  };

  const data = await ddbDocClient.send(new UpdateCommand(params));
  return data;
};


module.exports = {
  createShowList,
  getShowList,
  updateShowList,
};
