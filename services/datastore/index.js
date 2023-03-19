const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const ACCESS_KEY = process.env.ACCESS_KEY;
const SECRET_KEY = process.env.SECRET_KEY;
const REGION = process.env.REGION || 'us-east-1';



const createShowList = (date, shows) => {
  console.log('keys', { ACCESS_KEY, SECRET_KEY, REGION })

  return new Promise((resolve, reject) => {
    const docClient = new AWS.DynamoDB.DocumentClient({
      region: REGION,
      accessKeyId: ACCESS_KEY,
      secretAccessKey: SECRET_KEY
    });

    const params = {
      TableName: 'owl-dev',
      Item: {
        date,
        shows,
        id: uuidv4()
      }
    };

    docClient.put(params, (err, data) => {
      console.log({ err, data })
      if (err) {
        console.log({ err });
        reject(err);
      } else {
        console.log({ data });
        resolve(data);
      }
    });
  });
}


module.exports = {
  createShowList
}