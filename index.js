const { getShows } = require('./services/shows');
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const slack = require('./services/slack');
const { createShowList } = require('./services/datastore');
const format = require('date-fns/format')

module.exports.handler = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        'message': 'all good, for once',
      },
      null,
      2,
    ),
  };
};

module.exports.getShows = async (event) => {
  const shows = await getShows();
  slack.postShows({ shows: shows.list });
  // save todays shows 
  const today = format(new Date(), 'yyyy-MM-dd');
  await createShowList(today, shows.list);
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        shows,
      },
      null,
      2,
    ),
  };
};

module.exports.test = async (event) => {
  const rv = await createShowList('2019-01-01', ['show1', 'show2']);
  console.log({ rv });
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        rv,
      },
      null,
      2,
    ),
  };
}
