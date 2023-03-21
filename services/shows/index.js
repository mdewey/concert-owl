const fetch = require('node-fetch');
const { parse } = require('node-html-parser');
const cheerio = require('cheerio');


module.exports.getShows = async ({ url }) => {
  const URL = url;
  const response = await fetch(URL);
  const body = await response.text();

  const $ = cheerio.load(body);
  const shows = $('div#storyContent').children('p').map((i, el) => {
    const text = $(el).toString();
    const item = parse(text);
    const inner = item.innerText.replace('\n', '');
    return inner;
  }).get()
    .filter((item) => {
      const [date, show] = item.split(':');
      return item.includes(':') && date.length > 0 && show.length > 0;
    }).map((item) => {
      return item.trim();
    });
  return {
    list: shows,
    count: shows.length,
  };
};

module.exports.getNewShows = ({ yesterday, today }) => {
  // build hash of yesterday
  const yesterdayHash = {};
  yesterday.forEach((show) => {
    yesterdayHash[show] = true;
  });
  // iteration over today and if not in yesterday, add to newShows
  const newShows = [];
  today.forEach((show) => {
    if (!yesterdayHash[show]) {
      newShows.push(show);
    }
  });
  return newShows;
};
