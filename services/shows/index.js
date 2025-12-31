import fetch from 'node-fetch';
import { parse as nodeParser } from 'node-html-parser';
import cheerio from 'cheerio';
import { isBefore, parse, format } from 'date-fns';

const getShows = async ({ url }) => {
  const URL = url;
  const response = await fetch(URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'Connection': 'keep-alive',
      'Cookie': 'OptanonConsent=isIABGlobal=false&datestamp=Wed+Dec+31+2025+16%3A09%3A14+GMT-0500+(Eastern+Standard+Time)&version=202503.2.0&hosts=&landingPath=NotLandingPage&groups=C0001%3A1%2CC0002%3A1%2CC0003%3A1%2CC0004%3A1%2COSSTA_BG%3A1&geolocation=US%3BIL&AwaitingReconsent=false&isGpcEnabled=0&browserGpcFlag=0&consentId=b96cb3f1-23fb-4ccc-87f6-8a7ac9568ddf&interactionCount=0&isAnonUser=1&GPPCookiesCount=1; OptanonAlertBoxClosed=2025-04-04T17:45:18.074Z; OTGPPConsent=DBABLA~BVQqAAAAAAJY.QA',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Priority': 'u=0, i',
      'Pragma': 'no-cache',
      'Cache-Control': 'no-cache'
    }
  });
  const body = await response.text();
  const $ = cheerio.load(body);
  const shows = $('div#article-content').children('p').map((i, el) => {
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
