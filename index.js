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

  // Guard: a failed/empty scrape must never overwrite a good baseline. If we
  // saved [] here, the next run would treat every show as "new" — which is
  // exactly how this pipeline wedged itself before.
  if (!shows.list.length) {
    console.warn(
      '[postNewShows] scrape returned 0 shows; skipping save to preserve ' +
      'the known-shows baseline');
    return { createdShow: lastKnownShows?.id, skipped: true };
  }

  const newShows = getNewShows({
    yesterday: lastKnownShows?.shows || [],
    today: shows.list,
  });

  // Persist the baseline BEFORE the AI/Slack work. Those steps are best-effort
  // notification; if they throw, an unsaved baseline would make every show look
  // "new" on the next run, snowballing into ever-larger (and still-failing)
  // Slack posts. Saving first breaks that self-perpetuating failure.
  const today = format(new Date(), 'yyyy-MM-dd');
  const createdShow = await updateShowList({
    id: lastKnownShows?.id,
    url: URL,
    date: today,
    shows: shows.list,
  });

  const rv = await parseShowsToJson({ shows: newShows });
  const fullPackage = await addShowsGenre(rv);
  try {
    await slack.postShows({
      shows: fullPackage.map((show) =>
        `${show.date},  : `+
        `${show.artist} at ${show.venue} -- ${show.genre}`),
      totalShows: shows.list.length,
    });
  } catch (err) {
    console.error(
      '[postNewShows] Slack post failed (baseline already saved):',
      err.message);
  }
  console.log('new shows', fullPackage.map((show) =>
    `${show.date},  : `+
       `${show.artist} at ${show.venue} -- ${show.genre}`));

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
