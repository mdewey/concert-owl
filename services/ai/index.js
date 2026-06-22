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

/**
 * Genre matching is intentionally wide (any overlap counts), so it returns a
 * lot. Hand the matches to Gemini to narrow them to the strongest picks for the
 * vibe, each with a one-line reason. Falls back to overlap order if the model
 * call or its JSON parse fails, so a recommendation post never gets blocked.
 */
const narrowRecommendations = async ({ matches, vibe, limit = 10 }) => {
  if (!matches.length) return [];
  const topGenres = vibe.genres.slice(0, 15).map((g) => g.genre).join(', ');
  const list = matches.map((m, i) =>
    `${i + 1}. ${m.artist} — ${m.venue} (${m.date}) ` +
    `[overlap: ${m.overlap.join(', ')}]`).join('\n');
  const prompt =
    `My music taste leans toward these genres: ${topGenres}.\n\n` +
    `Here are upcoming concerts whose artists share some of those genres:\n` +
    `${list}\n\n` +
    `Pick up to ${limit} that best fit my vibe, strongest first. Respond with ` +
    `ONLY a JSON array; each item: ` +
    `{"index": <the number from the list>, "reason": "<one short sentence>"}.`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    const text = response.text.replace(/```json|```/g, '').trim();
    const picks = JSON.parse(text);
    return picks
      .map((p) => {
        const show = matches[p.index - 1];
        return show ? { ...show, reason: p.reason } : null;
      })
      .filter(Boolean);
  } catch (error) {
    console.error('AI narrowing failed; using overlap order:', error.message);
    return matches.slice(0, limit);
  }
};

export {
  addShowsGenre,
  narrowRecommendations,
  setDebug,
};
