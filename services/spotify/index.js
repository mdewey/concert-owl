/**
 * Spotify service — reads a PUBLIC playlist and artist genres to build a
 * "current vibe" profile (your top genres), then lets callers check whether a
 * given band fits that vibe.
 *
 * Auth: Client Credentials flow only (app token from client id + secret). This
 * is enough for public data — public playlists and artist info. It does NOT
 * grant access to your private listening history, which is why no user OAuth /
 * refresh token is needed here. Curate a public playlist as your "vibe" and the
 * bot reads it.
 *
 * Required env:
 *   SPOTIFY_CLIENT_ID
 *   SPOTIFY_CLIENT_SECRET
 *   SPOTIFY_PLAYLIST_ID   (id or full URL of your public "vibe" playlist)
 */
import fetch from 'node-fetch';

const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const API_BASE = 'https://api.spotify.com/v1';

const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = process.env;

// Cache the app token in-process; it lives ~1h, so reuse it across calls.
let cachedToken = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }
  const basic = Buffer
    .from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)
    .toString('base64');
  const resp = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!resp.ok) {
    throw new Error(
      `Spotify token request failed: ${resp.status} ${await resp.text()}`);
  }
  const data = await resp.json();
  cachedToken = data.access_token;
  // Refresh a minute early to avoid races with an about-to-expire token.
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

async function spotifyGet(path) {
  const token = await getAccessToken();
  const resp = await fetch(`${API_BASE}${path}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!resp.ok) {
    throw new Error(
      `Spotify GET ${path} failed: ${resp.status} ${await resp.text()}`);
  }
  return resp.json();
}

/** Accept a raw id, a spotify: URI, or an open.spotify.com URL. */
export function parsePlaylistId(idOrUrl) {
  if (!idOrUrl) return idOrUrl;
  const uriMatch = idOrUrl.match(/playlist[:/]([a-zA-Z0-9]+)/);
  return uriMatch ? uriMatch[1] : idOrUrl;
}

/** Page through a playlist and return its unique artists ({ id, name }). */
async function getPlaylistArtists(playlistId) {
  const id = parsePlaylistId(playlistId);
  const byId = new Map();
  let next =
    `/playlists/${id}/tracks` +
    `?fields=items(track(artists(id,name))),next&limit=100`;
  while (next) {
    // After the first page, `next` is an absolute URL; strip the base.
    const path = next.startsWith('http') ? next.replace(API_BASE, '') : next;
    const page = await spotifyGet(path);
    for (const item of page.items || []) {
      for (const artist of item.track?.artists || []) {
        if (artist.id) byId.set(artist.id, { id: artist.id, name: artist.name });
      }
    }
    next = page.next;
  }
  return [...byId.values()];
}

/** Look up genres for many artist ids (batched 50 per request). */
async function getArtistsGenres(artistIds) {
  const genresById = new Map();
  for (let i = 0; i < artistIds.length; i += 50) {
    const batch = artistIds.slice(i, i + 50);
    const data = await spotifyGet(`/artists?ids=${batch.join(',')}`);
    for (const artist of data.artists || []) {
      genresById.set(artist.id, artist.genres || []);
    }
  }
  return genresById;
}

/**
 * Build the "vibe" profile from the configured playlist: a genre -> count map
 * (how many of the playlist's artists carry each genre) plus the artist names.
 */
export async function getVibe({ playlistId = process.env.SPOTIFY_PLAYLIST_ID } = {}) {
  const artists = await getPlaylistArtists(playlistId);
  const genresById = await getArtistsGenres(artists.map((a) => a.id));

  const genreCounts = {};
  for (const genres of genresById.values()) {
    for (const genre of genres) {
      genreCounts[genre] = (genreCounts[genre] || 0) + 1;
    }
  }
  const genres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([genre, count]) => ({ genre, count }));

  return {
    genres, // sorted most-common first
    genreSet: new Set(genres.map((g) => g.genre)),
    artistNames: artists.map((a) => a.name),
    artistCount: artists.length,
  };
}

/** Find a band on Spotify by name and return its genres ([] if not found). */
export async function getBandGenres(name) {
  const q = encodeURIComponent(name);
  const data = await spotifyGet(`/search?type=artist&limit=1&q=${q}`);
  const artist = data.artists?.items?.[0];
  return artist?.genres || [];
}

/**
 * Score how well a band fits the vibe: returns the overlapping genres between
 * the band and the vibe profile. An empty array means no match.
 */
export async function matchBandToVibe({ name, vibe }) {
  const bandGenres = await getBandGenres(name);
  const overlap = bandGenres.filter((g) => vibe.genreSet.has(g));
  return { name, bandGenres, overlap, isMatch: overlap.length > 0 };
}
