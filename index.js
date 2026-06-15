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
    totalShows: shows.list.length,
  });
  console.log('new shows', fullPackage.map((show) =>
    `${show.date},  : `+
       `${show.artist} at ${show.venue} -- ${show.genre}`));
  const today = format(new Date(), 'yyyy-MM-dd');
  const createdShow = await updateShowList({
    id: lastKnownShows?.id,
    url: URL,
    date: today,
    shows: shows.list,
  });

  return { createdShow: createdShow.Attributes.id };
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
    totalShows: fullPackage.length,
    slackUrl: process.env.WEEKLY_SLACK_URL });

  console.log('this week in shows', {
    totalShows: sorted.length,
    fullPackage: fullPackage.length,
  });

  return { totalShows: sorted.length };
}
