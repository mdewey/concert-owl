const { getShowsInDateRange } = require('./index');


describe('getShowsInDateRange', () => {
  test('should give shows in range', async () => {
    const shows = [
      { date: 'March 11', artist: 'Artist 3', venue: 'Venue 3' },
      { date: 'March 13', artist: 'Artist 4', venue: 'Venue 2' },
      { date: 'March 16', artist: 'Artist 5', venue: 'Venue 1' },
      { date: 'March 24', artist: 'Artist 5', venue: 'Venue 1' },
      { date: 'March 25', artist: 'Artist 5', venue: 'Venue 1' },
      { date: 'March 26', artist: 'Artist 5', venue: 'Venue 1' },
    ];
    const result = await getShowsInDateRange({
      date: 'march 11',
      range: 7,
      shows,
    });
    expect(result).toEqual([
      { date: 'March 11', artist: 'Artist 3', venue: 'Venue 3' },
      { date: 'March 13', artist: 'Artist 4', venue: 'Venue 2' },
      { date: 'March 16', artist: 'Artist 5', venue: 'Venue 1' },
    ]);
  });
  test('should wrap months', async () => {
    const shows = [
      { date: 'March 29', artist: 'Artist 5', venue: '1' },
      { date: 'April 4', artist: 'Artist 1', venue: '5' },
      { date: 'April 7', artist: 'Artist 2', venue: '4' },
    ];
    const result = await getShowsInDateRange({
      date: 'March 29',
      range: 7,
      shows,
    });
    expect(result).toEqual([
      { date: 'March 29', artist: 'Artist 5', venue: '1' },
      { date: 'April 4', artist: 'Artist 1', venue: '5' },
    ]);
  });
  test('should be good for longer months that are abbreviated', async () => {
    const shows = [
      { date: 'Sept. 4', artist: 'Artist 1', venue: 'Venue 5' },
      { date: 'Sept. 7', artist: 'Artist 2', venue: 'Venue 4' },
      { date: 'Sept. 10', artist: 'Artist 3', venue: 'Venue 3' },
    ];
    const result = await getShowsInDateRange({
      date: 'September 4',
      range: 4,
      shows,
    });
    expect(result).toEqual([
      { date: 'Sept. 4', artist: 'Artist 1', venue: 'Venue 5' },
      { date: 'Sept. 7', artist: 'Artist 2', venue: 'Venue 4' },
    ]);
  });
});

