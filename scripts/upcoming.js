require('dotenv').config();
const ConcertOwl = require('../index');

console.log('lets go', new Date()); 
ConcertOwl.dailyRunner().then((data) => {
    console.log('data', data); 
    console.log('done', new Date()); 
}).catch((err) => {
    console.log('error', err); 
    }
);
