import fetch from 'node-fetch';
import { parse as nodeParser } from 'node-html-parser';
import cheerio from 'cheerio';
import { isBefore, parse, format } from 'date-fns';

const getShows = async ({ url }) => {
  const URL = url;
  const response = await fetch(URL);
  const body = await response.text();

  const $ = cheerio.load(body);
  const shows = $('div#storyContent').children('p').map((i, el) => {
    const text = $(el).toString();
    const item = nodeParser(text);
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

const getMonthFromDateString = (dateString) => {
  const [month] = dateString.split(' ');
  if (month.includes('Jan')) return 'January';
  if (month.includes('Feb')) return 'February';
  if (month.includes('Mar')) return 'March';
  if (month.includes('Apr')) return 'April';
  if (month.includes('May')) return 'May';
  if (month.includes('Jun')) return 'June';
  if (month.includes('Jul')) return 'July';
  if (month.includes('Aug')) return 'August';
  if (month.includes('Sep')) return 'September';
  if (month.includes('Oct')) return 'October';
  if (month.includes('Nov')) return 'November';
  if (month.includes('Dec')) return 'December';
  return month;
};

export { getShows };
export const getNewShows = ({ yesterday, today }) => {
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

export const getShowsInDateRange = async ({ date, range = 7, shows }) => {
  // get date 7 days in the future
  const result = parse(date, 'MMMM d', new Date());
  const startDate = new Date(result);
  startDate.setDate(startDate.getDate() - 1);
  const endDate = new Date(result);
  endDate.setDate(endDate.getDate() + range);
  // filter shows by date range
  const found = shows
    .filter((show) => {
      const fullShowDate =
        `${getMonthFromDateString(show.date)} ${show.date.split(' ')[1]}`;
      const mask = 'MMMM d';
      const parsedShowDate = parse(fullShowDate, mask, new Date());
      const startDateIsBeforeShow = isBefore(startDate, parsedShowDate);
      const showIsBeforeEndDate = isBefore(parsedShowDate, endDate);
      return startDateIsBeforeShow && showIsBeforeEndDate;
    });
  // return shows
  return found;
};

export const parseShowsToJson = async ({ shows = [] }) => {
  return shows.map((show) => {
    const [date, ...theRest] = show.split(':');
    const details = theRest.join(':');
    const [artist, venue] = details.split(' at ');
    if (!date || !details || !artist || !venue) {
      console.log('error parsing show', show);
    }
    let dayOfWeek;
    try {
      const parsed = parse(date
        .replace('.', '')
        .replace('Sept', 'Sep'), 'MMMM d', new Date());
      dayOfWeek = format(parsed, 'EEEE');
    } catch (err) {
      console.log('error parsing date', date, err);
    }
    return {
      date: date?.trim(),
      dayOfWeek,
      artist: artist?.trim(),
      venue: venue?.trim(),
    };
  });
};
