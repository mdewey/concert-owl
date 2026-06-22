import * as ConcertOwl from '../index.js';

console.log('vibe check', new Date()); // eslint-disable-line no-console

ConcertOwl.pushVibeRecommendations().then((data) => {
  console.log('done', new Date(), data);
}).catch((err) => {
  console.log('error', err);
});
