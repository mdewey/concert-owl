require('dotenv').config();
const ConcertOwl = require('../index');

console.log('lets go'); // eslint-disable-line no-console
ConcertOwl.pushWeeklySummary();
console.log('done'); // eslint-disable-line no-console
