const AWS = require('aws-sdk');
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");

const { v4: uuidv4 } = require('uuid');

const ACCESS_KEY = process.env.ACCESS_KEY;
const SECRET_KEY = process.env.SECRET_KEY;
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

const createShowList = async ({ url, date, shows }) => {
  const ddbClient = new DynamoDBClient({ region: REGION });

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
    }
  };

  const data = await ddbDocClient.send(new PutCommand(params));
  return data;
}

const getShowList = async ({ url }) => {

  const ddbClient = new DynamoDBClient({ region: REGION });

  const ddbDocClient = DynamoDBDocumentClient.from(ddbClient, {
    marshallOptions,
    unmarshallOptions,
  });

  const params = {
    KeyConditionExpression: "source_url  = :s",
    ExpressionAttributeValues: {
      ":s": url,
    },
    IndexName: "source_url-index",
    TableName: TABLE_NAME,
  };


  const data = await ddbClient.send(new QueryCommand(params));
  console.log({ data })
  return data;
}



module.exports = {
  createShowList,
  getShowList,
}