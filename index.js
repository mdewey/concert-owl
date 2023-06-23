const { getShows, getNewShows, getShowsInDateRange } = require('./services/shows');

const slack = require('./services/slack');
const { createShowList, getShowList, updateShowList } = require('./services/datastore');
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

module.exports.dailyRunner = async () => {
  const lastKnownShows = await getShowList({ url: URL });
  const shows = await getShows({ url: URL });
  const newShows = getNewShows({
    yesterday: lastKnownShows?.shows || [],
    today: shows.list,
  });
  await slack.postShows({ shows: newShows, totalShows: shows.list.length });
  // // save todays shows
  const today = format(new Date(), 'yyyy-MM-dd');
  const createdShow = await updateShowList({
    id: lastKnownShows.id,
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

module.exports.searchByName = async (event) => {
  const { name } = event.queryStringParameters;
  const { shows } = await getShowList({ url: URL });
  const found = shows
    .filter((show) => show.toLowerCase().includes(name.toLowerCase()));
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        found,
      },
      null,
      2,
    ),
  };
};

module.exports.searchByDate = async (event) => {
  console.log({ event });
  // get date from query string
  const { date, range = 7 } = event.queryStringParameters;
  const { shows } = await getShowList({ url: URL, convertToObject: true });
  console.log({ date }, shows.length);
  const found = await getShowsInDateRange({ date, shows, range });
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        found,
      },
      null,
      2,
    ),
  };
};
