const {
  parseShowsToJson,
  getShows,
  getNewShows,
  getShowsInDateRange } = require('./services/shows');

const slack = require('./services/slack');
const { getShowList, updateShowList } = require('./services/datastore');
const format = require('date-fns/format');

// eslint-disable-next-line max-len
const URL = 'https://triblive.com/aande/music/2025-pittsburgh-area-concert-calendar/';


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
    id: lastKnownShows?.id,
    date: today,
    shows: shows.list,
  });

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        createdShow: createdShow.Attributes.id,
      },
      null,
      2,
    ),
  };
};

module.exports.pushWeeklySummary = async () => {
  const data = await getShows({ url: URL });
  const rv = await parseShowsToJson({ shows: data.list });
  const today = format(new Date(), 'MMMM d');

  const sorted = await getShowsInDateRange({ date: today, shows: rv });
  await slack.postShows({
    shows: sorted.map((show) => `${show.date} :  ${show.artist} at ${show.venue}`),
    title: 'This week shows!',
    totalShows: sorted.length,
    slackUrl: process.env.WEEKLY_SLACK_URL });

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        totalShows: sorted.length,
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
  // get date from query string
  const { date, range = 7 } = event.queryStringParameters;
  const { shows } = await getShowList({ url: URL, convertToObject: true });
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
