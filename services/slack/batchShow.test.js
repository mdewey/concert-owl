const { batchShows } = require('./index');

describe('batchShows', () => {
  test('should return empty array when there are no new shows today', () => {
    const shows = [];
    const batched = batchShows({ shows });
    expect(batched).toEqual([]);
  });
  test('should return an array of array of 1 if between 1 and 40 shows', () => {
    const shows = ['show1', 'show2', 'show3'];
    const batched = batchShows({ shows });
    expect(batched).toEqual([['show1', 'show2', 'show3']]);
  });
  test('should return an array of array of 2 if between 41 and 80 shows', () => {
    const shows = [...new Array(65).map((_, i) => `show${i}`)];
    const batched = batchShows({ shows });
    expect(batched.length).toEqual(2);
    expect(batched[0].length).toEqual(40);
    expect(batched[1].length).toEqual(25);
  });
  test('should return an array of array of 3 if between 81 and 120 shows', () => {
    const shows = [...new Array(100).map((_, i) => `show${i}`)];
    const batched = batchShows({ shows });
    expect(batched.length).toEqual(3);
    expect(batched[0].length).toEqual(40);
    expect(batched[1].length).toEqual(40);
    expect(batched[2].length).toEqual(20);
  });
});

