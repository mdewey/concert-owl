import { chunkLines } from './index.js';

describe('chunkLines', () => {
  test('keeps short input in one chunk', () => {
    expect(chunkLines(['a', 'b'])).toEqual(['a\nb']);
  });
  test('splits on line boundaries when over the limit', () => {
    expect(chunkLines(['aaaa', 'bbbb', 'cc'], 9)).toEqual(['aaaa\nbbbb', 'cc']);
  });
  test('returns [] for no lines', () => {
    expect(chunkLines([])).toEqual([]);
  });
});
