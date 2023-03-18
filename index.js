const { getShows } = require('./services/shows');
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const slack = require('./services/slack');

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

