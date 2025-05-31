import dotenv from 'dotenv';
import * as ConcertOwl from '../index.js';

console.log('lets go', new Date());
ConcertOwl.postNewShows().then((data) => {
  console.log('data', data);
  console.log('done', new Date());
}).catch((err) => {
  console.log('error', err);
});
