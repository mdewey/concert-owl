import * as ConcertOwl from '../index.js';

console.log('lets go', new Date()); // eslint-disable-line no-console

ConcertOwl.pushWeeklySummaryV2().then((data) => {
  // console.log('data', data);
  console.log('done', new Date());
}).catch((err) => {
  console.log('error', err);
});

