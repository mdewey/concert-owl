import { GoogleGenAI } from '@google/genai';

const { GEMINI_API_KEY } = process.env;

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

let debug = false;

const setDebug = (enabled) => {
  debug = enabled;
};

const log = (...args) => {
  if (debug) console.log('[AI]', ...args);
};

const addShowsGenre = async (shows) => {
  log(`Processing ${shows.length} shows`);
  const start = Date.now();
  const genredShows = shows.map(async (show, i) => {
    const showStart = Date.now();
    try {
      log(`(${i + 1}/${shows.length}) Fetching genre for "${show.artist}"...`);
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `In three words, what genre are the Bands ${show.artist}`,
      });
      const genre = response.text.replace('\n', '');
      // eslint-disable-next-line max-len
      log(`(${i + 1}/${shows.length}) "${show.artist}" -> ${genre} (${Date.now() - showStart}ms)`);
      return {
        ...show,
        genre,
      };
    } catch (error) {
      console.error(`Error processing show ${show.artist}:`, error);
      return show;
    }
  });
  const results = await Promise.all(genredShows);
  log(`Completed all shows in ${Date.now() - start}ms`);
  return results;
};

export {
  addShowsGenre,
  setDebug,
};
