const { getNewShows } = require('./index');

describe('getNewShows', () => {
  test('should return new shows when there are new shows today vs tomorrow', () => {
    const today = ['show1', 'show2', 'show3', 'show4'];
    const yesterday = ['show1', 'show2', 'show3'];
    const newShows = getNewShows({ yesterday, today });
    expect(newShows).toEqual(['show4']);
  });
  test('should return empty array when there are no new shows today vs tomorrow', () => {
    const today = ['show1', 'show2', 'show3'];
    const yesterday = ['show1', 'show2', 'show3'];
    const newShows = getNewShows({ yesterday, today });
    expect(newShows).toEqual([]);
  });
});

