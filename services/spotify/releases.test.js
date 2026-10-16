import {
  parseEmbedTrackIds,
  groupByAlbumType,
  getAlbums,
  playlistUrl,
} from './index.js';

describe('playlistUrl', () => {
  const expected = 'https://open.spotify.com/playlist/37i9dQZEVXboYsEPYHGZdU';
  test('builds a share link from a raw id', () => {
    expect(playlistUrl('37i9dQZEVXboYsEPYHGZdU')).toEqual(expected);
  });
  test('strips the ?si= tracking param from a pasted share URL', () => {
    expect(playlistUrl(`${expected}?si=c35a7256f57a4ee0`)).toEqual(expected);
  });
});

const embedHtml = (trackList) =>
  '<html><script id="__NEXT_DATA__" type="application/json">' +
  JSON.stringify({ props: { pageProps: { state: { data: {
    entity: { name: 'Release Radar', trackList },
  } } } } }) +
  '</script></html>';

describe('parseEmbedTrackIds', () => {
  test('extracts track ids from the embed trackList', () => {
    const html = embedHtml([
      { uri: 'spotify:track:abc123' },
      { uri: 'spotify:track:def456' },
    ]);
    expect(parseEmbedTrackIds(html)).toEqual(['abc123', 'def456']);
  });
  test('skips non-track entries such as episodes', () => {
    const html = embedHtml([
      { uri: 'spotify:episode:xyz' },
      { uri: 'spotify:track:abc123' },
    ]);
    expect(parseEmbedTrackIds(html)).toEqual(['abc123']);
  });
  test('throws when the page has no __NEXT_DATA__ block', () => {
    expect(() => parseEmbedTrackIds('<html></html>')).toThrow('__NEXT_DATA__');
  });
  test('throws when the entity has no trackList', () => {
    expect(() => parseEmbedTrackIds(embedHtml(undefined))).toThrow('trackList');
  });
});

describe('groupByAlbumType', () => {
  test('groups in album, single, compilation order and drops empty groups', () => {
    const tracks = [
      { name: 'a', albumType: 'single' },
      { name: 'b', albumType: 'album' },
      { name: 'c', albumType: 'single' },
    ];
    expect(groupByAlbumType(tracks)).toEqual([
      { type: 'album', tracks: [tracks[1]] },
      { type: 'single', tracks: [tracks[0], tracks[2]] },
    ]);
  });
  test('keeps unknown album types at the end', () => {
    const tracks = [{ name: 'x', albumType: 'mystery' }];
    expect(groupByAlbumType(tracks)).toEqual([
      { type: 'mystery', tracks },
    ]);
  });
  test('returns [] for no tracks', () => {
    expect(groupByAlbumType([])).toEqual([]);
  });
});

describe('getAlbums', () => {
  const track = (overrides) => ({
    albumType: 'album',
    albumName: 'Record',
    albumArtists: ['Band'],
    albumUrl: 'https://open.spotify.com/album/1',
    albumTotalTracks: 10,
    releaseDate: '2026-10-16',
    ...overrides,
  });

  test('returns one entry per album even with several tracks from it', () => {
    expect(getAlbums([track(), track({ name: 'second song' })])).toEqual([{
      name: 'Record',
      artists: ['Band'],
      url: 'https://open.spotify.com/album/1',
      totalTracks: 10,
      releaseDate: '2026-10-16',
    }]);
  });
  test('ignores singles and compilations', () => {
    expect(getAlbums([
      track({ albumType: 'single' }),
      track({ albumType: 'compilation' }),
    ])).toEqual([]);
  });
  test('keeps distinct albums in playlist order', () => {
    const albums = getAlbums([
      track({ albumName: 'B', albumUrl: 'u/b' }),
      track({ albumName: 'A', albumUrl: 'u/a' }),
    ]);
    expect(albums.map((a) => a.name)).toEqual(['B', 'A']);
  });
});
