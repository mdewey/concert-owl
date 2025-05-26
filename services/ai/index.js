import { GoogleGenAI } from '@google/genai';

const { GEMINI_API_KEY } = process.env;

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const addShowsGenre = async (shows) => {
  const genredShows = await shows.map(async (show) => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `In three words, what genre are the Bands ${show.artist}`,
    });
    return {
      ...show,
      genre: response.text.replace('\n', ''),
    };
  });
  return await Promise.all(genredShows);
};

export {
  addShowsGenre,
};
