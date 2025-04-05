require('dotenv').config();
console.log(process.env); // remove this after you've confirmed it is working
const ConcertOwl = require('../index');

console.log('lets go'); // eslint-disable-line no-console
ConcertOwl.pushWeeklySummary();
console.log('done'); // eslint-disable-line no-console
