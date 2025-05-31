import {
  parseShowsToJson,
  getShows,
  getNewShows,
  getShowsInDateRange,
} from './services/shows/index.js';
import { addShowsGenre } from './services/ai/index.js';
import * as slack from './services/slack/index.js';
import { getShowList, updateShowList } from './services/datastore/index.js';
import { format } from 'date-fns';

// eslint-disable-next-line max-len
const URL = 'https://triblive.com/aande/music/2025-pittsburgh-area-concert-calendar/';

export async function handler(event) {
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
}

export async function dailyRunner() {
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
}

export async function postNewShows() {
  const lastKnownShows = await getShowList({ url: URL });
  const shows = await getShows({ url: URL });
  const newShows = getNewShows({
    yesterday: lastKnownShows?.shows || [],
    today: shows.list,
  });
  const rv = await parseShowsToJson({ shows: newShows });

  const fullPackage = await addShowsGenre(rv);
  await slack.postShows({
    shows: fullPackage.map((show) =>
      `${show.date},  : `+
      `${show.artist} at ${show.venue} -- ${show.genre}`),
    totalShows: shows.list.length 
  });
  // // save todays shows
  console.log('new shows', fullPackage.map((show) =>
       `${show.date},  : `+
       `${show.artist} at ${show.venue} -- ${show.genre}`));
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
}

export async function pushWeeklySummaryV2() {
  const data = await getShows({ url: URL });
  const rv = await parseShowsToJson({ shows: data.list });
  const today = format(new Date(), 'MMMM d');

  const sorted = await getShowsInDateRange({ date: today, shows: rv });
  const fullPackage = await addShowsGenre(sorted);
  await slack.postShows({
    shows: fullPackage.map((show) =>
      `${show.dayOfWeek} - ${show.date},  : `+
      `${show.artist} at ${show.venue} -- ${show.genre}`),
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
}

export async function pushWeeklySummary() {
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
}

export async function searchByName(event) {
  const { name } = event.queryStringParameters;
  const { shows } = await getShowList({ url: URL });
  const found = shows.filter((show) => show.toLowerCase().includes(name.toLowerCase()));
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
}

export async function searchByDate(event) {
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
}
