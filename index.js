import {
  parseShowsToJson,
  getShows,
  getNewShows,
  getShowsInDateRange,
} from './services/shows/index.js';
import { addShowsGenre, narrowRecommendations } from './services/ai/index.js';
import {
  getVibe,
  matchBandToVibe,
  getPlaylistReleases,
  groupByAlbumType,
  getAlbums,
  playlistUrl,
} from './services/spotify/index.js';
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

  return { createdShow: createdShow.id };
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

export async function pushVibeRecommendations({ dryRun = false } = {}) {
  const data = await getShows({ url: URL });
  const parsed = await parseShowsToJson({ shows: data.list });
  const today = format(new Date(), 'MMMM d');
  const thisWeek = await getShowsInDateRange({ date: today, shows: parsed });

  const vibe = await getVibe();
  console.log('vibe profile', {
    artists: vibe.artistCount,
    genres: vibe.genres.length,
  });

  // Match each unique headliner against the (full) vibe genre set. Cache by
  // name so repeat artists don't re-hit Spotify, and never let one bad lookup
  // sink the whole run.
  const cache = new Map();
  const matches = [];
  for (const show of thisWeek) {
    const headliner = show.artist?.split(',')[0].trim();
    if (!headliner) continue;
    if (!cache.has(headliner)) {
      try {
        cache.set(headliner, await matchBandToVibe({ name: headliner, vibe }));
      } catch (err) {
        console.error('vibe match failed for', headliner, err.message);
        cache.set(headliner, { isMatch: false, overlap: [] });
      }
    }
    const result = cache.get(headliner);
    if (result.isMatch) {
      matches.push({ ...show, artist: headliner, overlap: result.overlap });
    }
  }
  console.log(`vibe matches: ${matches.length} of ${thisWeek.length} shows`);

  if (!matches.length) {
    console.log('no vibe matches this week; nothing to post');
    return { matches: 0, recommended: 0 };
  }

  // Wide matching returns a lot; let the AI narrow to the strongest picks.
  const recommendations = await narrowRecommendations({ matches, vibe });

  if (dryRun) {
    console.log('[dry run] not posting to Slack; recommendations:');
    for (const r of recommendations) {
      console.log(
        `  • ${r.artist} at ${r.venue} (${r.date})` +
        (r.reason ? ` — ${r.reason}` : ''));
    }
  } else {
    await slack.postRecommendations({ recommendations });
  }

  return {
    matches: matches.length,
    recommended: recommendations.length,
    dryRun,
  };
}

export async function pushReleaseRadar({ dryRun = false } = {}) {
  const playlistId = process.env.RELEASE_RADAR_PLAYLIST_ID;
  const tracks = await getPlaylistReleases(playlistId);
  // An empty list means the embed scrape broke; fail so OnFailure alerts.
  if (!tracks.length) {
    throw new Error('Release Radar returned 0 tracks');
  }
  const groups = groupByAlbumType(tracks);
  const albums = getAlbums(tracks);

  if (dryRun) {
    console.log('[dry run] not posting to Slack; release radar:');
    console.log(`  open: ${playlistUrl(playlistId)}`);
    console.log(`  full albums out (${albums.length})`);
    for (const a of albums) {
      console.log(
        `    • ${a.name} — ${a.artists.join(', ')} ` +
        `(${a.totalTracks} tracks, ${a.releaseDate}) ${a.url}`);
    }
    for (const g of groups) {
      console.log(`  ${g.type} (${g.tracks.length})`);
      for (const t of g.tracks) {
        console.log(
          `    • ${t.name} — ${t.artists.join(', ')} [${t.albumName}]`);
      }
    }
  } else {
    await slack.postReleaseRadar({
      groups,
      albums,
      playlistUrl: playlistUrl(playlistId),
    });
  }

  return {
    tracks: tracks.length,
    albumsOut: albums.length,
    ...Object.fromEntries(groups.map((g) => [g.type, g.tracks.length])),
    dryRun,
  };
}
