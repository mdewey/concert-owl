const ConcertOwl = require('../index');

console.log('lets go', new Date()); // eslint-disable-line no-console
console.log(process.env)
ConcertOwl.pushWeeklySummary().then((data) => {
  console.log('data', data); // eslint-disable-line no-console
    console.log('done', new Date()); // eslint-disable-line no-console

}).catch((err) => {
    console.log('error', err); // eslint-disable-line no-console
    }
);
