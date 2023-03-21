const { getShows, getNewShows } = require('./services/shows');
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const slack = require('./services/slack');
const { createShowList, getShowList } = require('./services/datastore');
const format = require('date-fns/format');

// eslint-disable-next-line max-len
const URL = 'https://triblive.com/aande/music/pittsburgh-area-concert-calendar-2/';


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
  const lastKnownShows = await getShowList({ url: URL });
  const shows = await getShows({ url: URL });
  const newShows = getNewShows({
    yesterday: lastKnownShows?.shows || [],
    today: shows.list,
  });
  console.log({ lastKnownShows, shows, newShows });
  slack.postShows({ shows: newShows });
  // // save todays shows
  const today = format(new Date(), 'yyyy-MM-dd');
  const createdShow = await createShowList({
    url: URL,
    date: today,
    shows: shows.list,
  });

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        createdShow,
        newShows,
      },
      null,
      2,
    ),
  };
};

module.exports.test = async (event) => {
  const rv = await createShowList('2019-01-01', ['show1', 'show2']);
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
};
